#!/usr/bin/env node
// Generate the lecodex icon set into quartz/static/.
// Run: node scripts/build-icons.mjs
//
// The wordmark used previously turned to mush below ~64px, so the favicon is an
// "LC" monogram instead: two heavy letterforms still resolve at 16px. Colours
// follow the brand palette (deep navy ground, cyan accent) shared with
// gl0bal01.com/links.
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const staticDir = join(__dirname, "..", "quartz", "static")

const NAVY_TOP = "#141c33"
const NAVY_BOTTOM = "#05060a"
const CYAN = "#66d9ff"
const CYAN_SOFT = "#cfe9ff"

// scale: fraction of the canvas the mark occupies. Maskable icons need the mark
// inside the safe zone (~80% circle), so they get a smaller one on a full-bleed
// background; standard icons can breathe wider.
function svg({ size, scale, rounded }) {
  const r = rounded ? size * 0.22 : 0
  const fontSize = size * 0.5 * (scale / 0.72)
  const ruleWidth = size * 0.42 * (scale / 0.72)
  const ruleY = size * 0.735
  const ruleThickness = Math.max(2, size * 0.038)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${NAVY_TOP}"/>
      <stop offset="100%" stop-color="${NAVY_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#glow)"/>
  <text x="50%" y="${size * 0.47}"
        font-family="DejaVu Sans, Helvetica, Arial, sans-serif"
        font-size="${fontSize}" font-weight="700"
        letter-spacing="${size * 0.01}"
        fill="#eaf6ff" text-anchor="middle" dominant-baseline="middle">LC</text>
  <rect x="${(size - ruleWidth) / 2}" y="${ruleY}" width="${ruleWidth}" height="${ruleThickness}"
        rx="${ruleThickness / 2}" fill="${CYAN}"/>
</svg>`
}

const targets = [
  { file: "icon.png", size: 512, scale: 0.72, rounded: true },
  { file: "icon-512.png", size: 512, scale: 0.72, rounded: true },
  { file: "icon-192.png", size: 192, scale: 0.72, rounded: true },
  { file: "apple-touch-icon.png", size: 180, scale: 0.66, rounded: false },
  { file: "icon-maskable-512.png", size: 512, scale: 0.52, rounded: false },
  { file: "icon-maskable-192.png", size: 192, scale: 0.52, rounded: false },
]

for (const { file, size, scale, rounded } of targets) {
  const out = join(staticDir, file)
  await sharp(Buffer.from(svg({ size, scale, rounded })))
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log(`wrote ${file} (${size}px)`)
}
