#!/usr/bin/env node
// Generate quartz/static/og-image.png (1200x630) — LE CODEX brand share card.
// Run: node scripts/build-og-image.mjs
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import sharp from "sharp"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const outPath = join(__dirname, "..", "quartz", "static", "og-image.png")

const W = 1200
const H = 630
const ACCENT = "#c4604a"
const GOLD = "#c79a3a"
const DARK = "#2b0f0f"
const MID = "#7a2e2e"

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${MID}"/>
      <stop offset="100%" stop-color="${DARK}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle">
    <text x="${W / 2}" y="290" font-size="170" font-weight="900" fill="#ffffff" letter-spacing="6">LE CODEX</text>
    <line x1="${W / 2 - 140}" y1="335" x2="${W / 2 + 140}" y2="335" stroke="${GOLD}" stroke-width="4"/>
    <text x="${W / 2}" y="410" font-size="34" font-weight="500" fill="#f0d8b8" letter-spacing="8" font-family="'Helvetica Neue', Arial, sans-serif">OSINT &#x2022; SECURITY &#x2022; FORENSICS</text>
    <text x="${W / 2}" y="565" font-size="24" fill="${GOLD}" opacity="0.85" font-family="'Helvetica Neue', Arial, sans-serif" letter-spacing="3">lecodex.xyz</text>
  </g>
  <rect x="0" y="0" width="${W}" height="8" fill="${GOLD}" opacity="0.6"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${GOLD}" opacity="0.6"/>
</svg>`

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath)
console.log(`Wrote ${outPath}`)
