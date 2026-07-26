import { i18n } from "../i18n"
import { FullSlug, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../../.quartz/plugins"

// lecodex SEO additions: canonical, manifest, theme-color, twitter:site/creator,
// og:url fix for homepage, og:image:type fix.
const TWITTER_HANDLE = "@gl0bal01"
const THEME_COLOR_LIGHT = "#f7fafc"
const THEME_COLOR_DARK = "#07090f"

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")
    const icon192Path = joinSegments(baseDir, "static/icon-192.png")
    const icon512Path = joinSegments(baseDir, "static/icon-512.png")
    const appleTouchIconPath = joinSegments(baseDir, "static/apple-touch-icon.png")
    const manifestPath = joinSegments(baseDir, "static/manifest.json")
    const swPath = joinSegments(baseDir, "sw.js")

    // Fix homepage url: Quartz appends "/index"; canonical should be "/" for homepage.
    const isHome = fileData.slug === "index"
    const socialUrl = isHome
      ? url.toString()
      : fileData.slug === "404"
        ? url.toString()
        : joinSegments(url.toString(), fileData.slug!)
    const canonicalUrl = socialUrl.endsWith("/") ? socialUrl : socialUrl + "/"

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`
    const robotsContent = fileData.frontmatter?.noindex ? "noindex, nofollow" : "index, follow"

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content={robotsContent} />
        <meta name="author" content="gl0bal01" />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="manifest" href={manifestPath} />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content={THEME_COLOR_LIGHT}
        />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content={THEME_COLOR_DARK} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={cfg.pageTitle} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIconPath} />
        <link rel="icon" type="image/png" sizes="192x192" href={icon192Path} />
        <link rel="icon" type="image/png" sizes="512x512" href={icon512Path} />

        <meta property="og:site_name" content={cfg.pageTitle} />
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={cfg.locale?.replace("-", "_") ?? "en_US"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={TWITTER_HANDLE} />
        <meta name="twitter:creator" content={TWITTER_HANDLE} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />
        <meta name="twitter:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta property="og:image:type" content="image/png" />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="twitter:url" content={canonicalUrl} />
          </>
        )}

        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register(${JSON.stringify(swPath)}).catch(function(){});});}`,
          }}
        />
        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
