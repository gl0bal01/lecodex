#!/usr/bin/env node
// Assert that every internal link in the built site resolves to something the
// server can actually return.
//
// The vault is authored for Obsidian, where a wikilink resolves by basename and
// a relative Markdown link resolves from the file. Quartz agrees with neither
// when its lookup misses: it falls back to resolving from the content root, so
// a link written for GitHub silently lands a level too high. Nothing in the
// vault can see that — the source link is valid — which is why the check has to
// run on public/ rather than on Markdown.
//
// Fragments are not resolved yet; only paths are.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, posix, relative, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(process.argv[2] ?? join(__dirname, "..", "public"))

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

const files = walk(root)
const servable = new Set(files.map((f) => relative(root, f).split("\\").join("/")))

// Quartz serves an extensionless URL from <path>.html, and a folder URL from
// its index.html, so a link is fine if any of those three exist.
const resolves = (path) =>
  servable.has(path) || servable.has(`${path}.html`) || servable.has(posix.join(path, "index.html"))

const skip = /^(https?:)?\/\/|^(mailto|tel|javascript|data):|^#/

const broken = []
for (const file of files.filter((f) => f.endsWith(".html"))) {
  const page = relative(root, file).split("\\").join("/")
  const pageDir = posix.dirname(page)
  const html = readFileSync(file, "utf8")

  for (const [, href] of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    if (!href || skip.test(href)) continue

    const [path] = href.split("#")[0].split("?")
    if (!path) continue

    const target = path.startsWith("/")
      ? posix.normalize(path).replace(/^\/+/, "")
      : posix.normalize(posix.join(pageDir, path))

    // Quartz emits one more `..` than the file tree suggests, because a page
    // stored at a/b/c.html is served at /a/b/c, where the browser resolves
    // relative links against /a/b/. The surplus segment climbs past the root,
    // and a browser clamps it there rather than failing — so clamp too, or
    // every correct link in the site reads as broken.
    const trimmed = target.replace(/^(\.\.\/)+/, "").replace(/\/+$/, "")
    const candidate = trimmed === "." || trimmed === "" ? "index.html" : trimmed
    if (!resolves(decodeURIComponent(candidate))) {
      broken.push({ page, href, reason: `no ${candidate}` })
    }
  }
}

const pages = files.filter((f) => f.endsWith(".html")).length
if (broken.length === 0) {
  console.log(`links OK: ${pages} pages, no broken internal links`)
  process.exit(0)
}

console.error(`FATAL: ${broken.length} broken internal link(s) across ${pages} pages`)
for (const { page, href, reason } of broken) {
  console.error(`  ${page}  ->  ${href}  (${reason})`)
}
process.exit(1)
