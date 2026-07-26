#!/usr/bin/env node
// Repair community plugins that `quartz plugin install` could not build.
//
// Several quartz-community repos run `tsup` from their build script without
// declaring it as a devDependency, so the install-time build fails in a clean
// environment and leaves the plugin without dist/. A few others end up with an
// incomplete node_modules. Both cases are recoverable: reinstall dependencies
// with tsup forced in, then build again.
import { existsSync, readdirSync, rmSync, statSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pluginsDir = join(__dirname, "..", ".quartz", "plugins")

if (!existsSync(pluginsDir)) {
  console.log("no .quartz/plugins directory — nothing to repair")
  process.exit(0)
}

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, CI: "1" } })

// The latex plugin depends on rehype-mathjax 6, which expects the mathjax-full 3
// file layout; npm resolves mathjax-full 4 (different layout) and its postinstall
// build fails, leaving a package directory with no package.json in it.
function repairLatexMathjax() {
  const dir = join(pluginsDir, "latex")
  if (!existsSync(dir)) return
  const marker = join(dir, "node_modules", "mathjax-full", "js", "output", "svg.js")
  if (existsSync(marker)) return
  console.log("repairing latex: reinstalling mathjax-full@3")
  try {
    rmSync(join(dir, "node_modules", "mathjax-full"), { recursive: true, force: true })
    run("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", "mathjax-full@^3"], dir)
  } catch {
    console.error("could not repair latex mathjax dependency")
  }
}

const broken = readdirSync(pluginsDir).filter((name) => {
  const dir = join(pluginsDir, name)
  if (!statSync(dir).isDirectory()) return false
  // Local plugins are symlinks built by build-local-plugins.mjs.
  if (!existsSync(join(dir, "package.json"))) return false
  return !existsSync(join(dir, "dist", "index.js"))
})

repairLatexMathjax()

if (broken.length === 0) {
  console.log("all installed plugins have a build")
  process.exit(0)
}

console.log(`repairing ${broken.length} plugin(s): ${broken.join(", ")}`)

let failed = []
for (const name of broken) {
  const dir = join(pluginsDir, name)
  try {
    run("npm", ["install", "--no-audit", "--no-fund", "tsup@^8"], dir)
    run("npx", ["--no-install", "tsup"], dir)
    console.log(`repaired ${name}`)
  } catch {
    failed.push(name)
    console.error(`could not repair ${name}`)
  }
}

if (failed.length > 0) {
  console.error(`still broken: ${failed.join(", ")}`)
  process.exit(1)
}
