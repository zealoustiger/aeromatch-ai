export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const SITE_NAME = 'ClubHanger'

/** Full state names keyed by USPS code — used for SEO landing pages. */
export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

export const STATE_CODES = Object.keys(STATE_NAMES)

/** URL slug for a state full name, e.g. "New York" -> "new-york". Used by the
 *  geo for-sale pages at `/aircraft/for-sale/[state]` (slug = full state name,
 *  the form people actually search: "aircraft for sale california"). */
export function stateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Reverse map: state slug (e.g. "california", "new-york") -> USPS code, or null. */
const SLUG_TO_CODE: Record<string, string> = Object.fromEntries(
  STATE_CODES.map((code) => [stateSlug(STATE_NAMES[code]), code])
)

export function getStateBySlug(slug: string): { code: string; name: string } | null {
  const code = SLUG_TO_CODE[slug.toLowerCase()]
  return code ? { code, name: STATE_NAMES[code] } : null
}

/** Aircraft makes with SEO landing pages. Slug → display name + filter value. */
export const SEO_MAKES: { slug: string; name: string; filter: string; blurb: string }[] = [
  { slug: 'cessna', name: 'Cessna', filter: 'Cessna', blurb: 'From the 152 trainer to the 182 and 206, Cessna singles are the most commonly co-owned aircraft in America — parts are everywhere and every A&P knows them.' },
  { slug: 'piper', name: 'Piper', filter: 'Piper', blurb: 'Cherokees, Archers, and Arrows make excellent partnership aircraft with low operating costs and forgiving handling.' },
  { slug: 'cirrus', name: 'Cirrus', filter: 'Cirrus', blurb: 'SR20 and SR22 partnerships make the most advanced piston singles affordable — split the cost of a glass cockpit and the CAPS parachute system.' },
  { slug: 'beechcraft', name: 'Beechcraft', filter: 'Beechcraft', blurb: 'Bonanzas and Barons are legendary travelers. Co-ownership brings their higher operating costs within reach.' },
  { slug: 'mooney', name: 'Mooney', filter: 'Mooney', blurb: 'Mooneys deliver the best speed-per-dollar in piston aviation — a partnership makes the famously efficient M20 series even more economical.' },
  { slug: 'diamond', name: 'Diamond', filter: 'Diamond', blurb: 'Modern composite airframes, Austro diesels, and excellent safety records make the DA40 and DA42 popular with shared-ownership groups.' },
  { slug: 'vans', name: "Van's", filter: "Van's", blurb: 'RV series experimentals offer unmatched performance per dollar. Partnerships are common among builders and sport pilots alike.' },
  { slug: 'grumman', name: 'Grumman', filter: 'Grumman', blurb: 'Tigers and Cheetahs are beloved for their sliding canopies and sporty handling — and their simple systems keep shared maintenance costs low.' },
]

export function getMakeBySlug(slug: string) {
  return SEO_MAKES.find((m) => m.slug === slug.toLowerCase()) ?? null
}

/**
 * Curated make+model combos with their own programmatic for-sale landing page at
 * `/aircraft/[makeSlug]/[modelSlug]` (e.g. /aircraft/cessna/172).
 *
 * SLICE 1: the top ~20 combos by *real* active inventory (queried 2026-06-20).
 * Every entry below has ≥6 live listings — no thin/doorway pages (GOAL.md).
 *
 * Model strings in the DB are messy/inconsistent (e.g. "SR22", "Sr22 G6",
 * "SR22-G6 Turbo"), so each combo carries an `ilike` `modelPattern` (plus an
 * optional `notModelPattern`) that captures the whole family — the page computes
 * the *live* match count at request time, so the title's N is always accurate.
 */
export type SeoMakeModel = {
  makeSlug: string
  modelSlug: string
  make: string // exact DB make value (matched case-insensitively)
  model: string // display model name
  /** ilike pattern matched against the DB `model` column (family-level). */
  modelPattern: string
  /** optional ilike pattern to EXCLUDE (e.g. keep SR22 distinct from SR22T). */
  notModelPattern?: string
  /** one-line spec summary shown on the page. */
  specs: string
  /** short, honest cost-to-own blurb (no keyword stuffing). */
  costToOwn: string
}

