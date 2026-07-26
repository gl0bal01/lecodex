# Repository Guidelines

## Project Structure & Module Organization

This repository publishes the `lecodex` Quartz 4 static site. Markdown content lives in `content/`, usually synced from `gl0bal01/intel-codex`. Quartz source is under `quartz/`: UI components in `quartz/components/`, client scripts in `quartz/components/scripts/`, styles in `quartz/styles/` and `quartz/components/styles/`, plugins in `quartz/plugins/`, and helpers in `quartz/util/`. Site configuration is in `quartz.config.ts` and `quartz.layout.ts`. Deployment files include `Dockerfile`, `nginx/`, and `.github/workflows/build-deploy.yml`. `public/` contains generated output; prefer source edits unless intentionally refreshing build artifacts.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json` using Node from `.node-version`.
- `git clone --depth=1 https://github.com/gl0bal01/intel-codex.git content`: restore the external content vault.
- `./scripts/normalize-content.sh content`: convert Docusaurus admonitions to Quartz/Obsidian callouts.
- `npx quartz build`: build the static site into `public/`.
- `npx quartz build --serve`: build and serve a local preview.
- `npm run check`: run TypeScript type checks and Prettier in check mode.
- `npm test`: run `tsx --test` test suites.
- `docker build -t lecodex . && docker run --rm -p 8080:8080 lecodex`: verify the image locally.

## Coding Style & Naming Conventions

Use TypeScript ES modules. Prettier enforces 2-space indentation, `printWidth` 100, trailing commas, and no semicolons. Keep Preact/TSX components in PascalCase filenames such as `RecentNotes.tsx`; keep utilities, processors, and plugins in lower camelCase or descriptive lowercase names. Put global theme changes in `quartz/styles/`.

## Testing Guidelines

Tests use Node’s built-in test runner through `tsx --test`. Name tests `*.test.ts` and colocate them near the code under test, as in `quartz/util/path.test.ts` or `quartz/components/scripts/search.test.ts`. Add focused regression tests for path handling, search, processors, plugins, and security-sensitive parsing. Run `npm test` and `npm run check` before opening a PR.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit-style subjects: `feat(ui): ...`, `fix(mobile): ...`, `security: ...`, and `build(deps): ...`. Keep commits scoped and imperative. Pull requests should include a concise description, linked issue or deployment context when applicable, commands run, and screenshots for UI or mobile layout changes. Note changes to CSP, nginx headers, Docker behavior, or content synchronization explicitly.

## Security & Configuration Tips

Do not commit secrets, vault credentials, or local environment files. Preserve `.node-version`, `package-lock.json`, and CI parity with `npm ci`. Security headers and caching behavior are configured in `nginx/`; review them carefully when adding scripts, external resources, comments, search, or Mermaid-related behavior.
