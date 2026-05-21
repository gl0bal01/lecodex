import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

type TocEntry = { slug: string; text: string; depth: number }
type TocNode = { entry: TocEntry; children: TocNode[] }

function buildTree(entries: TocEntry[]): TocNode[] {
  const roots: TocNode[] = []
  const stack: TocNode[] = []
  for (const e of entries) {
    const node: TocNode = { entry: e, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].entry.depth >= e.depth) {
      stack.pop()
    }
    if (stack.length === 0) {
      roots.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }
    stack.push(node)
  }
  return roots
}

function renderNodes(nodes: TocNode[]) {
  return (
    <ul class="mobile-toc-list">
      {nodes.map((n) => (
        <li key={n.entry.slug}>
          <a href={`#${n.entry.slug}`}>{n.entry.text}</a>
          {n.children.length > 0 && renderNodes(n.children)}
        </li>
      ))}
    </ul>
  )
}

const MobileTOC: QuartzComponent = ({ fileData, displayClass, cfg }: QuartzComponentProps) => {
  if (!fileData.toc || fileData.toc.length === 0) {
    return null
  }

  const tree = buildTree(fileData.toc as TocEntry[])

  return (
    <details class={classNames(displayClass, "mobile-toc")}>
      <summary>
        <span class="mobile-toc-label">{i18n(cfg.locale).components.tableOfContents.title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mobile-toc-fold"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </summary>
      <div class="mobile-toc-content">{renderNodes(tree)}</div>
    </details>
  )
}

MobileTOC.css = `
.mobile-toc {
  display: none;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  margin: 1rem 0 1.25rem;
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  background: color-mix(in srgb, var(--lightgray) 35%, transparent);
  overflow: hidden;
}
@media all and (max-width: 800px) {
  .mobile-toc.mobile-only {
    display: block;
    inline-size: 100%;
    align-self: stretch;
    margin-inline: 0;
  }
}
.mobile-toc > summary {
  list-style: none;
  cursor: pointer;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--headerFont);
  font-weight: 600;
  color: var(--dark);
  user-select: none;
  width: 100%;
  box-sizing: border-box;
}
.mobile-toc > summary::-webkit-details-marker {
  display: none;
}
.mobile-toc .mobile-toc-fold {
  transition: transform 0.2s ease;
  opacity: 0.7;
  flex-shrink: 0;
}
.mobile-toc[open] .mobile-toc-fold {
  transform: rotate(180deg);
}
.mobile-toc-content {
  padding: 0.25rem 1rem 0.85rem;
  width: 100%;
  box-sizing: border-box;
}
.mobile-toc-content .mobile-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.92rem;
}
.mobile-toc-content .mobile-toc-list .mobile-toc-list {
  padding-left: 1rem;
  margin-top: 0.2rem;
  border-left: 1px solid var(--lightgray);
}
.mobile-toc-content li {
  margin: 0.3rem 0;
  line-height: 1.4;
}
.mobile-toc-content li > a {
  color: var(--darkgray);
  background: none;
  padding: 0;
  display: block;
  width: 100%;
}
.mobile-toc-content li > a:hover {
  color: var(--secondary);
}
`

export default (() => MobileTOC) satisfies QuartzComponentConstructor
