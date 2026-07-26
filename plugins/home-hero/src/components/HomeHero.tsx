import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { resolveRelative } from "@quartz-community/utils"
import type { FullSlug } from "@quartz-community/types"

type CardLink = {
  icon: string
  title: string
  desc: string
  cta: string
  slug: FullSlug | string
  external?: boolean
}

type Workflow = {
  title: string
  steps: { label: string; slug: FullSlug | string; external?: boolean }[]
}

const PILLS: { label: string; slug: FullSlug | string; external?: boolean }[] = [
  { label: "Legal & Ethics", slug: "Investigations/Techniques/sop-legal-ethics" as FullSlug },
  { label: "OPSEC Planning", slug: "Investigations/Techniques/sop-opsec-plan" as FullSlug },
  {
    label: "Workflow",
    slug: "https://github.com/gl0bal01/intel-codex/blob/main/Cases/Investigation-Workflow.md",
    external: true,
  },
  {
    label: "Glossary",
    slug: "https://github.com/gl0bal01/intel-codex/blob/main/Cases/Glossary.md",
    external: true,
  },
]

const CARDS: CardLink[] = [
  {
    icon: "🔍",
    title: "Investigations",
    desc: "Platform-specific OSINT for Twitter/X, Telegram, Discord, LinkedIn, Reddit, TikTok, Instagram, Bluesky.",
    cta: "Browse platforms",
    slug: "Investigations/Platforms/Platforms-Index" as FullSlug,
  },
  {
    icon: "🧰",
    title: "Techniques",
    desc: "Entity dossiers, collection logging, image & video, DNS/WHOIS, financial & AML, blockchain, darkweb.",
    cta: "Open techniques",
    slug: "Investigations/Techniques/Techniques-Index" as FullSlug,
  },
  {
    icon: "🛡️",
    title: "Security & Malware",
    desc: "Malware analysis, reverse engineering, forensics, cryptography, smart-contract audits, cloud forensics.",
    cta: "Analysis index",
    slug: "Security/Analysis/Analysis-Index" as FullSlug,
  },
  {
    icon: "⚔️",
    title: "Pentesting",
    desc: "Web, mobile, AD, Linux, cloud, wireless/RF, container & k8s, firmware, bug bounty, detection evasion.",
    cta: "Pentest playbooks",
    slug: "Security/Pentesting/Pentesting-Index" as FullSlug,
  },
  {
    icon: "📂",
    title: "Cases & Templates",
    desc: "Worked investigations, blank case templates, hands-on student exercises, visual workflow.",
    cta: "View cases",
    slug: "https://github.com/gl0bal01/intel-codex/blob/main/Cases/README.md",
    external: true,
  },
  {
    icon: "🚩",
    title: "CTF",
    desc: "Challenge methodology, reverse engineering, vuln research, cryptography for binary exploitation.",
    cta: "CTF methodology",
    slug: "CTF/CTF_Challenge_Methodology" as FullSlug,
  },
]

const WORKFLOWS: Workflow[] = [
  {
    title: "Start an investigation",
    steps: [
      { label: "Legal & Ethics", slug: "Investigations/Techniques/sop-legal-ethics" as FullSlug },
      { label: "OPSEC Planning", slug: "Investigations/Techniques/sop-opsec-plan" as FullSlug },
      {
        label: "Pick platform SOP",
        slug: "Investigations/Platforms/Platforms-Index" as FullSlug,
      },
      {
        label: "Log everything",
        slug: "Investigations/Techniques/sop-collection-log" as FullSlug,
      },
      {
        label: "Report",
        slug: "Investigations/Techniques/sop-reporting-packaging-disclosure" as FullSlug,
      },
    ],
  },
  {
    title: "Malware analysis",
    steps: [
      { label: "Malware SOP", slug: "Security/Analysis/sop-malware-analysis" as FullSlug },
      {
        label: "Reverse engineering",
        slug: "Security/Analysis/sop-reverse-engineering" as FullSlug,
      },
      {
        label: "Hash generation",
        slug: "Security/Analysis/sop-hash-generation-methods" as FullSlug,
      },
    ],
  },
  {
    title: "Forensics",
    steps: [
      { label: "Forensics SOP", slug: "Security/Analysis/sop-forensics-investigation" as FullSlug },
      {
        label: "Evidence integrity",
        slug: "Security/Analysis/sop-hash-generation-methods" as FullSlug,
      },
      { label: "Malware (if found)", slug: "Security/Analysis/sop-malware-analysis" as FullSlug },
    ],
  },
  {
    title: "Web pentest",
    steps: [
      {
        label: "OWASP Top 10",
        slug: "Security/Pentesting/sop-web-application-security" as FullSlug,
      },
      { label: "Bug bounty", slug: "Security/Pentesting/sop-bug-bounty" as FullSlug },
      {
        label: "Vuln research",
        slug: "Security/Pentesting/sop-vulnerability-research" as FullSlug,
      },
    ],
  },
  {
    title: "Mobile testing",
    steps: [
      { label: "iOS / Android", slug: "Security/Pentesting/sop-mobile-security" as FullSlug },
      {
        label: "Native code RE",
        slug: "Security/Analysis/sop-reverse-engineering" as FullSlug,
      },
      {
        label: "Crypto flaws",
        slug: "Security/Analysis/sop-cryptography-analysis" as FullSlug,
      },
    ],
  },
  {
    title: "IoT / firmware",
    steps: [
      {
        label: "Firmware RE",
        slug: "Security/Pentesting/sop-firmware-reverse-engineering" as FullSlug,
      },
      { label: "Binary RE", slug: "Security/Analysis/sop-reverse-engineering" as FullSlug },
      {
        label: "Vuln research",
        slug: "Security/Pentesting/sop-vulnerability-research" as FullSlug,
      },
    ],
  },
]

