import FlexSearch from "flexsearch"
import { registerEscapeHandler } from "@quartz-community/utils"
import { rankPages, type Doc, type Heading, type Hit, type RankedPage } from "./rank"

interface Page {
  slug: string
  title: string
  content: string
  tags: string[]
}

const MAX_PAGES = 12
const MAX_HEADINGS = 3
const HIT_LIMIT = 40
const SNIPPET_WORDS = 14

const encoder = (str: string): string[] => {
  const tokens: string[] = []
  let bufferStart = -1
  let bufferEnd = -1
  const lower = str.toLowerCase()
  let i = 0

  for (const char of lower) {
    const code = char.codePointAt(0)!

    const isCJK =
      (code >= 0x3040 && code <= 0x309f) ||
      (code >= 0x30a0 && code <= 0x30ff) ||
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0x20000 && code <= 0x2a6df)

    const isWhitespace = code === 32 || code === 9 || code === 10 || code === 13

    if (isCJK) {
      if (bufferStart !== -1) {
        tokens.push(lower.slice(bufferStart, bufferEnd))
        bufferStart = -1
      }
      tokens.push(char)
    } else if (isWhitespace) {
      if (bufferStart !== -1) {
        tokens.push(lower.slice(bufferStart, bufferEnd))
        bufferStart = -1
      }
    } else {
      if (bufferStart === -1) bufferStart = i
      bufferEnd = i + 1
    }
    i += char.length
  }

  if (bufferStart !== -1) {
    tokens.push(lower.slice(bufferStart))
  }

  return tokens
}

const index = new FlexSearch.Document({
  encode: encoder,
  document: {
    id: "id",
    index: [
      { field: "title", tokenize: "forward" },
      { field: "heading", tokenize: "forward" },
      { field: "content", tokenize: "forward" },
      { field: "tags", tokenize: "forward" },
    ],
  },
})

let pages: Record<string, Page> = {}
const docs: Doc[] = []
let loading: Promise<void> | null = null

function loadIndex(): Promise<void> {
  loading ??= (async () => {
    const [raw, headings]: [any, Record<string, Heading[]>] = await Promise.all([
      fetch("/static/contentIndex.json").then((r) => r.json()),
      fetch("/static/searchHeadings.json").then((r) => (r.ok ? r.json() : {})),
    ])
    pages = raw.content ?? raw
    for (const [slug, page] of Object.entries(pages)) {
      const id = docs.push({ slug }) - 1
      await index.addAsync(id, {
        id,
        title: page.title ?? "",
        heading: "",
        content: page.content ?? "",
        tags: page.tags ?? [],
      })
      for (const heading of (headings[slug] ?? []) as Heading[]) {
        const hid = docs.push({ slug, heading }) - 1
        await index.addAsync(hid, { id: hid, heading: heading.text })
      }
    }
  })()
  return loading
}

