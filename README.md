# lecodex

Quartz 5 static site serving [intel-codex](https://github.com/gl0bal01/intel-codex) at https://lecodex.xyz.

## Architecture

```
intel-codex (vault) --push--> [GH Actions: dispatch] --repository_dispatch--> lecodex (this repo)
                                                                                 |
                                                                  [GH Actions: build]
                                                                                 |
                                                                    ghcr.io/gl0bal01/lecodex:latest
                                                                                 |
                                                              [server: watchtower polls 60s] -> Traefik -> lecodex.xyz
```

## Local build

```bash
git clone --depth=1 https://github.com/gl0bal01/intel-codex.git content
npm ci
npm run build-plugins        # compile the local plugins under plugins/
npm run install-plugins      # clone + build community plugins into .quartz/plugins
./scripts/normalize-content.sh content
npx quartz build
npx quartz build --serve  # local preview
```

Quartz 5 keeps plugins outside the repo. `install-plugins` reads
`quartz.config.yaml`, installs each source at the commit pinned in
`quartz.lock.json`, and symlinks the local ones from `plugins/`. It needs
network access and takes a few minutes on a cold cache.

## Docker build

```bash
git clone --depth=1 https://github.com/gl0bal01/intel-codex.git content
docker build -t lecodex .
docker run --rm -p 8080:8080 lecodex
```

## Files

- `quartz.config.yaml` — Quartz config: theme, plugin list, and layout positions
- `quartz.lock.json` — pinned plugin commits
- `plugins/` — local plugins (landing hero, branded footer, mobile TOC, service worker)
- `scripts/build-local-plugins.mjs` — compiles `plugins/*/src` to importable ESM
- `Dockerfile` — multi-stage build → nginx alpine
- `nginx/` — nginx config (gzip, caching, security headers)
- `scripts/normalize-content.sh` — converts Docusaurus `:::` admonitions to Obsidian `> [!]` callouts
- `.github/workflows/build-deploy.yml` — builds + pushes image to ghcr.io