function linkHref(from: FullSlug, target: string, external?: boolean) {
  if (external) return target
  return resolveRelative(from, target as FullSlug)
}

const HomeHero: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  // v5 layout conditions only ship a `not-index` predicate, so the hero gates
  // itself rather than relying on a custom condition.
  if (fileData.slug !== "index") {
    return null
  }

  const from = fileData.slug!
  return (
    <div class="home-hero-root">
      <section class="landing-hero">
        <div class="landing-hero-mark">LE&nbsp;CODEX</div>
        <p class="landing-hero-tagline">OSINT • Security • Forensics</p>
        <p class="landing-hero-sub">
          Operational manual for digital investigators, security analysts, and OSINT practitioners.
        </p>
        <div class="landing-hero-stats">
          <span>
            <strong>41+</strong> SOPs
          </span>
          <span>
            <strong>20</strong> Investigations
          </span>
          <span>
            <strong>21</strong> Security
          </span>
          <span>
            <strong>9</strong> CTF
          </span>
        </div>
      </section>

      <section class="landing-quickstart">
        <h2>Start here</h2>
        <div class="landing-quickstart-grid">
          {PILLS.map((p) => (
            <a
              class="landing-pill"
              href={linkHref(from, p.slug, p.external)}
              {...(p.external ? { target: "_blank", rel: "noopener" } : {})}
            >
              {p.label}
            </a>
          ))}
        </div>
      </section>

      <section class="landing-cards">
        {CARDS.map((c) => (
          <a
            class="landing-card"
            href={linkHref(from, c.slug, c.external)}
            {...(c.external ? { target: "_blank", rel: "noopener" } : {})}
          >
            <div class="landing-card-head">
              <span class="landing-card-icon">{c.icon}</span>
              <h3>{c.title}</h3>
            </div>
            <p>{c.desc}</p>
            <span class="landing-card-cta">{c.cta} →</span>
          </a>
        ))}
      </section>

      <section class="landing-workflows">
        <h2>Common workflows</h2>
        <div class="landing-workflow-grid">
          {WORKFLOWS.map((w) => (
            <div class="landing-workflow">
              <h4>{w.title}</h4>
              <ol>
                {w.steps.map((s) => (
                  <li>
                    <a
                      href={linkHref(from, s.slug, s.external)}
                      {...(s.external ? { target: "_blank", rel: "noopener" } : {})}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

HomeHero.css = `
.home-hero-root {
  width: 100%;
}
body[data-slug="index"] .breadcrumb-container,
body[data-slug="index"] .article-title,
body[data-slug="index"] .content-meta,
body[data-slug="index"] .tags,
body[data-slug="index"] .center > article,
body[data-slug="index"] .center > hr,
body[data-slug="index"] .toc,
body[data-slug="index"] .mobile-toc {
  display: none !important;
}
body[data-slug="index"] .home-hero-root {
  display: block;
}

.landing-hero {
  text-align: center;
  padding: 3rem 1rem 2.5rem;
  margin: 0 0 2rem;
  border-radius: 14px;
  /* Cosmic ground stays dark in both modes — accent cyan is too light to sit under white text. */
  background:
    radial-gradient(circle at 50% 30%, rgba(102, 217, 255, 0.18), transparent 65%),
    linear-gradient(135deg, #0d1326, #05060a);
  border: 1px solid rgba(102, 217, 255, 0.16);
  color: #fff;
  position: relative;
  overflow: hidden;
}
.landing-hero::before,
.landing-hero::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #66d9ff 50%, transparent);
  opacity: 0.7;
}
.landing-hero::before { top: 0; }
.landing-hero::after { bottom: 0; }

.landing-hero-mark {
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1;
  margin: 0 0 0.5rem;
}
.landing-hero-tagline {
  font-size: clamp(0.85rem, 2.2vw, 1.05rem);
  letter-spacing: 0.4em;
  margin: 0 auto 1rem;
  color: #cfe9ff;
  text-transform: uppercase;
  font-weight: 500;
  position: relative;
  padding-top: 0.85rem;
}
.landing-hero-tagline::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 2px;
  background: #66d9ff;
}
.landing-hero-sub {
  max-width: 36rem;
  margin: 0 auto 1.5rem;
  font-size: 0.98rem;
  line-height: 1.55;
  color: color-mix(in srgb, #fff 90%, transparent);
}
.landing-hero-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem 2rem;
  font-size: 0.88rem;
  color: color-mix(in srgb, #fff 80%, transparent);
  letter-spacing: 0.05em;
}
.landing-hero-stats strong {
  color: #66d9ff;
  font-weight: 800;
  font-size: 1.1rem;
  margin-right: 0.35rem;
}

.landing-quickstart { margin: 0 0 2.5rem; }
.landing-quickstart > h2 {
  font-size: 1.05rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--darkgray) 70%, transparent);
  border-bottom: none !important;
  margin: 0 0 0.85rem !important;
  padding: 0 !important;
}
.landing-quickstart-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.landing-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.95rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--secondary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--secondary) 20%, transparent);
  color: var(--secondary) !important;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none !important;
  background-image: none !important;
  transition: all 150ms ease;
}
.landing-pill:hover {
  background: var(--secondary);
  color: var(--light) !important;
  transform: translateY(-1px);
}

.landing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  margin: 0 0 3rem;
}
.landing-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.25rem 1.1rem;
  border-radius: 12px;
  border: 1px solid var(--lightgray);
  background: color-mix(in srgb, var(--lightgray) 25%, transparent);
  color: var(--dark) !important;
  text-decoration: none !important;
  background-image: none !important;
  transition: all 180ms ease;
  position: relative;
  overflow: hidden;
}
.landing-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--secondary) 8%, transparent), transparent 60%);
  opacity: 0;
  transition: opacity 180ms ease;
  pointer-events: none;
}
.landing-card:hover {
  border-color: var(--secondary);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--secondary) 15%, transparent);
}
.landing-card:hover::before { opacity: 1; }
.landing-card-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}
.landing-card-icon { font-size: 1.6rem; line-height: 1; flex-shrink: 0; }
.landing-card-head > h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 !important;
  border: none !important;
  padding: 0 !important;
  color: var(--dark);
  line-height: 1.2;
}
.landing-card > p {
  font-size: 0.88rem;
  line-height: 1.5 !important;
  margin: 0 0 0.85rem;
  color: color-mix(in srgb, var(--darkgray) 90%, transparent);
  flex: 1;
}
.landing-card-cta {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary);
  letter-spacing: 0.02em;
}

.landing-workflows { margin: 0 0 2rem; }
.landing-workflows > h2 {
  font-size: 1.05rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--darkgray) 70%, transparent);
  border-bottom: none !important;
  margin: 0 0 1rem !important;
  padding: 0 !important;
}
.landing-workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.landing-workflow {
  padding: 0.95rem 1.1rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--lightgray);
  background: var(--light);
}
.landing-workflow > h4 {
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  margin: 0 0 0.5rem !important;
  color: var(--secondary) !important;
}
.landing-workflow > ol { margin: 0; padding-left: 1.1rem; font-size: 0.88rem; line-height: 1.55; }
.landing-workflow > ol > li { margin: 0.2rem 0; }
.landing-workflow > ol > li > a {
  background: none !important;
  background-image: none !important;
  padding: 0 !important;
}

@media all and (max-width: 800px) {
  .landing-hero { padding: 2rem 1rem 1.75rem; border-radius: 10px; }
  .landing-hero-stats { gap: 0.6rem 1.25rem; font-size: 0.82rem; }
  .landing-cards { grid-template-columns: 1fr; gap: 0.75rem; }
  .landing-workflow-grid { grid-template-columns: 1fr; }
}
`

export default (() => HomeHero) satisfies QuartzComponentConstructor
