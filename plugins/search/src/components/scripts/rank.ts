// Algolia-style ranking: where a term matches matters more than how often.
// A title hit outranks a heading hit, which outranks a hit in body text.
// Position inside a field's result list is the tiebreak; tiers are far
// enough apart that a poor title match still beats the best content match.
export const FIELD_WEIGHT: Record<string, number> = {
  title: 300,
  tags: 200,
  heading: 100,
  content: 0,
}

export interface Heading {
  depth: number
  text: string
  slug: string
}

// What a FlexSearch document id points at: a page, or one heading in a page.
export interface Doc {
  slug: string
  heading?: Heading
}

export interface Hit {
  field: string
  result: (number | string)[]
}

export interface RankedPage {
  slug: string
  score: number
  titleHit: boolean
  contentHit: boolean
  headings: Heading[]
}

export function rankPages(
  hits: Hit[],
  docs: Doc[],
  maxPages: number,
  maxHeadings: number,
): RankedPage[] {
  const pages = new Map<string, RankedPage & { headingScores: Map<string, number> }>()

  for (const { field, result } of hits) {
    const weight = FIELD_WEIGHT[field] ?? 0
    result.forEach((id, i) => {
      const doc = docs[Number(id)]
      if (!doc) return
      const score = weight - i
      let page = pages.get(doc.slug)
      if (!page) {
        page = {
          slug: doc.slug,
          score: -Infinity,
          titleHit: false,
          contentHit: false,
          headings: [],
          headingScores: new Map(),
        }
        pages.set(doc.slug, page)
      }
      page.score = Math.max(page.score, score)
      if (doc.heading) {
        const prev = page.headingScores.get(doc.heading.slug) ?? -Infinity
        if (score > prev) page.headingScores.set(doc.heading.slug, score)
        if (prev === -Infinity) page.headings.push(doc.heading)
      } else if (field === "content") {
        page.contentHit = true
      } else {
        page.titleHit = true
      }
    })
  }

  return [...pages.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPages)
    .map(({ headingScores, ...page }) => ({
      ...page,
      headings: page.headings
        .sort((a, b) => headingScores.get(b.slug)! - headingScores.get(a.slug)!)
        .slice(0, maxHeadings),
    }))
}
