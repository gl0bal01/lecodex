import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const MobileTOC: QuartzComponent = ({ fileData, displayClass, cfg }: QuartzComponentProps) => {
  if (!fileData.toc || fileData.toc.length === 0) {
    return null
  }

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
      <ul class="mobile-toc-content">
        {fileData.toc.map((tocEntry) => (
          <li key={tocEntry.slug} class={`depth-${tocEntry.depth}`}>
            <a href={`#${tocEntry.slug}`}>{tocEntry.text}</a>
          </li>
        ))}
      </ul>
    </details>
  )
}

MobileTOC.css = `
.mobile-toc {
  display: none;
  margin: 1rem 0 1.25rem;
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  background: color-mix(in srgb, var(--lightgray) 35%, transparent);
  overflow: hidden;
}
@media all and (max-width: 800px) {
  .mobile-toc.mobile-only {
    display: block;
  }
}
.mobile-toc > summary {
  list-style: none;
  cursor: pointer;
  padding: 0.65rem 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--headerFont);
  font-weight: 600;
  color: var(--dark);
  user-select: none;
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
  list-style: none;
  margin: 0;
  padding: 0.25rem 0.9rem 0.85rem;
  font-size: 0.9rem;
}
.mobile-toc-content > li {
  margin: 0.25rem 0;
}
.mobile-toc-content > li > a {
  color: var(--darkgray);
  background: none;
  padding: 0;
  display: inline-block;
  line-height: 1.4;
}
.mobile-toc-content > li > a:hover {
  color: var(--secondary);
}
.mobile-toc-content .depth-0 { padding-left: 0; }
.mobile-toc-content .depth-1 { padding-left: 0.75rem; }
.mobile-toc-content .depth-2 { padding-left: 1.5rem; }
.mobile-toc-content .depth-3 { padding-left: 2.25rem; }
.mobile-toc-content .depth-4 { padding-left: 3rem; }
.mobile-toc-content .depth-5 { padding-left: 3.75rem; }
.mobile-toc-content .depth-6 { padding-left: 4.5rem; }
`

export default (() => MobileTOC) satisfies QuartzComponentConstructor
