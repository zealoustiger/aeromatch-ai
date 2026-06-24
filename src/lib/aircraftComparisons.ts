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
  /**
   * 3 genuine, evergreen head-to-head Q&As shown on the page + emitted as FAQPage
   * JSON-LD (visible text must match the structured data 1:1). Authored from the
   * `intro` + both sides' curated MODEL_SPECS / MODEL_HIGHLIGHTS — NO fabricated
   * figures and NO live listing counts, so the copy never goes stale.
   */
  faqs: { q: string; a: string }[]
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
    faqs: [
      { q: 'Is the Cirrus SR22 faster than the Cessna 172?', a: 'Yes, substantially. The SR22’s 310 hp gives roughly 183 kt cruise against about 124 kt for the 180 hp Cessna 172, so the SR22 covers ground far more quickly. The 172 trades that speed for simplicity and low operating cost.' },
      { q: 'Which is cheaper to own, a 172 or an SR22?', a: 'The 172, by a wide margin. It burns less fuel, has fixed gear and no parachute system, and its parts and maintenance are the most ubiquitous in aviation. The SR22 adds a bigger engine, glass-panel upkeep, and the periodic CAPS parachute repack — costs many owners share through co-ownership.' },
      { q: 'Which is the better first airplane?', a: 'For most new owners, the 172: it is forgiving, easy to insure, and inexpensive to run, which is why it is the default trainer. The SR22 is a high-performance cross-country machine better suited to a pilot ready to step up, ideally with type-specific transition training.' },
    ],
  },
  {
    slug: 'cessna-172-vs-piper-cherokee',
    a: { makeSlug: 'cessna', modelSlug: '172' },
    b: { makeSlug: 'piper', modelSlug: 'cherokee' },
    intro:
      'The Cessna 172 and the Piper Cherokee (PA-28) are the two default fixed-gear four-seat trainers, and the choice usually comes down to high wing versus low wing. The high-wing 172 gives shade, easy entry, and great downward visibility; the low-wing Cherokee feels a touch sportier and has a single cabin door. Both are simple, forgiving, and cheap to maintain with enormous parts and instructor support — making either an ideal first airplane or first partnership.',
    faqs: [
      { q: 'What is the main difference between a Cessna 172 and a Piper Cherokee?', a: 'Wing position. The 172 is a high-wing and the Cherokee (PA-28) a low-wing, but both are simple fixed-gear four-seat singles around 180 hp with similar cruise near 120 kt. The high wing gives shade and downward visibility; the low wing feels a touch sportier and uses a single cabin door.' },
      { q: 'Which is cheaper to maintain, a 172 or a Cherokee?', a: 'Both are among the least expensive four-seat singles to own, with huge parts supplies and near-universal mechanic familiarity, so running costs are very close. The choice usually comes down to high- versus low-wing preference rather than money.' },
      { q: 'Which is better for a first airplane or partnership?', a: 'Either is an excellent first airplane or first partnership — both are forgiving, well-supported, and economical to share. Pick by how you like to board the airplane and what you prefer to see out the window.' },
    ],
  },
  {
    slug: 'cessna-172-vs-cessna-182',
    a: { makeSlug: 'cessna', modelSlug: '172' },
    b: { makeSlug: 'cessna', modelSlug: '182' },
    intro:
      'The Cessna 172 Skyhawk and 182 Skylane share a high-wing layout and Cessna’s legendary support network, so the comparison is really about how much airplane you need. The 172 is lighter, cheaper to run, and the classic trainer. The 182 adds a bigger engine, a constant-speed prop, and the useful load to carry four adults with full fuel and bags — a genuine family hauler that costs more per hour to feed. Many owners step up from one to the other.',
    faqs: [
      { q: 'How much more capable is a Cessna 182 than a 172?', a: 'The 182 Skylane adds a 230 hp engine and a constant-speed prop (versus 180 hp and a fixed-pitch prop on the 172) and roughly 1,100 lb of useful load against about 880 lb — enough to carry four adults with full fuel and bags, which a 172 cannot always do.' },
      { q: 'Is a 182 much more expensive to operate than a 172?', a: 'Moderately, yes. The bigger engine burns more fuel and the constant-speed prop adds maintenance, so per-hour costs are higher. In exchange you get about 20 kt more cruise (~145 vs ~124 kt) and the extra load. Many owners step up from a 172 as their mission grows.' },
      { q: 'Should I buy a 172 or a 182?', a: 'Choose the 172 for training and light flying at the lowest cost; choose the 182 if you regularly fly four people, operate from higher or shorter fields, and want the extra useful load and speed.' },
    ],
  },
  {
    slug: 'cirrus-sr20-vs-cirrus-sr22',
    a: { makeSlug: 'cirrus', modelSlug: 'sr20' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    intro:
      'The Cirrus SR20 and SR22 share the same composite airframe, glass cockpit, and CAPS whole-airframe parachute, so a buyer is really choosing how much power and speed to pay for. The SR20’s smaller engine makes it the more attainable step-up and a common first Cirrus, with lower fuel and overhaul costs. The SR22’s 310 hp delivers markedly faster cruise and more useful load for serious cross-country flying — at a higher purchase price and running cost.',
    faqs: [
      { q: 'What is the difference between a Cirrus SR20 and SR22?', a: 'Mostly power. They share the same composite airframe, glass cockpit, and CAPS parachute, but the SR20 has about 215 hp (~155 kt cruise) while the SR22 has 310 hp (~183 kt) with more useful load.' },
      { q: 'Which Cirrus is cheaper to own?', a: 'The SR20. Its lower fuel burn and smaller engine to overhaul make it the more economical and attainable choice, and a common first Cirrus. The SR22 costs more to buy and run but flies faster and carries more.' },
      { q: 'Which is better for cross-country flying?', a: 'The SR22, thanks to its higher cruise speed and useful load. The SR20 is plenty for training and regional trips and gives the same glass panel and parachute for less money.' },
    ],
  },
  {
    slug: 'cirrus-sr22-vs-beechcraft-bonanza',
    a: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    b: { makeSlug: 'beechcraft', modelSlug: 'bonanza' },
    intro:
      'The Cirrus SR22 and the Beechcraft Bonanza are the two benchmark high-performance singles, and the decision splits along modern-composite versus classic-metal lines. The SR22 brings a parachute, a glass panel, fixed gear, and a car-like cabin in a newer composite airframe. The Bonanza is the storied retractable-gear traveler with top-tier build quality, ramp presence, and a six-seat cabin. Both are fast; expect premium upkeep either way, which is why both are so commonly co-owned.',
    faqs: [
      { q: 'Cirrus SR22 or Beechcraft Bonanza — which is faster?', a: 'They are close; both cruise in the 170s–180s kt on around 300–310 hp. The SR22 (~183 kt) edges the A36 Bonanza (~174 kt) on speed, while the Bonanza counters with retractable gear, a six-seat cabin, and classic build quality.' },
      { q: 'What is the biggest difference between them?', a: 'Philosophy. The SR22 is a modern composite single with fixed gear, a glass panel, and a CAPS whole-airframe parachute; the Bonanza is the storied metal retractable-gear traveler. One emphasizes modern safety technology, the other timeless build quality and cabin room.' },
      { q: 'Are they expensive to own?', a: 'Both are premium high-performance singles with premium upkeep — healthy fuel burn plus, on the Bonanza, retractable-gear maintenance, and on the SR22, the periodic CAPS parachute repack. That cost is exactly why both are so commonly co-owned.' },
    ],
  },
  {
    slug: 'cirrus-sr22-vs-cirrus-sr22t',
    a: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22t' },
    intro:
      'The Cirrus SR22 and the turbo-normalized SR22T are the same airframe with the same parachute and glass panel — the difference is altitude. The normally-aspirated SR22 is the simpler, less expensive choice that performs best down low. The SR22T adds a turbocharger and oxygen so it cruises in the high teens and flight levels, topping weather and crossing high terrain the SR22 cannot, in exchange for a higher fuel burn and a turbo-overhaul reserve. The right pick depends on whether you actually fly high and long.',
    faqs: [
      { q: 'What does the “T” in SR22T mean?', a: 'Turbo. The SR22T adds a turbocharger and oxygen to the same airframe, parachute, and glass panel, letting it cruise in the high teens and flight levels — up to around 213 kt at altitude — where the normally-aspirated SR22 cannot go.' },
      { q: 'Is the turbo worth it?', a: 'Only if you actually fly high and long. The SR22T tops weather and crosses high terrain better, but it burns more fuel and carries a turbo-overhaul reserve. A pilot who mostly flies low and short is usually better served by the simpler, cheaper SR22.' },
      { q: 'Do they cost the same to own?', a: 'No. The turbo SR22T has a higher fuel burn and the added turbo-overhaul reserve, so it costs more per hour than the normally-aspirated SR22 — the price of the altitude capability.' },
    ],
  },
  {
    slug: 'piper-cherokee-vs-piper-arrow',
    a: { makeSlug: 'piper', modelSlug: 'cherokee' },
    b: { makeSlug: 'piper', modelSlug: 'arrow' },
    intro:
      'The Piper Cherokee and the Piper Arrow are close cousins in the PA-28 family, so the comparison is about simplicity versus complexity. The fixed-gear Cherokee is one of the most economical and predictable singles to own — an ideal first airplane and first partnership. The Arrow adds retractable gear and a constant-speed prop, making it the classic complex-endorsement and commercial time-builder with a bit more speed, at a modest premium in insurance and maintenance.',
    faqs: [
      { q: 'What is the difference between a Piper Cherokee and an Arrow?', a: 'Complexity. Both are PA-28s, but the Cherokee is fixed-gear with a fixed-pitch prop while the Arrow adds retractable gear and a constant-speed prop, giving it a bit more speed (~137 vs ~120 kt) at a higher maintenance and insurance cost.' },
      { q: 'Which is cheaper to own?', a: 'The Cherokee. Fixed gear and simpler systems make it one of the most economical and predictable four-seat singles, ideal for a first airplane or partnership. The Arrow’s retractable gear adds inspection, insurance, and upkeep cost.' },
      { q: 'Why would I choose the Arrow?', a: 'For complex time. The Arrow is the classic complex-endorsement and commercial time-builder; if you want retractable-gear and constant-speed-prop experience plus a little more speed, it is the natural step up from a Cherokee.' },
    ],
  },
  {
    slug: 'cessna-182-vs-cirrus-sr22',
    a: { makeSlug: 'cessna', modelSlug: '182' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    intro:
      'The Cessna 182 Skylane and the Cirrus SR22 are both four-seat cross-country singles, but they represent two different eras. The high-wing 182 is a rugged, load-hauling, fixed-gear classic that flies into rough strips and carries a real family with bags. The SR22 is faster and more modern — composite airframe, glass panel, side-yoke, and a CAPS parachute — built for covering distance quickly. The 182 generally costs less to buy and run; the SR22 trades that for speed and technology.',
    faqs: [
      { q: 'Is the Cirrus SR22 faster than a Cessna 182?', a: 'Yes, noticeably. The SR22’s 310 hp gives ~183 kt cruise versus about 145 kt for the 230 hp Cessna 182. The 182 trades speed for rugged load-hauling ability and a lower price to buy and run.' },
      { q: 'Which is cheaper to own, a 182 or an SR22?', a: 'The 182, generally. Its fixed gear and simpler systems keep operating and maintenance costs below the SR22, which adds glass-panel upkeep and the CAPS parachute repack. The SR22’s premium buys speed and modern technology.' },
      { q: 'Which is the better family cross-country airplane?', a: 'Both seat four comfortably. Choose the 182 for rugged short- and rough-field capability, big useful load, and lower cost; choose the SR22 for speed, a glass panel, and the CAPS parachute on longer trips.' },
    ],
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