export const SEO_MAKE_MODELS: SeoMakeModel[] = [
  {
    makeSlug: 'cirrus', modelSlug: 'sr22', make: 'Cirrus', model: 'SR22',
    modelPattern: 'sr22%', notModelPattern: 'sr22t%',
    specs: 'Four-seat composite single, ~310 hp, 180+ kt cruise, CAPS whole-airframe parachute, glass panel.',
    costToOwn: 'A flagship piston single — co-ownership is how most pilots make an SR22 pencil out. Budget roughly $250–400/hr all-in; partnerships split the fixed costs (hangar, insurance, the chute repack) across the group.',
  },
  {
    makeSlug: 'cirrus', modelSlug: 'sr22t', make: 'Cirrus', model: 'SR22T',
    modelPattern: 'sr22t%',
    specs: 'Turbo-normalized SR22, ~315 hp, high-altitude cruise into the 200 kt range, CAPS, oxygen, glass panel.',
    costToOwn: 'The turbo SR22 trades a higher fuel and overhaul bill for altitude and speed. Shared ownership softens the turbo overhaul reserve and insurance — most flying clubs split it 3–4 ways.',
  },
  {
    makeSlug: 'mooney', modelSlug: 'm20', make: 'Mooney', model: 'M20',
    modelPattern: 'm20%',
    specs: 'Sleek four-seat retractable single; the M20 series delivers the best speed-per-dollar in piston aviation.',
    costToOwn: 'Mooneys are famously efficient — low fuel burn for the speed. The retractable gear adds an annual and insurance premium, which a partnership spreads across owners.',
  },
  {
    makeSlug: 'beechcraft', modelSlug: 'bonanza', make: 'Beechcraft', model: 'Bonanza',
    modelPattern: '%bonanza%',
    specs: 'The classic high-performance single — V-tail and straight-tail variants, roomy cabin, 170+ kt cruise.',
    costToOwn: 'A Bonanza is a serious traveling machine with traveling-machine costs. Co-ownership is the traditional way to fly one affordably; budget for the higher fuel burn and a healthy engine reserve.',
  },
  {
    makeSlug: 'cessna', modelSlug: '182', make: 'Cessna', model: '182',
    modelPattern: '182%',
    specs: 'Four-seat high-wing Skylane; more useful load and power than a 172, ~145 kt cruise, fixed gear.',
    costToOwn: 'The 182 is a do-everything family hauler. Operating costs sit between a 172 and a complex single — a partnership keeps the hangar and insurance manageable while you split real flying hours.',
  },
  {
    makeSlug: 'cirrus', modelSlug: 'sr20', make: 'Cirrus', model: 'SR20',
    modelPattern: 'sr20%',
    specs: 'Entry Cirrus single, ~215 hp, four seats, CAPS parachute, modern glass panel — a popular trainer and step-up.',
    costToOwn: 'The most attainable way into a Cirrus. Lower fuel and overhaul cost than the SR22; partnerships make the glass-panel ownership experience genuinely affordable.',
  },
  {
    makeSlug: 'cessna', modelSlug: '172', make: 'Cessna', model: '172',
    modelPattern: '172%',
    specs: 'The Skyhawk — the most-produced aircraft ever. Four seats, high wing, ~120 kt cruise, famously forgiving.',
    costToOwn: 'The default first airplane and the most commonly co-owned single in America. Parts are everywhere and every A&P knows it, so a 172 partnership is about as low-drama as ownership gets.',
  },
  {
    makeSlug: 'piper', modelSlug: 'cherokee', make: 'Piper', model: 'Cherokee',
    modelPattern: '%cherokee%',
    specs: 'Low-wing four-seat single (PA-28 family), simple systems, forgiving handling, ~115–130 kt cruise.',
    costToOwn: 'One of the most economical singles to share. Fixed gear, a simple system, and a huge parts supply keep maintenance predictable — ideal for a first partnership.',
  },
  {
    makeSlug: 'beechcraft', modelSlug: 'baron', make: 'Beechcraft', model: 'Baron',
    modelPattern: '%baron%',
    specs: 'Twin-engine six-seat traveler, 190+ kt cruise, the cabin-class step into piston twins.',
    costToOwn: 'A twin doubles the engines and the maintenance — exactly why Barons are so often co-owned. A group of partners makes the two overhaul reserves and the higher insurance realistic.',
  },
  {
    makeSlug: 'piper', modelSlug: 'arrow', make: 'Piper', model: 'Arrow',
    modelPattern: '%arrow%',
    specs: 'Retractable-gear PA-28R, four seats, ~135 kt cruise — a popular complex trainer and step-up.',
    costToOwn: 'The natural complex-time step-up from a Cherokee. Retractable gear adds a modest insurance and annual premium; a partnership keeps it economical while you build complex hours.',
  },
  {
    makeSlug: 'piper', modelSlug: 'comanche', make: 'Piper', model: 'Comanche',
    modelPattern: '%comanche%',
    specs: 'Fast low-wing retractable single (PA-24), 160+ kt cruise, big tanks — a true long-legged traveler.',
    costToOwn: 'A lot of airplane for the money, beloved for range and speed. Parts take a little more hunting than a Cherokee, so a partnership with a shared maintenance kitty works well.',
  },
  {
    makeSlug: 'bellanca', modelSlug: 'citabria', make: 'Bellanca', model: 'Citabria',
    modelPattern: '%citabria%',
    specs: 'Two-seat tandem taildragger, aerobatic-capable, fabric covered — pure stick-and-rudder fun.',
    costToOwn: 'Cheap to fly and a blast to own. The main cost is fabric and a tailwheel-rated insurance policy; partnerships are common among tailwheel and aerobatic pilots sharing the fun.',
  },
  {
    makeSlug: 'vans', modelSlug: 'rv', make: 'Vans', model: 'RV',
    modelPattern: 'rv%',
    specs: 'Van’s RV series experimentals — unmatched performance-per-dollar, sporty handling, two to four seats.',
    costToOwn: 'Experimentals offer the best performance per dollar in aviation and owner-performed maintenance keeps costs low. Partnerships are common among builders and sport pilots alike.',
  },
  {
    makeSlug: 'cessna', modelSlug: '150', make: 'Cessna', model: '150',
    modelPattern: '150%',
    specs: 'Two-seat high-wing trainer; cheap to run, simple, and forgiving — a classic first airplane.',
    costToOwn: 'About the lowest-cost way to own an airplane. Two seats and a small engine mean small bills; a partnership splits an already-modest hangar and annual.',
  },
  {
    makeSlug: 'piper', modelSlug: 'cub', make: 'Piper', model: 'Cub',
    modelPattern: '%cub%',
    specs: 'The iconic yellow taildragger — fabric, tandem seating, slow, simple, and endlessly charming.',
    costToOwn: 'A Cub is bought with the heart, but it’s genuinely cheap to fly. Fabric and a tailwheel insurance policy are the main costs; shared ownership keeps a classic in the air.',
  },
  {
    makeSlug: 'cessna', modelSlug: '180', make: 'Cessna', model: '180',
    modelPattern: '180%',
    specs: 'Tailwheel high-wing hauler; rugged backcountry and float-capable, strong useful load.',
    costToOwn: 'A backcountry favorite that holds its value. Tailwheel insurance and big tundra tires aside, it’s a durable airframe — partnerships split the hangar and the adventures.',
  },
  {
    makeSlug: 'piper', modelSlug: 'saratoga', make: 'Piper', model: 'Saratoga',
    modelPattern: '%saratoga%',
    specs: 'Six-seat PA-32 family single, big cabin and useful load, fixed- and retractable-gear variants.',
    costToOwn: 'A genuine six-seat family/IFR machine. Fuel burn matches the cabin size, so co-ownership across a few families is the classic way to keep a Saratoga affordable.',
  },
  {
    makeSlug: 'grumman', modelSlug: 'aa-1', make: 'Grumman', model: 'AA-1',
    modelPattern: 'aa1%',
    specs: 'Two-seat low-wing single with a sliding canopy and sporty, responsive handling.',
    costToOwn: 'Sporty and simple to maintain — the sliding canopy and bonded airframe keep things light. Low operating costs make it an easy partnership aircraft.',
  },
  {
    makeSlug: 'grumman', modelSlug: 'aa-5', make: 'Grumman', model: 'AA-5',
    modelPattern: 'aa5%',
    specs: 'Four-seat Traveler/Tiger/Cheetah family, sliding canopy, ~130 kt cruise, low-drag airframe.',
    costToOwn: 'The four-seat Grummans are quick for their fuel burn and famously low-drag. Simple systems keep shared maintenance costs down — a popular first partnership single.',
  },
  {
    makeSlug: 'robinson', modelSlug: 'r44', make: 'Robinson', model: 'R44',
    modelPattern: 'r44%',
    specs: 'Four-seat piston helicopter, ~110 kt cruise — the world’s most popular civil helicopter.',
    costToOwn: 'Rotary ownership runs on a scheduled overhaul clock, which makes a partnership almost essential. Splitting the 2,200-hr overhaul reserve and insurance across owners is how most R44s are flown.',
  },
]

