export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const SITE_NAME = 'ClubHanger'

/**
 * Site-wide default Open Graph / Twitter card image (a real 1200×630 branded
 * raster at `public/og-default.png`). Used as the graceful fallback whenever a
 * page (or a listing without a real photo) has no more specific image — so a
 * shared link always unfurls into a real card, never a broken/empty image.
 */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

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
  /**
   * 3 genuine, evergreen Q&As shown on the page + emitted as FAQPage JSON-LD.
   * Authored from the real specs/costToOwn above + general GA knowledge — no
   * fabricated stats, no live counts (so the text never goes stale). Curated
   * combos only; dynamically-discovered combos have none. See MODEL_FAQS.
   */
  faqs?: { q: string; a: string }[]
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

// ---------------------------------------------------------------------------
// Per-model FAQs — genuine, evergreen Q&As attached to each curated make+model
// page (rendered visibly AND emitted as FAQPage JSON-LD; the visible text must
// match the structured data 1:1). Keyed by `${makeSlug}/${modelSlug}`. Answers
// are drawn from the curated specs/costToOwn prose above + well-known general-
// aviation facts — NO fabricated statistics and NO live listing counts, so the
// copy stays accurate and never goes stale.
// ---------------------------------------------------------------------------
const MODEL_FAQS: Record<string, { q: string; a: string }[]> = {
  'cirrus/sr22': [
    { q: 'What makes the Cirrus SR22 special?', a: 'It is a four-seat composite single putting out about 310 hp with a 180+ kt cruise, a full glass panel, and the CAPS whole-airframe parachute that defines the brand. Those features have made it one of the best-selling piston singles in the world.' },
    { q: 'How much does it cost to own a Cirrus SR22?', a: 'Plan on roughly $250–400 per hour all-in once you add fuel, reserves, insurance, and fixed costs. The fixed costs — hangar, insurance, and the periodic CAPS parachute repack — are why so many SR22 owners share the airplane in a partnership.' },
    { q: 'Is the SR22 a good aircraft to co-own?', a: 'Yes — it is one of the most commonly co-owned high-performance singles. Splitting the hangar, insurance, and chute repack across three or four partners turns a flagship single into a realistic monthly number while everyone still gets plenty of flying.' },
  ],
  'cirrus/sr22t': [
    { q: 'How is the SR22T different from the SR22?', a: 'The "T" is turbo-normalized — about 315 hp, with the turbo letting it cruise comfortably into the flight levels and the 200 kt range, with oxygen aboard. You trade a higher fuel and overhaul bill for altitude and speed.' },
    { q: 'What does an SR22T cost to operate?', a: 'More than the normally-aspirated SR22, mainly from higher fuel burn at altitude and a larger turbo overhaul reserve. Most owners split it three to four ways in a flying club or partnership to keep the reserves and insurance manageable.' },
    { q: 'Is the turbo worth it?', a: 'If you regularly fly long cross-countries, over high terrain, or want to top weather, the turbo earns its keep. If most of your flying is local and low, the standard SR22 is cheaper to run.' },
  ],
  'mooney/m20': [
    { q: 'Why are Mooneys so efficient?', a: 'The M20 series is a sleek, low-drag retractable that delivers the best speed-per-dollar in piston aviation — it goes fast on remarkably little fuel, which is its whole reputation.' },
    { q: 'What does it cost to own a Mooney M20?', a: 'Fuel costs are low for the speed, but the retractable gear adds an annual inspection and an insurance premium. Sharing the airplane in a partnership spreads those fixed costs across owners.' },
    { q: 'Is the Mooney a good first airplane?', a: 'It is a capable traveler rather than a trainer — the cabin is snug and the retractable gear means more systems to manage. Many owners step up to a Mooney after some time in fixed-gear singles.' },
  ],
  'beechcraft/bonanza': [
    { q: 'What is the Beechcraft Bonanza known for?', a: 'It is the classic high-performance single — built in V-tail and straight-tail variants, with a roomy cabin and a 170+ kt cruise. It has been in production longer than almost any aircraft and is prized as a serious traveling machine.' },
    { q: 'How much does a Bonanza cost to own?', a: 'It is a traveling machine with traveling-machine costs — higher fuel burn and a healthy engine reserve. Co-ownership is the traditional way to fly one affordably, splitting the hangar, insurance, and reserves.' },
    { q: 'V-tail or straight-tail Bonanza?', a: 'Both fly beautifully; the V-tail is iconic, but some buyers prefer the conventional tail for simpler maintenance and insurance. Either way, a pre-purchase inspection by a Bonanza-savvy mechanic is essential.' },
  ],
  'cessna/182': [
    { q: 'What is the Cessna 182 good for?', a: 'The Skylane is a do-everything four-seat high-wing hauler — more useful load and power than a 172, a ~145 kt cruise, and fixed gear that keeps it simple. It is a favorite family airplane.' },
    { q: 'How much does it cost to own a Cessna 182?', a: 'Operating costs sit between a 172 and a complex single. A partnership keeps the hangar and insurance manageable while partners split real flying hours.' },
    { q: 'Is the 182 better than a 172?', a: 'It is not "better," it is bigger — more power, more load, and faster, which makes it the better choice if you regularly fly four people or out of high or short fields. The 172 is cheaper to run and easier for a brand-new pilot.' },
  ],
  'cirrus/sr20': [
    { q: 'Is the SR20 a good entry into Cirrus ownership?', a: 'Yes — it is the most attainable Cirrus, with about 215 hp, four seats, the CAPS parachute, and a modern glass panel. It has lower fuel and overhaul costs than the SR22 while giving the same cockpit experience.' },
    { q: 'What does an SR20 cost to own?', a: 'Less than an SR22 to fuel and overhaul, which is the point. Partnerships make the glass-panel ownership experience genuinely affordable by splitting the fixed costs.' },
    { q: 'SR20 or SR22?', a: 'The SR20 is cheaper to buy and run and is plenty for training and regional trips; the SR22 carries more, climbs better, and flies faster. Pick the SR20 if budget and economy matter most.' },
  ],
  'cessna/172': [
    { q: 'Is the Cessna 172 a good first airplane?', a: 'It is the default first airplane for good reason — four seats, a high wing, a forgiving stall, and famously docile handling make it ideal for training and early ownership. It is the most-produced aircraft ever built.' },
    { q: 'How much does it cost to own a Cessna 172?', a: 'It is about as low-drama as ownership gets — parts are everywhere and every A&P knows the airplane, so maintenance is predictable. It is the most commonly co-owned single in America, which keeps each partner’s share modest.' },
    { q: 'Why co-own a Cessna 172?', a: 'Because most owners cannot fly enough hours to justify the fixed costs alone. Splitting the hangar, insurance, and annual across a few partners makes a 172 genuinely cheap per person while keeping it available.' },
  ],
  'piper/cherokee': [
    { q: 'Is the Piper Cherokee a good airplane to own?', a: 'Very — the low-wing PA-28 family has simple systems, forgiving handling, and a ~115–130 kt cruise. Fixed gear and a huge parts supply make it one of the most economical singles to own and share.' },
    { q: 'How much does a Cherokee cost to own?', a: 'Among the lowest of any four-seat single. Fixed gear and simple systems keep maintenance predictable, which makes it an ideal first partnership airplane.' },
    { q: 'Cherokee or Cessna 172?', a: 'They are close rivals — the Cherokee is low-wing, the 172 high-wing. Both are forgiving, cheap to run, and well-supported; the choice usually comes down to which you trained in and which you prefer to climb into.' },
  ],
  'beechcraft/baron': [
    { q: 'What is the Beechcraft Baron?', a: 'A twin-engine, six-seat cabin-class traveler cruising at 190+ kt — the natural step into piston twins for pilots who want engine redundancy and range.' },
    { q: 'Why are Barons so often co-owned?', a: 'A twin doubles the engines and the maintenance — two overhaul reserves plus higher insurance. A group of partners is what makes those costs realistic, which is why shared ownership is the norm.' },
    { q: 'Is a Baron expensive to own?', a: 'Yes, relative to a single — plan for two engine reserves, twin insurance, and higher fuel burn. That is exactly why partnerships are so common; spread across owners, a Baron becomes attainable.' },
  ],
  'piper/arrow': [
    { q: 'What is the Piper Arrow good for?', a: 'The retractable-gear PA-28R is a popular complex trainer and step-up — four seats, a ~135 kt cruise, and the retractable gear and constant-speed prop pilots need for complex and commercial time.' },
    { q: 'How much does an Arrow cost to own?', a: 'A bit more than a fixed-gear Cherokee — the retractable gear adds a modest insurance and annual premium. A partnership keeps it economical while you build complex time.' },
    { q: 'Is the Arrow a good complex-time builder?', a: 'Yes — it is one of the most common airplanes for earning complex and commercial hours, with predictable systems and strong parts availability.' },
  ],
  'piper/comanche': [
    { q: 'What makes the Piper Comanche special?', a: 'The PA-24 is a fast low-wing retractable single — a 160+ kt cruise with big tanks, making it a genuine long-legged traveler that punches above its fuel burn.' },
    { q: 'How much does a Comanche cost to own?', a: 'A lot of airplane for the money, beloved for range and speed. Parts take a little more hunting than a Cherokee, so many owners run a partnership with a shared maintenance kitty.' },
    { q: 'Is the Comanche hard to maintain?', a: 'It is a sound airframe, but production ended decades ago, so some parts are sourced through type clubs and specialists. A knowledgeable mechanic and a shared parts fund make it very manageable.' },
  ],
  'bellanca/citabria': [
    { q: 'What is a Citabria like to fly?', a: 'It is a two-seat tandem taildragger — fabric-covered, aerobatic-capable, and pure stick-and-rudder fun. The name "Citabria" is "airbatic" spelled backward.' },
    { q: 'Is a Citabria cheap to own?', a: 'Yes — it is cheap to fly and a blast to own. The main costs are fabric upkeep and a tailwheel-rated insurance policy; partnerships are common among tailwheel and aerobatic pilots sharing the fun.' },
    { q: 'Do I need a tailwheel endorsement?', a: 'Yes — like any taildragger, the Citabria requires a tailwheel endorsement, and insurers will want some dual instruction. It is also a wonderful airplane to earn that endorsement in.' },
  ],
  'vans/rv': [
    { q: 'What are Van’s RV aircraft?', a: 'The RV series are experimental amateur-built airplanes offering unmatched performance per dollar — sporty handling, two to four seats, and a huge, active builder community.' },
    { q: 'Are experimentals cheaper to own?', a: 'Often yes — owner-performed maintenance is allowed on experimentals, which keeps costs low, and the performance per dollar is the best in aviation. Partnerships are common among builders and sport pilots.' },
    { q: 'Can you partner on an experimental?', a: 'Absolutely — many RVs are co-owned. Just confirm the operating limitations and insurance work for multiple owners, and that everyone is comfortable with the builder-maintained nature of the airplane.' },
  ],
  'cessna/150': [
    { q: 'Is the Cessna 150 a good first airplane?', a: 'It is a classic first airplane — a two-seat high-wing trainer that is cheap to run, simple, and forgiving. Generations of pilots learned in one.' },
    { q: 'How cheap is a Cessna 150 to own?', a: 'About the lowest-cost way to own an airplane. Two seats and a small engine mean small bills, and a partnership splits an already-modest hangar and annual.' },
    { q: 'Cessna 150 or 152?', a: 'They are nearly identical two-seat trainers; the 152 has a slightly larger engine and minor refinements. Either is among the most affordable airplanes you can own.' },
  ],
  'piper/cub': [
    { q: 'Why is the Piper Cub so iconic?', a: 'The yellow taildragger — fabric, tandem seating, slow, simple, and endlessly charming — is the airplane most people picture when they imagine light aviation. It is bought with the heart.' },
    { q: 'Is a Cub expensive to own?', a: 'It is genuinely cheap to fly. Fabric upkeep and a tailwheel insurance policy are the main costs, and shared ownership is a great way to keep a classic in the air.' },
    { q: 'Do you need a tailwheel endorsement to fly a Cub?', a: 'Yes — it is a taildragger, so a tailwheel endorsement and some dual time are required. It is also one of the most rewarding airplanes to learn stick-and-rudder skills in.' },
  ],
  'cessna/180': [
    { q: 'What is the Cessna 180 used for?', a: 'It is a rugged tailwheel high-wing hauler — backcountry- and float-capable with a strong useful load. It is a favorite for bush flying and adventure.' },
    { q: 'Does the Cessna 180 hold its value?', a: 'It is a backcountry favorite that holds its value well. Tailwheel insurance and big tundra tires aside, it is a durable airframe — partnerships split the hangar and the adventures.' },
    { q: 'Is the 180 hard to fly?', a: 'It is a taildragger with real performance, so it demands tailwheel proficiency and respect for crosswinds. With a tailwheel endorsement and some dual, it rewards a careful pilot.' },
  ],
  'piper/saratoga': [
    { q: 'What is the Piper Saratoga good for?', a: 'It is a six-seat PA-32 family single with a big cabin and useful load, in both fixed- and retractable-gear variants — a genuine family and IFR traveling machine.' },
    { q: 'How much does a Saratoga cost to own?', a: 'Fuel burn matches the big cabin, so it is not the cheapest single to run. Co-ownership across a few families is the classic way to keep a Saratoga affordable.' },
    { q: 'Fixed or retractable Saratoga?', a: 'The retractable is faster; the fixed-gear version is simpler and a bit cheaper to insure and maintain. Both carry six and haul a real load.' },
  ],
  'grumman/aa-1': [
    { q: 'What is the Grumman AA-1?', a: 'A two-seat low-wing single with a sliding canopy and sporty, responsive handling — a fun, simple airplane that stands out from the typical trainer.' },
    { q: 'Is the AA-1 cheap to own?', a: 'Yes — the sliding canopy and bonded airframe keep things light, and low operating costs make it an easy partnership aircraft.' },
    { q: 'Is the AA-1 a good trainer?', a: 'It is sportier and a bit quicker on the controls than a 150, so many pilots love it as a step beyond basic trainers. Get a checkout from someone who knows the type.' },
  ],
  'grumman/aa-5': [
    { q: 'What is the Grumman AA-5 family?', a: 'The four-seat Traveler, Tiger, and Cheetah — sliding-canopy singles with a low-drag airframe and a ~130 kt cruise that is quick for the fuel burn.' },
    { q: 'How much does an AA-5 cost to own?', a: 'Low — simple systems and a slippery airframe keep both fuel and shared maintenance costs down, which makes it a popular first partnership single.' },
    { q: 'Grumman Tiger or Cheetah?', a: 'The Tiger has more power and is the faster, better climber; the Cheetah is a bit more economical. Both share the same fun sliding-canopy character.' },
  ],
  'robinson/r44': [
    { q: 'What is the Robinson R44?', a: 'A four-seat piston helicopter cruising around 110 kt — the world’s most popular civil helicopter, widely used for training, personal travel, and utility work.' },
    { q: 'Why co-own an R44?', a: 'Helicopter ownership runs on a scheduled overhaul clock — the airframe and major components have a 2,200-hour/12-year overhaul. Splitting that reserve and the insurance across owners is how most R44s are flown.' },
    { q: 'Is an R44 expensive to own?', a: 'The big number is the scheduled overhaul reserve, plus insurance that reflects rotary operations. Budgeting per-hour for the overhaul from the start — and sharing it in a partnership — is what makes R44 ownership work.' },
  ],
}

