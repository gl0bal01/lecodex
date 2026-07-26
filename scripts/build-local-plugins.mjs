#!/usr/bin/env node
// Build the local Quartz v5 plugins under plugins/ into importable ESM.
//
// Quartz loads plugins by dynamically importing their entry point at build
// time, so local plugins have to ship real JS — the same shape the
// quartz-community packages publish (dist/index.js + dist/components/index.js).
import { readdirSync, existsSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import esbuild from "esbuild"
import * as sass from "sass"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pluginsDir = join(__dirname, "..", "plugins")

// Kept external so plugins share the site's singletons rather than bundling
// a second copy of preact (which breaks hooks and hydration).
const EXTERNALS = [
  "preact",
  "preact/hooks",
  "preact/jsx-runtime",
  "preact/compat",
  "@quartz-community/types",
  "@quartz-community/utils",
  "@quartz-community/utils/*",
]

// Plugin stylesheets may `@use "variables.scss"` for the site's shared
// breakpoints, which lives in Quartz core rather than in the plugin.
const sassLoadPaths = [join(__dirname, "..", "quartz", "styles")]

const scssAsText = {
  name: "scss-as-text",
  setup(build) {
    build.onLoad({ filter: /\.scss$/ }, (args) => ({
      contents: sass.compile(args.path, { loadPaths: sassLoadPaths }).css,
      loader: "text",
    }))
    build.onLoad({ filter: /\.inline\.ts$/ }, async (args) => {
      const { promises: fs } = await import("node:fs")
      return { contents: await fs.readFile(args.path, "utf8"), loader: "text" }
    })
  },
}

const plugins = readdirSync(pluginsDir).filter((name) =>
  statSync(join(pluginsDir, name)).isDirectory(),
)

for (const name of plugins) {
  const root = join(pluginsDir, name)
  const entryPoints = {}
  if (existsSync(join(root, "src/index.ts"))) entryPoints["index"] = join(root, "src/index.ts")
  if (existsSync(join(root, "src/components/index.ts")))
    entryPoints["components/index"] = join(root, "src/components/index.ts")

  if (Object.keys(entryPoints).length === 0) {
    console.warn(`skipped ${name}: no src/index.ts`)
    continue
  }

  await esbuild.build({
    entryPoints,
    outdir: join(root, "dist"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: "es2022",
    sourcemap: true,
    jsx: "automatic",
    jsxImportSource: "preact",
    external: EXTERNALS,
    plugins: [scssAsText],
    logLevel: "warning",
  })
  console.log(`built plugin ${name}`)
}
