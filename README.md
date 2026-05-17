# lecodex

Quartz 4 static site serving [intel-codex](https://github.com/gl0bal01/intel-codex) at https://lecodex.xyz.

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
./scripts/normalize-content.sh content
npx quartz build
npx quartz build --serve  # local preview
```

## Docker build

```bash
git clone --depth=1 https://github.com/gl0bal01/intel-codex.git content
docker build -t lecodex .
docker run --rm -p 8080:8080 lecodex
```

## Files

- `quartz.config.ts` — Quartz config (theme, plugins, baseUrl)
- `quartz.layout.ts` — page layout
- `Dockerfile` — multi-stage build → nginx alpine
- `nginx/` — nginx config (gzip, caching, security headers)
- `scripts/normalize-content.sh` — converts Docusaurus `:::` admonitions to Obsidian `> [!]` callouts
- `.github/workflows/build-deploy.yml` — builds + pushes image to ghcr.io