async function search(term: string): Promise<RankedPage[]> {
  const tagMode = term.startsWith("#")
  const query = tagMode ? term.slice(1).trim() : term.trim()
  if (!query) return []
  await loadIndex()
  const hits = (await index.searchAsync({
    query,
    limit: HIT_LIMIT,
    index: tagMode ? ["tags"] : ["title", "heading", "content"],
  })) as unknown as Hit[]
  return rankPages(hits, docs, MAX_PAGES, MAX_HEADINGS)
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// ponytail: highlights after escaping, so a query like "amp" can also light up
// inside an "&amp;" entity. Walk text nodes instead if that ever matters.
function highlight(term: string, text: string, preEscaped = false): string {
  const tokens = term.split(/\s+/).filter(Boolean).map(escapeRegex)
  const safe = preEscaped ? text : escapeHtml(text)
  if (tokens.length === 0) return safe
  return safe.replace(
    new RegExp(`(${tokens.join("|")})`, "gi"),
    '<span class="highlight">$1</span>',
  )
}

// Page content in contentIndex.json is already HTML-escaped by Quartz's description transformer.
function snippet(term: string, content: string): string {
  const words = content.split(/\s+/).filter(Boolean)
  const tokens = term.toLowerCase().split(/\s+/).filter(Boolean)
  const first = words.findIndex((w) => tokens.some((t) => w.toLowerCase().includes(t)))
  const start = Math.max(0, first - 4)
  const slice = words.slice(start, start + SNIPPET_WORDS).join(" ")
  const tail = start + SNIPPET_WORDS < words.length ? "…" : ""
  return (start > 0 ? "…" : "") + highlight(term, slice, true) + tail
}

const sectionOf = (slug: string) => slug.split("/").slice(0, -1).join(" › ").replace(/[-_]/g, " ")

const DOC_ICON =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2.5h7l3 3v12H5z"/><path d="M12 2.5v3h3M8 10h4M8 13h4"/></svg>'

function renderRow(cls: string, href: string, icon: string, body: string): string {
  return `<a class="result-row ${cls}" href="${escapeHtml(href)}">
    <span class="result-icon">${icon}</span>
    <span class="result-body">${body}</span>
  </a>`
}

function render(results: RankedPage[], term: string, noResults: string): string {
  if (results.length === 0) {
    return `<div class="result-empty">${noResults} “${escapeHtml(term)}”</div>`
  }
  const tagMode = term.startsWith("#")
  const query = tagMode ? term.slice(1).trim() : term
  const groups = new Map<string, string[]>()

  for (const r of results) {
    const page = pages[r.slug]
    if (!page) continue
    const rows: string[] = []
    let body = `<span class="result-title">${highlight(tagMode ? "" : query, page.title)}</span>`
    if (tagMode) {
      const pills = page.tags
        .map(
          (t) =>
            `<span class="${t.toLowerCase().includes(query.toLowerCase()) ? "match-tag" : ""}">#${escapeHtml(t)}</span>`,
        )
        .join("")
      body += `<span class="result-tags">${pills}</span>`
    } else if (r.contentHit) {
      body += `<span class="result-snippet">${snippet(query, page.content)}</span>`
    }
    rows.push(renderRow("result-page", "/" + r.slug, DOC_ICON, body))
    for (const h of r.headings) {
      const text = `<span class="result-title">${highlight(query, h.text)}</span>`
      rows.push(renderRow("result-heading", `/${r.slug}#${h.slug}`, "#", text))
    }
    const section = sectionOf(r.slug)
    groups.set(section, [...(groups.get(section) ?? []), ...rows])
  }

  return [...groups]
    .map(
      ([section, rows]) =>
        `<div class="result-group">${section ? `<h4>${escapeHtml(section)}</h4>` : ""}${rows.join("")}</div>`,
    )
    .join("")
}

const cleanupFns: Array<() => void> = []

function setupSearch() {
  for (const searchEl of Array.from(document.querySelectorAll(".search"))) {
    const container = searchEl.querySelector<HTMLElement>(".search-container")
    const button = searchEl.querySelector<HTMLElement>(".search-button")
    const bar = searchEl.querySelector<HTMLInputElement>(".search-bar")
    const layout = searchEl.querySelector<HTMLElement>(".search-layout")
    if (!container || !button || !bar || !layout) continue

    const noResults = layout.dataset.noResults ?? "No results for"
    const kbd = button.querySelector(".search-kbd")
    if (kbd && /Mac|iPhone|iPad/.test(navigator.platform)) kbd.textContent = "⌘ K"
    let focused: HTMLElement | null = null

    const rows = () => Array.from(layout.querySelectorAll<HTMLElement>("a.result-row"))

    const setFocus = (el: HTMLElement | null) => {
      focused?.classList.remove("focus")
      focused = el
      focused?.classList.add("focus")
      focused?.scrollIntoView({ block: "nearest" })
    }

    const moveFocus = (delta: number) => {
      const all = rows()
      if (all.length === 0) return
      const i = focused ? all.indexOf(focused) : -1
      setFocus(all[Math.min(Math.max(i + delta, 0), all.length - 1)])
    }

    const hide = () => {
      container.classList.remove("active")
      bar.value = ""
      layout.innerHTML = ""
      layout.classList.remove("display-results")
      focused = null
    }

    const show = (prefix = "") => {
      container.classList.add("active")
      bar.value = prefix
      bar.focus()
    }

    const onType = async () => {
      const term = bar.value
      layout.classList.toggle("display-results", term.trim() !== "")
      if (term.trim() === "") {
        layout.innerHTML = ""
        focused = null
        return
      }
      const results = await search(term)
      if (term !== bar.value) return // a newer keystroke owns the panel now
      layout.innerHTML = render(results, term, noResults)
      focused = null
      setFocus(rows()[0] ?? null)
    }

    const onLayoutClick = (e: MouseEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if ((e.target as HTMLElement).closest("a.result-row")) hide()
    }
    const onLayoutHover = (e: MouseEvent) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>("a.result-row")
      if (row && row !== focused) setFocus(row)
    }

    const onBarKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || (e.shiftKey && e.key === "Tab")) {
        e.preventDefault()
        moveFocus(-1)
      } else if (e.key === "ArrowDown" || e.key === "Tab") {
        e.preventDefault()
        moveFocus(1)
      } else if (e.key === "Enter") {
        focused?.click()
      }
    }

    const onDocumentKeydown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      if (e.shiftKey) show("#")
      else if (container.classList.contains("active")) hide()
      else show()
    }

    const onButtonClick = (e: Event) => {
      e.stopPropagation()
      show()
    }

    button.addEventListener("click", onButtonClick)
    bar.addEventListener("input", onType)
    bar.addEventListener("keydown", onBarKeydown)
    layout.addEventListener("click", onLayoutClick)
    layout.addEventListener("mouseover", onLayoutHover)
    document.addEventListener("keydown", onDocumentKeydown)
    cleanupFns.push(
      () => button.removeEventListener("click", onButtonClick),
      () => bar.removeEventListener("input", onType),
      () => bar.removeEventListener("keydown", onBarKeydown),
      () => layout.removeEventListener("click", onLayoutClick),
      () => layout.removeEventListener("mouseover", onLayoutHover),
      () => document.removeEventListener("keydown", onDocumentKeydown),
      registerEscapeHandler(container, hide),
    )
  }
}

function onNav() {
  cleanupFns.forEach((fn) => fn())
  cleanupFns.length = 0
  setupSearch()
  // Bind the UI first; indexing ~2k records takes a moment and search() awaits it.
  loadIndex()
}

document.addEventListener("nav", onNav)
document.addEventListener("render", onNav)
