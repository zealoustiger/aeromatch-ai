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

// ---------------------------------------------------------------------------
// SLICE 2 — dynamic, inventory-backed make+model combos
//
// Slice 1 capped the for-sale make+model pages to the curated ~20 above. Slice 2
// expands coverage to EVERY make+model FAMILY that has real active inventory
// (count > 0), derived dynamically from the `aircraft_for_sale` table so route +
// sitemap + rails share ONE source of truth and never drift. Curated entries
// always win (their hand-tuned slug/specs/copy); dynamically-discovered families
// get generic-but-honest copy. We deliberately operate at the *family* level
// (172, sr22, bonanza) — never per-variant micro pages (172m, sr22-g6) — to
// avoid the near-duplicate/thin pages GOAL.md forbids.
// ---------------------------------------------------------------------------

/** Min active listings a dynamically-discovered family needs to earn a page.
 *  Keeps generated pages substantive (no thin/singleton/near-dup pages). */
const DYNAMIC_MIN_COUNT = 3

/** Non-manufacturer "make" values in the scraped data — categories, junk, and
 *  uninformative buckets that must never become a make slug. Lowercased. */
const MAKE_DENYLIST = new Set<string>([
  'experimental', 'biplane', 'amphibian', 'antique-classic', 'float plane',
  'hangar', 'land', 'single family', 'other', 'piston helicopter',
  'turbine helicopter', 'custom-built',
])

/** Junk family tokens that survive normalization but aren't real model families. */
const FAMILY_TOKEN_DENYLIST = new Set<string>([
  'na', 'tbd', 'unknown', 'other', 'airport', 'baseleg', 'king', 'pa',
])

/** Slugify a make to the same lowercase, hyphen-collapsed form the curated
 *  `makeSlug`s use (e.g. "Cessna" -> "cessna", "Brm Aero" -> "brm-aero"). */
function makeToSlug(make: string): string {
  return make.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Reduce a messy DB `model` string to a clean FAMILY token + a matching `ilike`
 * pattern, mirroring how the curated combos collapse variants. Returns null when
 * the model can't be reduced to a sensible family.
 *
 * Rules (conservative, family-level):
 *  - take the first whitespace-delimited token, strip non-alphanumerics
 *  - Cirrus SR families: sr22t* -> sr22t, sr22* -> sr22, sr20* -> sr20
 *  - number+trailing-letters (182p, 172m, a185f) -> strip trailing letters
 *  - require an alphanumeric token of length >= 2, not in the junk denylist
 */
function modelToFamily(model: string): { slug: string; pattern: string } | null {
  const first = model.trim().split(/\s+/)[0] ?? ''
  const tok = first.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!tok) return null

  let family: string
  if (tok.startsWith('sr22t')) family = 'sr22t'
  else if (tok.startsWith('sr22')) family = 'sr22'
  else if (tok.startsWith('sr20')) family = 'sr20'
  else if (/^[0-9]+[a-z]+$/.test(tok)) family = tok.replace(/[a-z]+$/, '')
  else family = tok

  if (family.length < 2) return null
  if (!/^[a-z0-9]+$/.test(family)) return null
  if (FAMILY_TOKEN_DENYLIST.has(family)) return null

  // The pattern the route/sitemap/list all use to match this family. `{family}%`
  // captures the family and its variants (e.g. 172% matches "172", "172m
  // Skyhawk"); the Cirrus families keep their slice-1 distinct patterns.
  let pattern: string
  if (family === 'sr22t') pattern = 'sr22t%'
  else if (family === 'sr22') pattern = 'sr22%'
  else if (family === 'sr20') pattern = 'sr20%'
  else pattern = `${family}%`

  return { slug: family, pattern }
}

/** Title-case a make slug for display when there's no curated name
 *  (e.g. "brm-aero" -> "Brm Aero", "cubcrafters" -> "Cubcrafters"). */
