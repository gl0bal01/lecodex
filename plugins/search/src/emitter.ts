import fs from "node:fs/promises"
import path from "node:path"
import type { FilePath, QuartzEmitterPlugin } from "@quartz-community/types"

export interface Heading {
  depth: number
  text: string
  slug: string // anchor within the page, not a page slug
}

// contentIndex.json already carries title, tags and body text per page. The
// search only lacks the headings, which the table-of-contents transformer
// leaves on file.data.toc, so emit just those instead of forking content-index.
export const SearchHeadings: QuartzEmitterPlugin = () => ({
  name: "SearchHeadings",
  async emit(ctx, content) {
    const headings: Record<string, Heading[]> = {}
    for (const [, file] of content) {
      const data = file.data as Record<string, unknown>
      const toc = data.toc as Heading[] | undefined
      if (toc?.length) headings[data.slug as string] = toc
    }
    const out = path.join(ctx.argv.output, "static", "searchHeadings.json")
    await fs.mkdir(path.dirname(out), { recursive: true })
    await fs.writeFile(out, JSON.stringify(headings))
    return [out as FilePath]
  },
})
