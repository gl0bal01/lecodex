import crypto from "crypto"
import fs from "fs"
import { FullSlug, QUARTZ, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"

// PWA offline support. Precache a minimal shell, serve navigations (including
// micromorph SPA fetches) network-first with cache fallback, and hashed assets
// cache-first. VERSION mixes the SW template and the byte contents of every
// precached shell asset, so swapping an icon or manifest.json invalidates the
// runtime caches on the next activate.
const SHELL_ASSET_FILES = ["manifest.json", "icon-192.png", "icon-512.png"] as const

const SW_TEMPLATE = (version: string) => `/* lecodex service worker */
const VERSION = ${JSON.stringify(version)};
const HTML_CACHE = "lecodex-html-" + VERSION;
const ASSET_CACHE = "lecodex-assets-" + VERSION;
const HTML_SHELL = ["/"];
const ASSET_SHELL = [
  "/static/manifest.json",
  "/static/icon-192.png",
  "/static/icon-512.png",
];
// Bounded HTML runtime cache to avoid unbounded growth (mobile Safari evicts
// the whole origin when quota is hit).
const MAX_HTML_ENTRIES = 50;
const HTML_PROTECTED = new Set(HTML_SHELL);
// Immutable hashed assets and JSON (search index, manifest). xml/txt (sitemap,
// RSS, robots) intentionally excluded so they revalidate every fetch.
const ASSET_EXT = /\\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico|map|json)$/i;

const isAssetRequest = (url) => ASSET_EXT.test(url.pathname);

// Serialize trim so overlapping HTML puts don't both compute the same
// evictable set and under-trim the cache.
let trimChain = Promise.resolve();
const capHtmlCache = () => {
  trimChain = trimChain
    .then(async () => {
      const cache = await caches.open(HTML_CACHE);
      const keys = await cache.keys();
      let excess = keys.length - MAX_HTML_ENTRIES;
      if (excess <= 0) return;
      for (const key of keys) {
        if (excess <= 0) break;
        if (HTML_PROTECTED.has(new URL(key.url).pathname)) continue;
        await cache.delete(key);
        excess--;
      }
    })
    .catch(() => {});
  return trimChain;
};

// Delete-then-put so revisits promote the entry to the tail (real LRU order,
// not FIFO on first-insertion).
const putHtml = async (req, res) => {
  const cache = await caches.open(HTML_CACHE);
  await cache.delete(req);
  await cache.put(req, res);
  await capHtmlCache();
};

const putAsset = async (req, res) => {
  const cache = await caches.open(ASSET_CACHE);
  await cache.put(req, res);
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(HTML_CACHE).then((c) => c.addAll(HTML_SHELL)),
      caches.open(ASSET_CACHE).then((c) => c.addAll(ASSET_SHELL)),
    ]),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k.startsWith("lecodex-") && k !== HTML_CACHE && k !== ASSET_CACHE,
            )
            .map((k) => caches.delete(k)),
        ),
      ),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isAssetRequest(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.status === 200) {
            // Clone synchronously before returning; extend SW lifetime so the
            // put isn't killed when respondWith settles.
            event.waitUntil(putAsset(req, res.clone()));
          }
          return res;
        } catch {
          return Response.error();
        }
      })(),
    );
    return;
  }

  // Everything else (navigations, micromorph SPA fetches, xml/txt feeds):
  // network-first, cache runtime copies, fall back to bucket-scoped cache
  // then shell offline.
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res && res.status === 200) {
          event.waitUntil(putHtml(req, res.clone()));
        }
        return res;
      } catch {
        const cache = await caches.open(HTML_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        const shell = await cache.match("/");
        if (shell) return shell;
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })(),
  );
});
`

export const ServiceWorker: QuartzEmitterPlugin = () => ({
  name: "ServiceWorker",
  async *emit({ argv }) {
    const hash = crypto.createHash("sha256").update(SW_TEMPLATE(""))
    for (const name of SHELL_ASSET_FILES) {
      const bytes = await fs.promises.readFile(joinSegments(QUARTZ, "static", name))
      hash.update(bytes)
    }
    const contentHash = hash.digest("hex").slice(0, 12)
    const version = process.env.LECODEX_SW_VERSION || contentHash
    yield write({
      ctx: { argv } as BuildCtx,
      slug: "sw" as FullSlug,
      ext: ".js",
      content: SW_TEMPLATE(version),
    })
  },
  async *partialEmit() {},
})
