import { getMakeModel, type SeoMakeModel } from '@/lib/seo'

// ---------------------------------------------------------------------------
// Curated head-to-head aircraft comparison pages (`/aircraft/compare/[slug]`).
//
// Targets the very high-volume "{model} vs {model}" buyer query class with real,
// substantively-unique side-by-side content. Each page is built ENTIRELY from the
// existing curated MODEL_SPECS + MODEL_HIGHLIGHTS tables (via getMakeModel) plus a
// hand-written, non-fabricated `intro` — so there are NO invented figures and the
// copy never goes stale. The set is hand-curated (NOT every combination) so we never
// publish thin/near-duplicate combinatorial pages: both sides of every pair already
// carry a curated spec table + highlights, and the slug list is the single source of
// truth the route's generateStaticParams + the sitemap share (dynamicParams = false,
// so any non-curated slug 404s). Each comparison cross-links to both model hubs,
// flowing crawl equity from the indexed seed pages into and across this new family.
// ---------------------------------------------------------------------------

type ModelRef = { makeSlug: string; modelSlug: string }

export type Comparison = {
  /** URL slug, e.g. "cessna-172-vs-cirrus-sr22". The single source of truth. */
  slug: string
  a: ModelRef
  b: ModelRef
  /** Unique editorial intro (2–3 sentences). Real, well-known characteristics only. */
  intro: string
}

