FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# content/ is expected to be populated by CI (actions/checkout of intel-codex into ./content)
# Local builds can: git clone --depth=1 https://github.com/gl0bal01/intel-codex.git content
RUN ./scripts/normalize-content.sh && \
    npx quartz build && \
    printf 'User-agent: *\nAllow: /\n\nSitemap: https://lecodex.xyz/sitemap.xml\n' > public/robots.txt && \
    printf 'gl0bal01 / Le Codex — https://lecodex.xyz\n' > public/humans.txt && \
    LD='<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Le Codex","url":"https://lecodex.xyz","description":"OSINT investigation techniques, security procedures, real-world case studies.","inLanguage":"en-US","publisher":{"@type":"Person","name":"gl0bal01","url":"https://gl0bal01.com"},"potentialAction":{"@type":"SearchAction","target":"https://lecodex.xyz/?q={search_term_string}","query-input":"required name=search_term_string"}}</script>' && \
    find public -type f -name '*.html' -print0 | xargs -0 sed -i "s|</head>|${LD}</head>|"

FROM nginx:1.27-alpine AS runtime
RUN rm -rf /usr/share/nginx/html/*
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/public /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