export function getMakeModel(makeSlug: string, modelSlug: string): SeoMakeModel | null {
  const m = makeSlug.toLowerCase()
  const md = modelSlug.toLowerCase()
  return SEO_MAKE_MODELS.find((e) => e.makeSlug === m && e.modelSlug === md) ?? null
}

// Translate a Postgres `ilike` pattern into a case-insensitive anchored regex so
// we can test it in JS with the SAME semantics the DB query uses (`%` = any run,
// `_` = single char). Used to decide, client-side, whether a listing belongs to
// a curated make+model family — mirroring `countMakeModel`'s server-side filter.
function ilikeToRegExp(pattern: string): RegExp {
  let out = '^'
  for (const ch of pattern) {
    if (ch === '%') out += '[\\s\\S]*'
    else if (ch === '_') out += '[\\s\\S]'
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(out + '$', 'i')
}

/**
 * Resolve a listing's raw `make`/`model` strings to the curated make+model family
 * that has a real `/aircraft/[makeSlug]/[modelSlug]` page — or `null` if none.
 *
 * This reuses `SEO_MAKE_MODELS` (the single source of truth that drives
 * `generateStaticParams`, the sitemap, and the route's `getMakeModel`) and the
 * exact same match semantics as `countMakeModel`: make matched
 * case-insensitively as a substring (`ilike '%make%'`), model matched against
 * the family's `modelPattern` and excluded by `notModelPattern` (both `ilike`).
 *
 * Callers use this to emit a "See all {Make} {Model} for sale" link ONLY when a
 * page exists — so links never point at a missing/404 combo page. (A combo only
 * resolves for a listing that exists, so the resolved page always has ≥1 active
 * listing and can't trip the route's count-0 thin-page guardrail.)
 */
export function resolveMakeModelFamily(
  make: string | null | undefined,
  model: string | null | undefined
): SeoMakeModel | null {
  if (!make || !model) return null
  const makeLc = make.toLowerCase()
  for (const e of SEO_MAKE_MODELS) {
    // make: listing make must contain the family's exact DB make value.
    if (!makeLc.includes(e.make.toLowerCase())) continue
    // model: must match the family pattern and not the exclusion pattern.
    if (!ilikeToRegExp(e.modelPattern).test(model)) continue
    if (e.notModelPattern && ilikeToRegExp(e.notModelPattern).test(model)) continue
    return e
  }
  return null
}