export function getMakeModel(makeSlug: string, modelSlug: string): SeoMakeModel | null {
  const m = makeSlug.toLowerCase()
  const md = modelSlug.toLowerCase()
  const entry = SEO_MAKE_MODELS.find((e) => e.makeSlug === m && e.modelSlug === md)
  if (!entry) return null
  // Attach the curated FAQs (if any) without mutating the source array.
  const faqs = MODEL_FAQS[`${entry.makeSlug}/${entry.modelSlug}`]
  return faqs ? { ...entry, faqs } : entry
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

// ---------------------------------------------------------------------------
// MODEL × STATE intersection — the page family at
// `/aircraft/[make]/[model]/[state]` (e.g. /aircraft/cessna/172/california:
// "Cessna 172 for sale in California"). The #1 autocomplete intent.
//
// A combo earns a page iff it has >= INTERSECTION_MIN_COUNT active listings of
// that make+model family located in that state. We derive the full set in ONE
// pass over `aircraft_for_sale`, matching each row to an inventory-backed combo
// (so a state page can only exist where its parent /aircraft/[make]/[model] page
// also exists). This is the SINGLE source of truth shared by the route's
// `generateStaticParams` and the sitemap, so they can never drift. Threshold
// mirrors DYNAMIC_MIN_COUNT — no thin/near-empty intersection pages (GOAL.md).
// ---------------------------------------------------------------------------

/** Min active listings a (make, model, state) combo needs to earn a page. */
const INTERSECTION_MIN_COUNT = 3

export type SeoMakeModelState = {
  entry: SeoMakeModel
  /** USPS code, e.g. "CA". */
  code: string
  /** full state name, e.g. "California". */
  stateName: string
  /** state URL slug, e.g. "california". */
  stateSlug: string
  /** approx active-listing count for this combo (from the param-time scan; the
   *  page recomputes its own live count for the title/guard). */
  count: number
}

let _intersectionCache: SeoMakeModelState[] | null = null

/**
 * Every inventory-backed (make, model, state) combo with >= INTERSECTION_MIN_COUNT
 * active listings. Pages through ALL active rows (PostgREST caps a single read at
 * 1000, so we `.range()` to see the full table), maps each row to the curated
 * make+model family it belongs to (`resolveMakeModelFamily` — the same matcher the
 * state page's rail uses), aggregates by (combo, USPS state), and keeps combos at
 * or above the threshold. Returns [] on any failure (build never crashes; the
 * route/sitemap simply emit nothing extra).
 */
export async function getInventoryMakeModelStates(): Promise<SeoMakeModelState[]> {
  if (_intersectionCache) return _intersectionCache

  const supabase = await createAnonReadClient()
  if (!supabase) return []

  try {
    // Page through the whole active table (1000-row PostgREST cap per request).
    const PAGE = 1000
    const rows: { make: string | null; model: string | null; state: string | null }[] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('aircraft_for_sale')
        .select('make, model, state')
        .eq('status', 'active')
        .not('make', 'is', null)
        .not('model', 'is', null)
        .not('state', 'is', null)
        .range(from, from + PAGE - 1)
      if (error || !data) break
      rows.push(...data)
      if (data.length < PAGE) break
    }

    // Aggregate active-listing counts per (combo key, USPS state code). Only rows
    // that resolve to a real inventory-backed make+model family are counted, so an
    // intersection page can never exist without its parent model page.
    type Agg = { entry: SeoMakeModel; code: string; count: number }
    const agg = new Map<string, Agg>()
    for (const row of rows) {
      const code = (row.state ?? '').trim().toUpperCase()
      if (code.length !== 2 || !STATE_NAMES[code]) continue
      const entry = resolveMakeModelFamily(row.make, row.model)
      if (!entry) continue
      const key = `${entry.makeSlug}/${entry.modelSlug}/${code}`
      const existing = agg.get(key)
      if (existing) existing.count += 1
      else agg.set(key, { entry, code, count: 1 })
    }

    const out: SeoMakeModelState[] = [...agg.values()]
      .filter((a) => a.count >= INTERSECTION_MIN_COUNT)
      .map((a) => ({
        entry: a.entry,
        code: a.code,
        stateName: STATE_NAMES[a.code],
        stateSlug: stateSlug(STATE_NAMES[a.code]),
        count: a.count,
      }))
      .sort((a, b) =>
        b.count - a.count ||
        a.entry.makeSlug.localeCompare(b.entry.makeSlug) ||
        a.entry.modelSlug.localeCompare(b.entry.modelSlug) ||
        a.code.localeCompare(b.code)
      )

    _intersectionCache = out
    return out
  } catch {
    return []
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

// ---------------------------------------------------------------------------
// MAKE-only level — the aggregation page at `/aircraft/[make]` (e.g. /aircraft/cessna)
//
// Sits structurally between `/aircraft` and `/aircraft/[make]/[model]`. A make is
// "real" iff it has at least one inventory-backed model FAMILY (i.e. it appears in
// `getInventoryMakeModels()`), so we derive makes by grouping that SAME single
// source of truth — no extra query, and a make can never claim a model page that
// doesn't exist. `make`/`makeSlug` come straight from the model entries, so the
// display name matches the model pages exactly (curated names win there already).
// ---------------------------------------------------------------------------

export type SeoMake = {
  makeSlug: string
  /** display make name, taken from the model entries (curated names win). */
  make: string
  /** the make's inventory-backed model families, in the order they appear in
   *  `getInventoryMakeModels()` (curated families first). */
  models: SeoMakeModel[]
}

/**
 * Every make that has ≥1 inventory-backed model family, with its models grouped
 * under it. Built purely from `getInventoryMakeModels()` so the make pages, the
 * model pages, the sitemap, and the rails all share ONE source of truth and can
 * never drift. A make absent from the inventory simply isn't returned (→ the
 * route 404s it; the sitemap omits it).
 */
export async function getInventoryMakes(): Promise<SeoMake[]> {
  const combos = await getInventoryMakeModels()
  const byMake = new Map<string, SeoMake>()
  for (const e of combos) {
    const existing = byMake.get(e.makeSlug)
    if (existing) existing.models.push(e)
    else byMake.set(e.makeSlug, { makeSlug: e.makeSlug, make: e.make, models: [e] })
  }
  return [...byMake.values()].sort((a, b) => a.makeSlug.localeCompare(b.makeSlug))
}

/**
 * Resolve a make slug to its `SeoMake` (display name + its model families), or
 * null when the make has no inventory-backed models. Used by the route + metadata
 * so any make with real inventory resolves and thin makes 404.
 */
export async function resolveMake(makeSlug: string): Promise<SeoMake | null> {
  const slug = makeSlug.toLowerCase()
  const makes = await getInventoryMakes()
  return makes.find((m) => m.makeSlug === slug) ?? null
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

/**
 * Turn the active for-sale searchParams on `/aircraft` into a human-readable
 * phrase for the email-alert context, e.g. "Cessna 172 in California under
 * $50,000" or "Cirrus". Returns a generic fallback when no meaningful filter is
 * set, so the captured alert is always sensible. The phrase is a bare qualifier
 * (no "new"/"listings"/"aircraft") because AlertSignup wraps it in three frames —
 * "new {ctx} listings", "a new {ctx} aircraft is listed", "new {ctx} listings
 * appear" — so the generic fallback is "general aviation" (→ "new general
 * aviation listings"), matching the make/state convention the live for-sale
 * pages already use (e.g. context "California", "Cessna"). Pure + read-only —
 * mirrors the same filter keys the for-sale list reads
 * (make/model/state/max_price/min_year/max_tt/q).
 */
export function describeAircraftFilters(
  params: Record<string, string | undefined>
): string {
  const make = params.make?.trim()
  const model = params.model?.trim()
  const stateName = params.state ? STATE_NAMES[params.state.toUpperCase()] : undefined
  // A range bound is meaningful only when it parses to a positive number.
  const num = (raw: string | undefined): number | null => {
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  const minPrice = num(params.min_price)
  const maxPrice = num(params.max_price)
  const minYear = num(params.min_year)
  const maxYear = num(params.max_year)
  const minTt = num(params.min_tt)
  const maxTt = num(params.max_tt)
  const keyword = params.q?.trim()

  const dollars = (n: number) => `$${n.toLocaleString('en-US')}`
  const hours = (n: number) => `${n.toLocaleString('en-US')} hours`

  // Lead with make/model; if neither, lead with the generic noun.
  const lead = make ? [make, model].filter(Boolean).join(' ') : 'aircraft'

  const clauses: string[] = []
  if (stateName) clauses.push(`in ${stateName}`)
  // Price: render whichever bound(s) are set as a range/over/under clause.
  if (minPrice && maxPrice) clauses.push(`${dollars(minPrice)}–${dollars(maxPrice)}`)
  else if (maxPrice) clauses.push(`under ${dollars(maxPrice)}`)
  else if (minPrice) clauses.push(`over ${dollars(minPrice)}`)
  // Year range.
  if (minYear && maxYear) clauses.push(`${minYear}–${maxYear}`)
  else if (minYear) clauses.push(`from ${minYear} or newer`)
  else if (maxYear) clauses.push(`up to ${maxYear}`)
  // Total time (airframe hours).
  if (minTt && maxTt) clauses.push(`${minTt.toLocaleString('en-US')}–${hours(maxTt)}`)
  else if (maxTt) clauses.push(`under ${hours(maxTt)}`)
  else if (minTt) clauses.push(`over ${hours(minTt)}`)
  if (keyword) clauses.push(`matching "${keyword}"`)

  const hasMakeOrModel = Boolean(make || model)
  if (!hasMakeOrModel && clauses.length === 0) return 'general aviation'

  return [lead, ...clauses].join(' ')
}
