import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { strings } from "../i18n"
import style from "./styles/search.scss"
// @ts-expect-error - bundled into a string by scripts/build-local-plugins.mjs
import script from "./scripts/search.inline.ts"

const Search: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
  const t = strings(cfg.locale)
  return (
    <div class={["search", displayClass].filter(Boolean).join(" ")}>
      <button class="search-button">
        <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.9 19.7">
          <title>{t.title}</title>
          <g class="search-path" fill="none">
            <path stroke-linecap="square" d="M18.5 18.3l-5.4-5.4" />
            <circle cx="8" cy="8" r="7" />
          </g>
        </svg>
        <p>{t.title}</p>
        <kbd class="search-kbd">Ctrl K</kbd>
      </button>
      <div class="search-container">
        <div class="search-space">
          <input
            autocomplete="off"
            class="search-bar"
            name="search"
            type="text"
            aria-label={t.placeholder}
            placeholder={t.placeholder}
          />
          <div class="search-layout" data-no-results={t.noResults}></div>
        </div>
      </div>
    </div>
  )
}

Search.afterDOMLoaded = script
Search.css = style

export default (() => Search) satisfies QuartzComponentConstructor
