import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      "intel-codex repo": "https://github.com/gl0bal01/intel-codex",
      "gl0bal01.com": "https://gl0bal01.com",
    },
  }),
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
    Component.MobileOnly(Component.MobileTOC()),
  ],
  left: [
    Component.Flex({
      components: [
        { Component: Component.PageTitle(), grow: true },
        { Component: Component.Darkmode() },
        { Component: Component.DesktopOnly(Component.ReaderMode()) },
      ],
    }),
    Component.Search(),
    Component.Explorer(),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.Flex({
      components: [
        { Component: Component.PageTitle(), grow: true },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Search(),
    Component.Explorer(),
  ],
  right: [],
}
