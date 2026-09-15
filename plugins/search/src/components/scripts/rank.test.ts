import test, { describe } from "node:test"
import assert from "node:assert"
import { rankPages, type Doc } from "./rank"

const h = (slug: string, text: string, depth = 1) => ({ slug, text, depth })

// ids: 0 = page a, 1 = a#intro, 2 = a#usage, 3 = page b, 4 = b#setup, 5 = page c
const docs: Doc[] = [
  { slug: "a" },
  { slug: "a", heading: h("intro", "Intro") },
  { slug: "a", heading: h("usage", "Usage") },
  { slug: "b" },
  { slug: "b", heading: h("setup", "Setup") },
  { slug: "c" },
]

describe("rankPages", () => {
  test("title hit outranks a better-placed content hit", () => {
    const ranked = rankPages(
      [
        { field: "content", result: [5, 3] },
        { field: "title", result: [0, 1, 2, 3] }, // page a title at the end
      ],
      docs,
      8,
      3,
    )
    assert.deepStrictEqual(
      ranked.map((p) => p.slug),
      ["a", "b", "c"],
    )
    assert.strictEqual(ranked[0].titleHit, true)
    assert.strictEqual(ranked[2].contentHit, true)
    assert.strictEqual(ranked[2].titleHit, false)
  })

  test("heading hits attach to their page, best first, capped", () => {
    const ranked = rankPages([{ field: "heading", result: [4, 2, 1] }], docs, 8, 1)
    assert.deepStrictEqual(
      ranked.map((p) => p.slug),
      ["b", "a"],
    )
    assert.deepStrictEqual(
      ranked[1].headings.map((x) => x.slug),
      ["usage"],
    )
    assert.strictEqual(ranked[1].titleHit, false)
  })

  test("caps pages and ignores unknown ids", () => {
    const ranked = rankPages([{ field: "content", result: [0, 3, 5, 99] }], docs, 2, 3)
    assert.deepStrictEqual(
      ranked.map((p) => p.slug),
      ["a", "b"],
    )
  })
})