function displayMakeFromSlug(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/** Display the family model for a dynamic combo: number families stay as-is
 *  (uppercased letters: "sr22t" -> "SR22T", "172" -> "172", "da40" -> "DA40"),
 *  word families get title-cased ("cherokee" -> "Cherokee"). */
function displayModelFromSlug(slug: string): string {
  if (/[0-9]/.test(slug)) return slug.toUpperCase()
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

/**
 * Build a cookieless, anon read-only Supabase client safe to use at build time
 * (inside `generateStaticParams`/`sitemap`, where there is no request and
 * `cookies()` would throw). Reads public `aircraft_for_sale` rows via RLS, the
 * same data `getAircraftFacets` already reads. Returns null when unconfigured.
 */
async function createAnonReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || url === 'https://placeholder.supabase.co' || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

let _inventoryCache: SeoMakeModel[] | null = null

/**
 * The full set of inventory-backed make+model combos that should have a page:
 * the curated `SEO_MAKE_MODELS` MERGED with every additional family discovered
 * to have >= DYNAMIC_MIN_COUNT active listings in `aircraft_for_sale`. Curated
 * entries always win on slug collisions (keeping their hand-tuned copy). This is
 * the SINGLE source of truth shared by `generateStaticParams`, the sitemap, and
 * `resolveMakeModel`, so they can never drift.
 *
 * On any DB failure it falls back to the static curated list — the build never
 * crashes for want of Supabase.
 */
export async function getInventoryMakeModels(): Promise<SeoMakeModel[]> {
  if (_inventoryCache) return _inventoryCache

  const supabase = await createAnonReadClient()
  if (!supabase) return SEO_MAKE_MODELS

  try {
    const { data, error } = await supabase
      .from('aircraft_for_sale')
      .select('make, model')
      .eq('status', 'active')
      .not('make', 'is', null)
      .limit(10000)
    if (error || !data) return SEO_MAKE_MODELS

    // Aggregate counts per (makeSlug, familySlug), remembering display values.
    type Agg = { makeSlug: string; modelSlug: string; make: string; model: string; pattern: string; count: number }
    const agg = new Map<string, Agg>()

    for (const row of data) {
      const rawMake = (row.make ?? '').trim()
      const rawModel = (row.model ?? '').trim()
      if (!rawMake || !rawModel) continue
      if (MAKE_DENYLIST.has(rawMake.toLowerCase())) continue

      const makeSlug = makeToSlug(rawMake)
      if (!makeSlug) continue
      const fam = modelToFamily(rawModel)
      if (!fam) continue

      const key = `${makeSlug}/${fam.slug}`
      const existing = agg.get(key)
      if (existing) {
        existing.count += 1
      } else {
        agg.set(key, {
          makeSlug,
          modelSlug: fam.slug,
          make: displayMakeFromSlug(makeSlug),
          model: displayModelFromSlug(fam.slug),
          pattern: fam.pattern,
          count: 1,
        })
      }
    }

    // Keep only substantive families, then drop any family whose slug is a strict
    // prefix-subset of another kept family for the same make (e.g. drop m20j when
    // m20 is present) — those would be near-duplicate pages.
    const kept = [...agg.values()].filter((a) => a.count >= DYNAMIC_MIN_COUNT)
    const byMake = new Map<string, Agg[]>()
    for (const a of kept) {
      if (!byMake.has(a.makeSlug)) byMake.set(a.makeSlug, [])
      byMake.get(a.makeSlug)!.push(a)
    }
    const deduped: Agg[] = []
    for (const list of byMake.values()) {
      for (const a of list) {
        const isSubset = list.some(
          (b) => b !== a && a.modelSlug.startsWith(b.modelSlug) && a.modelSlug !== b.modelSlug
        )
        if (!isSubset) deduped.push(a)
      }
    }

    // Merge: curated entries win on slug collision; dynamic-only families get
    // generic, honest copy (no fabricated specifics). Exclude a dynamic family
    // when it duplicates a curated one — either by the same slug, OR by matching
    // the SAME inventory under the same make (same make + same modelPattern,
    // e.g. curated grumman/aa-1 vs dynamic grumman/aa1 both match `aa1%`). That
    // prevents two different URLs serving identical listings (a near-dup page).
    const curatedKeys = new Set(SEO_MAKE_MODELS.map((e) => `${e.makeSlug}/${e.modelSlug}`))
    const curatedPatternKeys = new Set(
      SEO_MAKE_MODELS.map((e) => `${e.makeSlug}|${e.modelPattern.toLowerCase()}`)
    )
    const dynamicEntries: SeoMakeModel[] = deduped
      .filter(
        (a) =>
          !curatedKeys.has(`${a.makeSlug}/${a.modelSlug}`) &&
          !curatedPatternKeys.has(`${a.makeSlug}|${a.pattern.toLowerCase()}`)
      )
      .map((a) => {
        const label = `${a.make} ${a.model}`
        return {
          makeSlug: a.makeSlug,
          modelSlug: a.modelSlug,
          make: a.make,
          model: a.model,
          modelPattern: a.pattern,
          specs: `${label} aircraft currently listed for sale, aggregated from across the web into one searchable place.`,
          costToOwn: `Co-ownership is how a lot of pilots make a ${label} pencil out — splitting the hangar, insurance, and maintenance reserve across a small group keeps the fixed costs manageable.`,
        }
      })
      .sort((a, b) =>
        a.makeSlug === b.makeSlug
          ? a.modelSlug.localeCompare(b.modelSlug)
          : a.makeSlug.localeCompare(b.makeSlug)
      )

    _inventoryCache = [...SEO_MAKE_MODELS, ...dynamicEntries]
    return _inventoryCache
  } catch {
    return SEO_MAKE_MODELS
  }
}

/**
 * Resolve a make+model slug pair to its `SeoMakeModel`, checking the curated list
 * first (fast, sync) and then the full inventory-backed set. Returns null for an
 * unknown combo. Used by the route + metadata so any inventory-backed combo
 * resolves, not just the hardcoded ~20.
 */
export async function resolveMakeModel(
  makeSlug: string,
  modelSlug: string
): Promise<SeoMakeModel | null> {
  const curated = getMakeModel(makeSlug, modelSlug)
  if (curated) return curated
  const m = makeSlug.toLowerCase()
  const md = modelSlug.toLowerCase()
  const all = await getInventoryMakeModels()
  return all.find((e) => e.makeSlug === m && e.modelSlug === md) ?? null
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
