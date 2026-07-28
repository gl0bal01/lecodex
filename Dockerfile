# syntax=docker/dockerfile:1.9

# --- deps: keyed on package files only, so plugin work never reinstalls npm ---
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund

# --- plugins: the expensive stage (~13 min cold), keyed on plugin inputs ---
# git and CA certs are needed to clone the quartz-community repos; slim ships no
# CA bundle, and without one every clone fails TLS verification.
FROM deps AS plugins
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && \
    rm -rf /var/lib/apt/lists/*
COPY quartz/ ./quartz/
COPY scripts/ ./scripts/
COPY plugins/ ./plugins/
COPY quartz.lock.json quartz.config.yaml ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm run build-plugins && npm run install-plugins && \
    # Each installed plugin drags in its own node_modules (~2 GB across 27 of
    # them) to produce at most ~1 MB of dist. Every runtime import in those
    # bundles resolves from /app/node_modules instead — except
    # @quartz-community/*, where the plugins pin a build exporting ./jsx that
    # the root dependency lacks. Hoist that one package, drop the rest.
    mkdir -p .quartz/plugins/node_modules && \
    cp -R .quartz/plugins/content-page/node_modules/@quartz-community \
          .quartz/plugins/node_modules/@quartz-community && \
    for dir in .quartz/plugins/*; do \
      name=$(basename "$dir"); \
      # Skip the hoist dir, and skip symlinks — those point back at /app/plugins
      # and pruning through one would delete the local plugin sources. Only
      # node_modules goes: loadQuartzConfig re-validates every plugin directory
      # as a git repo on each build and re-clones over it if .git is missing.
      if [ "$name" != "node_modules" ] && [ ! -L "$dir" ]; then \
        rm -rf "$dir/node_modules"; \
      fi; \
    done && \
    find .quartz/plugins -name '*.js.map' -delete && \
    du -sh .quartz/plugins

# --- site: content changes only invalidate from here down ---
FROM deps AS site
WORKDIR /app
COPY . .
# After COPY . ., because .dockerignore excludes plugins/*/dist — otherwise the
# unbuilt local plugins would overwrite the built ones.
COPY --from=plugins /app/.quartz ./.quartz
COPY --from=plugins /app/plugins ./plugins

# The service worker hashes its own template plus the precached shell assets, so
# a CSS or script change alone would not change its cache version and installed
# clients would keep serving the old asset cache forever. Tie the version to the
# commit instead.
ARG GIT_SHA=dev
ENV LECODEX_SW_VERSION=${GIT_SHA}

# content/ is expected to be populated by CI (actions/checkout of intel-codex into ./content)
# Local builds can: git clone --depth=1 https://github.com/gl0bal01/intel-codex.git content
RUN ./scripts/normalize-content.sh && \
    npx quartz build && \
    printf 'User-agent: *\nAllow: /\n\nSitemap: https://lecodex.xyz/sitemap.xml\n' > public/robots.txt && \
    printf 'gl0bal01 / Le Codex — https://lecodex.xyz\n' > public/humans.txt && \
    LD='<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Le Codex","url":"https://lecodex.xyz","description":"OSINT investigation techniques, security procedures, real-world case studies.","inLanguage":"en-US","publisher":{"@type":"Person","name":"gl0bal01","url":"https://gl0bal01.com"},"potentialAction":{"@type":"SearchAction","target":"https://lecodex.xyz/?q={search_term_string}","query-input":"required name=search_term_string"}}</script>' && \
    find public -type f -name '*.html' -print0 | xargs -0 sed -i "s|</head>|${LD}</head>|" && \
    node ./scripts/finalize-sitemap.mjs && \
    # Lets CI assert that what is live is what it just published. Watchtower can
    # fail silently — it reported failed=0 while doing nothing for 26 days — so
    # the deploy needs an end-to-end check rather than a trusted exit code.
    printf '{"commit":"%s","builtAt":"%s"}\n' "${LECODEX_SW_VERSION}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > public/version.json

# --- verify: `quartz build` exits 0 even when plugins fail to load and emits a
# near-empty site, so assert the result rather than trusting the exit code ---
FROM site AS verify
RUN pages=$(find public -name '*.html' | wc -l) && \
    echo "emitted $pages html pages" && \
    [ "$pages" -ge 60 ] || { echo "FATAL: only $pages pages emitted — plugins likely failed to load"; exit 1; } && \
    for marker in landing-hero site-footer-mark mobile-toc explorer search-bar; do \
      grep -q "$marker" public/index.html || { echo "FATAL: homepage missing $marker"; exit 1; }; \
    done && \
    test -s public/sw.js || { echo "FATAL: service worker not emitted"; exit 1; } && \
    # The service worker precaches these on install; a missing one rejects
    # cache.addAll and offline support dies with no visible error.
    for asset in static/manifest.json static/icon-192.png static/icon-512.png; do \
      test -s "public/$asset" || { echo "FATAL: precached asset $asset missing"; exit 1; }; \
    done

FROM nginx:1.27-alpine-slim AS runtime
RUN rm -rf /usr/share/nginx/html/*
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=verify /app/public /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
