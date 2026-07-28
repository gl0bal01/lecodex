#!/usr/bin/env node
// Post-process public/sitemap.xml after `quartz build`.
//
// Two corrections the content-index plugin does not make:
//  - it lists folder pages with a trailing slash, while the canonical (and the
//    URL nginx serves) has none, so the two disagreed
//  - individual tag listings are served noindex (see Head.tsx), and listing a
//    noindexed URL in the sitemap is a contradictory signal
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const sitemapPath = join(__dirname, "..", "public", "sitemap.xml")

const original = readFileSync(sitemapPath, "utf8")

// Keep the site root's slash: the pattern needs at least one path character.
let xml = original.replace(/<loc>(https:\/\/[^<]+?\/[^<]+?)\/<\/loc>/g, "<loc>$1</loc>")

const isTagListing = (loc) => {
  const path = loc.replace(/^https?:\/\/[^/]+/, "")
  return path.startsWith("/tags/") && path !== "/tags"
}

let dropped = 0
xml = xml.replace(/\s*<url>[\s\S]*?<\/url>/g, (block) => {
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]
  if (loc && isTagListing(loc)) {
    dropped++
    return ""
  }
  return block
})

writeFileSync(sitemapPath, xml)

const count = (s) => (s.match(/<loc>/g) ?? []).length
console.log(`sitemap: ${count(original)} -> ${count(xml)} URLs (${dropped} tag listings dropped)`)
