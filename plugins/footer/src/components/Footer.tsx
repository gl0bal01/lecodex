import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { readFileSync } from "fs"
import { join } from "path"
import style from "./styles/footer.scss"

interface Options {
  links: Record<string, string>
}

// Plugins are built separately from the site, so the Quartz version has to be
// read from the site's package.json at render time.
function getQuartzVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"))
    return pkg.version ?? ""
  } catch {
    return ""
  }
}

export default ((_opts?: Options) => {
  const version = getQuartzVersion()

  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    return (
      <footer class={`${displayClass ?? ""} site-footer`}>
        <div class="site-footer-main">
          <div class="site-footer-brand">
            <div class="site-footer-mark">LE&nbsp;CODEX</div>
            <p class="site-footer-tagline">OSINT • Security • Forensics</p>
            <p class="site-footer-sub">
              Operational manual for digital investigators, security analysts, and OSINT
              practitioners.
            </p>
          </div>

          <a
            class="site-footer-cta"
            href="https://gl0bal01.com/links"
            rel="noopener"
            target="_blank"
          >
            All my links
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="site-footer-bottom">
          <p>
            © {year} <strong>gl0bal01</strong> · Built with{" "}
            <a href="https://quartz.jzhao.xyz/" rel="noopener" target="_blank">
              Quartz{version ? ` v${version}` : ""}
            </a>
          </p>
        </div>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
