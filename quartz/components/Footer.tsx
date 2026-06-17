import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"

interface Options {
  links: Record<string, string>
}

export default ((_opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    return (
      <footer class={`${displayClass ?? ""} site-footer`}>
        <div class="site-footer-grid">
          <div class="site-footer-brand">
            <div class="site-footer-mark">LE&nbsp;CODEX</div>
            <p class="site-footer-tagline">OSINT • Security • Forensics</p>
            <p class="site-footer-sub">
              Operational manual for digital investigators, security analysts, and OSINT
              practitioners.
            </p>
          </div>

          <div class="site-footer-col">
            <h4>Explore</h4>
            <ul>
              <li>
                <a href="/Investigations/">Investigations</a>
              </li>
              <li>
                <a href="/Security/">Security &amp; Pentesting</a>
              </li>
              <li>
                <a href="/CTF/">CTF</a>
              </li>
              <li>
                <a href="/Cases/">Cases</a>
              </li>
            </ul>
          </div>

          <div class="site-footer-col">
            <h4>Resources</h4>
            <ul>
              <li>
                <a href="/index.xml">RSS feed</a>
              </li>
              <li>
                <a href="/sitemap.xml">Sitemap</a>
              </li>
              <li>
                <a href="https://github.com/gl0bal01/intel-codex" rel="noopener" target="_blank">
                  Vault repo
                </a>
              </li>
              <li>
                <a href="https://github.com/gl0bal01/lecodex" rel="noopener" target="_blank">
                  Site repo
                </a>
              </li>
            </ul>
          </div>

          <div class="site-footer-col">
            <h4>About</h4>
            <ul>
              <li>
                <a href="https://gl0bal01.com/links" rel="noopener" target="_blank">
                  All my links
                </a>
              </li>
              <li>
                <a href="https://gl0bal01.com" rel="noopener" target="_blank">
                  gl0bal01.com
                </a>
              </li>
              <li>
                <a href="https://github.com/gl0bal01" rel="noopener" target="_blank">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="site-footer-bottom">
          <p>
            © {year} <strong>gl0bal01</strong> · Built with{" "}
            <a href="https://quartz.jzhao.xyz/" rel="noopener" target="_blank">
              Quartz v{version}
            </a>
          </p>
        </div>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
