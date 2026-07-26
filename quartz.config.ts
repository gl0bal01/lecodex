import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "Le Codex",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: "lecodex.xyz",
    ignorePatterns: [
      "private",
      "templates",
      ".obsidian",
      ".github",
      ".claude",
      ".omc",
      "Case-Template",
      "Student-Exercises",
      "CLAUDE.md",
      "CONTRIBUTING.md",
    ],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "JetBrains Mono",
      },
      colors: {
        // Brand palette mirrors gl0bal01.com/links: deep navy ground, cyan accent.
        lightMode: {
          light: "#f7fafc",
          lightgray: "#dfe7f0",
          gray: "#8494ad",
          darkgray: "#3b4a63",
          dark: "#0d1326",
          secondary: "#0b7ea8",
          tertiary: "#1aa3c9",
          highlight: "rgba(102, 217, 255, 0.14)",
          textHighlight: "#66d9ff66",
        },
        darkMode: {
          light: "#07090f",
          lightgray: "#1c2438",
          gray: "#6c7a99",
          darkgray: "#b8c4dc",
          dark: "#e6edf7",
          secondary: "#66d9ff",
          tertiary: "#cfe9ff",
          highlight: "rgba(102, 217, 255, 0.10)",
          textHighlight: "#66d9ff44",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
        rssLimit: 50,
        rssFullHtml: false,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      Plugin.ServiceWorker(),
    ],
  },
}

export default config