// Each pair below has curated MODEL_SPECS + MODEL_HIGHLIGHTS on BOTH sides (verified
// against seo.ts), so every page renders a full two-column spec table + highlights.
export const COMPARISONS: Comparison[] = [
  {
    slug: 'cessna-172-vs-cirrus-sr22',
    a: { makeSlug: 'cessna', modelSlug: '172' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    intro:
      'The Cessna 172 and the Cirrus SR22 sit at opposite ends of the single-engine spectrum, which is exactly why buyers compare them. The 172 is the most-produced, easiest-to-own trainer ever built — forgiving, cheap to run, and supported everywhere. The SR22 is a fast, 300-plus-horsepower composite cross-country machine with a glass panel and a whole-airframe parachute, at a much higher purchase and operating cost. One is the safe, low-drama first airplane; the other is a serious traveler you grow into.',
  },
  {
    slug: 'cessna-172-vs-piper-cherokee',
    a: { makeSlug: 'cessna', modelSlug: '172' },
    b: { makeSlug: 'piper', modelSlug: 'cherokee' },
    intro:
      'The Cessna 172 and the Piper Cherokee (PA-28) are the two default fixed-gear four-seat trainers, and the choice usually comes down to high wing versus low wing. The high-wing 172 gives shade, easy entry, and great downward visibility; the low-wing Cherokee feels a touch sportier and has a single cabin door. Both are simple, forgiving, and cheap to maintain with enormous parts and instructor support — making either an ideal first airplane or first partnership.',
  },
  {
    slug: 'cessna-172-vs-cessna-182',
    a: { makeSlug: 'cessna', modelSlug: '172' },
    b: { makeSlug: 'cessna', modelSlug: '182' },
    intro:
      'The Cessna 172 Skyhawk and 182 Skylane share a high-wing layout and Cessna’s legendary support network, so the comparison is really about how much airplane you need. The 172 is lighter, cheaper to run, and the classic trainer. The 182 adds a bigger engine, a constant-speed prop, and the useful load to carry four adults with full fuel and bags — a genuine family hauler that costs more per hour to feed. Many owners step up from one to the other.',
  },
  {
    slug: 'cirrus-sr20-vs-cirrus-sr22',
    a: { makeSlug: 'cirrus', modelSlug: 'sr20' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    intro:
      'The Cirrus SR20 and SR22 share the same composite airframe, glass cockpit, and CAPS whole-airframe parachute, so a buyer is really choosing how much power and speed to pay for. The SR20’s smaller engine makes it the more attainable step-up and a common first Cirrus, with lower fuel and overhaul costs. The SR22’s 310 hp delivers markedly faster cruise and more useful load for serious cross-country flying — at a higher purchase price and running cost.',
  },
  {
    slug: 'cirrus-sr22-vs-beechcraft-bonanza',
    a: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    b: { makeSlug: 'beechcraft', modelSlug: 'bonanza' },
    intro:
      'The Cirrus SR22 and the Beechcraft Bonanza are the two benchmark high-performance singles, and the decision splits along modern-composite versus classic-metal lines. The SR22 brings a parachute, a glass panel, fixed gear, and a car-like cabin in a newer composite airframe. The Bonanza is the storied retractable-gear traveler with top-tier build quality, ramp presence, and a six-seat cabin. Both are fast; expect premium upkeep either way, which is why both are so commonly co-owned.',
  },
  {
    slug: 'cirrus-sr22-vs-cirrus-sr22t',
    a: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22t' },
    intro:
      'The Cirrus SR22 and the turbo-normalized SR22T are the same airframe with the same parachute and glass panel — the difference is altitude. The normally-aspirated SR22 is the simpler, less expensive choice that performs best down low. The SR22T adds a turbocharger and oxygen so it cruises in the high teens and flight levels, topping weather and crossing high terrain the SR22 cannot, in exchange for a higher fuel burn and a turbo-overhaul reserve. The right pick depends on whether you actually fly high and long.',
  },
  {
    slug: 'piper-cherokee-vs-piper-arrow',
    a: { makeSlug: 'piper', modelSlug: 'cherokee' },
    b: { makeSlug: 'piper', modelSlug: 'arrow' },
    intro:
      'The Piper Cherokee and the Piper Arrow are close cousins in the PA-28 family, so the comparison is about simplicity versus complexity. The fixed-gear Cherokee is one of the most economical and predictable singles to own — an ideal first airplane and first partnership. The Arrow adds retractable gear and a constant-speed prop, making it the classic complex-endorsement and commercial time-builder with a bit more speed, at a modest premium in insurance and maintenance.',
  },
  {
    slug: 'cessna-182-vs-cirrus-sr22',
    a: { makeSlug: 'cessna', modelSlug: '182' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    intro:
      'The Cessna 182 Skylane and the Cirrus SR22 are both four-seat cross-country singles, but they represent two different eras. The high-wing 182 is a rugged, load-hauling, fixed-gear classic that flies into rough strips and carries a real family with bags. The SR22 is faster and more modern — composite airframe, glass panel, side-yoke, and a CAPS parachute — built for covering distance quickly. The 182 generally costs less to buy and run; the SR22 trades that for speed and technology.',
  },
]

const BY_SLUG = new Map(COMPARISONS.map((c) => [c.slug, c]))

export function getComparison(slug: string): Comparison | undefined {
  return BY_SLUG.get(slug)
}

export function getAllComparisonSlugs(): string[] {
  return COMPARISONS.map((c) => c.slug)
}

/** Resolve a ModelRef to its full curated SeoMakeModel (with specTable/highlights),
 *  or null if it isn't curated (should never happen for a vetted COMPARISONS entry). */
export function resolveComparisonModel(ref: ModelRef): SeoMakeModel | null {
  return getMakeModel(ref.makeSlug, ref.modelSlug)
}

/** Curated comparisons that feature a given model family (either side) — used to
 *  link from the model hub page into this family. */
export function comparisonsForModel(makeSlug: string, modelSlug: string): Comparison[] {
  const m = makeSlug.toLowerCase()
  const md = modelSlug.toLowerCase()
  return COMPARISONS.filter(
    (c) =>
      (c.a.makeSlug === m && c.a.modelSlug === md) ||
      (c.b.makeSlug === m && c.b.modelSlug === md)
  )
}

/** Short display label for a comparison, e.g. "Cessna 172 vs Cirrus SR22".
 *  Returns null if either side fails to resolve (so callers can skip it). */
export function comparisonLabel(c: Comparison): string | null {
  const a = resolveComparisonModel(c.a)
  const b = resolveComparisonModel(c.b)
  if (!a || !b) return null
  return `${a.make} ${a.model} vs ${b.make} ${b.model}`
}
