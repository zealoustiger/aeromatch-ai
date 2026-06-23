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

// Per-MAKE partnership FAQs — genuine, evergreen, CO-OWNERSHIP-level Q&As attached
// to each curated partnership hub page (`/partnerships/make/[make]`), rendered
// visibly AND emitted as FAQPage JSON-LD (visible text must match the structured
// data 1:1). Keyed by SEO_MAKES slug. These are intentionally distinct from the
// for-sale `MAKE_FAQS` (which answer buying questions): here every answer is about
// SHARING the airplane — why the make suits a partnership, which model fits a group,
// and how co-ownership costs split. Drawn from the SEO_MAKES blurbs + well-known
// general-aviation facts — NO fabricated statistics and NO live listing counts, so
// the copy stays accurate and never goes stale. A make absent here renders no FAQ.
const PARTNERSHIP_MAKE_FAQS: Record<string, { q: string; a: string }[]> = {
  cessna: [
    { q: 'Why are Cessnas such popular partnership aircraft?', a: 'Cessna singles are the most commonly co-owned aircraft in America for a simple reason: parts are everywhere and nearly every A&P knows them, so maintenance is low-drama and predictable. That stability is exactly what a group of owners wants — fewer surprise bills to split and an airplane that is easy to insure across multiple pilots.' },
    { q: 'Which Cessna is best for a co-ownership group?', a: 'The 172 Skyhawk is the default partnership single — forgiving, inexpensive to run, and universally supported. Step up to the 182 Skylane if your group regularly carries four people or flies out of higher or shorter fields and wants the extra horsepower and useful load.' },
    { q: 'How do costs split on a Cessna partnership?', a: 'Like any share: a one-time buy-in for your portion of the airplane, a monthly fixed amount covering hangar, insurance, and the annual reserve, and an hourly wet rate for the time you actually fly. Cessna’s ubiquitous parts and mechanics keep the fixed side modest, so each owner’s monthly share stays small.' },
  ],
  piper: [
    { q: 'Why co-own a Piper?', a: 'The low-wing PA-28 family — Cherokees, Archers, and Arrows — has low operating costs, forgiving handling, and a huge parts supply, which makes a Piper one of the easiest airplanes for a first partnership. Simple, well-understood systems mean predictable shared maintenance.' },
    { q: 'Which Piper is best for a partnership?', a: 'A fixed-gear Cherokee or Archer is one of the most economical singles to share — simple systems and predictable upkeep. Move up to an Arrow if the group wants retractable and complex time, or a Saratoga when you need six seats.' },
    { q: 'What does a Piper partnership cost?', a: 'The fixed-gear PA-28s are among the lowest-cost four-seat singles to run. Splitting the hangar, insurance, and annual across the partners keeps each owner’s monthly fixed share low; you then pay an hourly wet rate only for the hours you fly.' },
  ],
  cirrus: [
    { q: 'Why do pilots co-own Cirrus aircraft?', a: 'Co-ownership is how most pilots make a Cirrus pencil out. Splitting the hangar, insurance, and the periodic CAPS parachute repack across a few partners turns an advanced glass single with a whole-airframe parachute into a realistic monthly number.' },
    { q: 'SR20 or SR22 for a partnership?', a: 'The SR20 (about 215 hp) is the more attainable share — cheaper to buy and run, and plenty for training and regional trips. The SR22 (about 310 hp) carries more, climbs better, and flies faster. Both share the same glass panel and CAPS parachute, so the choice is really about mission and budget.' },
    { q: 'What is unique about Cirrus partnership costs?', a: 'On top of the usual hangar, insurance, and annual, a Cirrus has the periodic CAPS parachute repack — a known recurring expense. It is one of the best reasons to share the airplane, because the repack and the glass-panel upkeep are far easier to absorb split across a group.' },
  ],
  beechcraft: [
    { q: 'Why co-own a Beechcraft?', a: 'Bonanzas and Barons are legendary travelers with traveling-machine costs — higher fuel burn and healthy engine reserves (two of them on a Baron). Co-ownership is what brings those costs within reach, which is why so many of these airplanes are shared.' },
    { q: 'Bonanza or Baron for a group?', a: 'The Bonanza is a fast, efficient single; the Baron adds a second engine for redundancy and range at roughly double the maintenance. For most partnerships the single is the easier airplane to share — choose the Baron only if the group specifically wants twin redundancy.' },
    { q: 'How are costs split on a Beechcraft partnership?', a: 'A buy-in for your share, a monthly fixed amount for hangar, insurance, and engine reserves, and an hourly wet rate for flying. The higher reserves on a Bonanza or Baron are exactly why these get co-owned — split across partners, a premium traveler becomes affordable.' },
  ],
  mooney: [
    { q: 'Why co-own a Mooney?', a: 'Mooneys deliver the best speed-per-dollar in piston aviation, but the retractable gear adds an annual inspection and an insurance premium. A partnership spreads those fixed costs, so the famously efficient M20 becomes even more economical per owner.' },
    { q: 'Is a Mooney a good partnership airplane?', a: 'It is a capable cross-country traveler rather than a trainer — a snug cabin, retractable gear, and more systems to manage. It suits a group of pilots who mostly travel and are comfortable with a complex single, rather than one building primary time.' },
    { q: 'What does a Mooney partnership cost?', a: 'Fuel is low for the speed you get, which keeps the hourly wet rate down. The retractable gear adds to the fixed side via inspections and insurance — costs a partnership is well suited to share across owners.' },
  ],
  diamond: [
    { q: 'Why co-own a Diamond?', a: 'Modern composite airframes, fuel-efficient Austro diesels, and an excellent safety record make the DA40 and DA42 attractive to share. A partnership splits the higher purchase price and engine/gearbox reserves while everyone enjoys a new-feeling, efficient airplane.' },
    { q: 'DA40 or DA42 for a partnership?', a: 'The four-seat DA40 single is the natural choice for most groups — efficient, safe, and simpler to share. The twin DA42 suits a partnership that specifically wants twin capability and the redundancy that comes with it.' },
    { q: 'What does a Diamond partnership cost?', a: 'The diesel models sip Jet-A and the composite airframes are durable, which keeps the running costs reasonable; the trade-offs are a higher purchase price and engine/gearbox reserves. Sharing the airplane spreads those reserves across the partners.' },
  ],
  vans: [
    { q: 'Can you co-own an experimental RV?', a: 'Absolutely — many RVs are shared. Just confirm the operating limitations and that insurance works for multiple owners, and make sure everyone in the group is comfortable with the builder-maintained nature of an amateur-built airplane.' },
    { q: 'Why co-own a Van’s RV?', a: 'The RV series offers unmatched performance per dollar, and because owner-performed maintenance is allowed on experimentals, running costs stay low. Partnerships are common among builders and sport pilots who want fast, fun flying without a certified airplane’s price tag.' },
    { q: 'Which RV is best for a partnership?', a: 'The two-seat RVs (like the RV-7 or RV-8) are ideal for sport flying among a small group; the four-seat RV-10 suits partners who carry families. Whichever you choose, agree up front on who maintains the airplane and how the build/condition is documented.' },
  ],
  grumman: [
    { q: 'Why co-own a Grumman?', a: 'Grumman’s light singles — the AA-5 Traveler, Tiger, and Cheetah — pair sporty sliding-canopy handling with simple bonded airframes that keep both fuel and shared maintenance costs down. That low overhead makes them popular first-partnership airplanes.' },
    { q: 'Grumman Tiger or Cheetah for a group?', a: 'The Tiger has more power and is the faster, better climber; the Cheetah is a bit more economical to run. Both share the same fun sliding-canopy character, so pick based on whether your group prioritizes performance or operating cost.' },
    { q: 'What does a Grumman partnership cost?', a: 'Simple systems and slippery airframes keep both the hourly wet rate and shared maintenance low. A buy-in plus a modest monthly fixed share for hangar, insurance, and the annual is typically all it takes to keep one of these in a partnership.' },
  ],
}

/**
 * Resolve a partnership make slug to its 3 curated co-ownership FAQs, or null when
 * the make isn't curated (→ the page renders no FAQ, like a thin make). Mirrors how
 * `resolveMake` attaches the for-sale `MAKE_FAQS`.
 */
export function getPartnershipMakeFaqs(slug: string): { q: string; a: string }[] | null {
  return PARTNERSHIP_MAKE_FAQS[slug.toLowerCase()] ?? null
}

// Per-MAKE "About co-owning a {Make}" overview prose — 2 genuine, evergreen narrative
// paragraphs per curated make, rendered as editorial body copy on the partnership hub
// page (`/partnerships/make/[make]`). This is the partnership-side counterpart to the
// for-sale `MAKE_OVERVIEWS`: unique content depth to lift these hubs above templated,
// count-only boilerplate in the INDEXING stage. Deliberately distinct from BOTH the
// co-ownership Q&A `PARTNERSHIP_MAKE_FAQS` on the same page (narrative, not questions)
// AND the brand-history `MAKE_OVERVIEWS` on the for-sale hubs (this copy leads with the
// sharing/cost-splitting angle, not lineage). Keyed by SEO_MAKES slug. Drawn from the
// SEO_MAKES blurbs + well-known general-aviation facts — NO fabricated statistics and
// NO live listing counts, so the copy never goes stale. Curated makes only; a make
// absent here renders no About section (graceful).
const PARTNERSHIP_MAKE_OVERVIEWS: Record<string, string[]> = {
  cessna: [
    'A Cessna single is the airplane most partnerships start with, and for good reason. The high-wing 150/152, 172 Skyhawk, 182 Skylane, and 206 are the best-supported light aircraft in the world — parts sit on shelves everywhere and nearly every mechanic has worked on them — so the maintenance surprises that can sour a co-ownership are rare. A group can put a Cessna on a tie-down or in a hangar and expect predictable, drama-free upkeep year after year.',
    'That predictability is exactly what makes the cost-split work. With low, well-understood fixed costs, dividing the hangar, insurance, and annual across two to four partners brings each owner’s monthly share down to a comfortable number, and deep resale demand means the group can exit cleanly when someone moves on. It is no accident that Cessnas are the most commonly co-owned airplanes in America — they remove most of the friction that makes shared ownership hard.',
  ],
  piper: [
    'Piper’s low-wing PA-28 Cherokee family — the Cherokee, Warrior, Archer, and retractable Arrow — is a natural fit for a partnership. The fixed-gear models pair forgiving, stable handling with simple systems and one of the largest parts-and-maintenance networks in aviation, so a group of newer pilots can share one without worrying about exotic upkeep. When a partnership wants to grow into complex or retractable time, the Arrow is the same airframe with the gear that folds; the six-seat Saratoga steps up when members fly with families.',
    'The economics are what keep the arrangement easy. A shared Warrior or Archer is among the least expensive four-seat singles to operate, so the monthly-per-partner figure stays modest even after the hangar and insurance are split. Because the PA-28 is such a common trainer and first airplane, demand stays strong and a partnership can add or replace a member without much trouble — the airplane is as liquid as it is affordable.',
  ],
  cirrus: [
    'Co-ownership is how most pilots actually fly a Cirrus. The SR20 and SR22 are modern composite singles built around a full glass panel and the CAPS whole-airframe parachute, and that capability carries a purchase price and insurance bill that are a stretch for one owner but very manageable split across a group. A partnership lets two to four pilots share a fast, advanced traveling airplane that none of them would buy alone — and keeps it flown often enough that everyone stays current and proficient.',
    'The line gives a group room to match the airplane to its budget: the lighter SR20 is the more attainable entry for training and regional trips, while the SR22 adds the power, payload, and speed for serious cross-country travel — both with the same panel and parachute. Beyond the usual hangar and insurance, the periodic CAPS parachute repack is the one big-ticket item unique to a Cirrus, and it is precisely the kind of scheduled cost that splits cleanly and painlessly across partners.',
  ],
  beechcraft: [
    'Beechcraft’s Bonanza and Baron are some of the most capable traveling airplanes in piston aviation, and they are classic partnership machines because of it. The single-engine Bonanza is fast, roomy, and built to a premium standard; the twin Baron adds a second engine for redundancy and range. Both reward a group that wants a genuine cross-country airplane and is happy to share the responsibility of owning one to a higher standard than a typical trainer.',
    'They also carry traveling-machine costs — more fuel, healthy engine reserves, and, on a Baron, two engines to maintain — which is exactly why co-ownership suits them so well. Spreading those fixed costs across partners turns a serious airplane into a realistic monthly figure, and because Beechcraft owners tend to keep their aircraft meticulously, a well-run partnership protects a strong long-term asset. Choose the Bonanza unless the group specifically wants twin redundancy and the maintenance that comes with it.',
  ],
  mooney: [
    'For a partnership that values speed and efficiency over cabin space, a Mooney is hard to beat. The low-drag M20 series delivers the best speed-per-dollar in piston aviation, cruising faster on far less fuel than airplanes that look quicker on paper. A group of cross-country pilots gets a genuine traveler whose low fuel burn keeps the per-hour cost — the part each partner pays as they fly — pleasantly low.',
    'A Mooney is a traveler rather than a trainer: the cabin is snug, the gear retracts, and there are more systems to manage, so partnerships tend to form among pilots who already have some fixed-gear time. The retractable gear adds an annual inspection and an insurance line, but those are fixed costs a group spreads comfortably. Match the partners to the airplane — pilots who want to go places efficiently rather than build primary time — and a shared Mooney is one of the most economical fast singles to own.',
  ],
  diamond: [
    'Diamond’s DA40 single and DA42 twin were practically designed for shared ownership. The bonded composite airframes are durable, the bubble canopies and modern panels feel a generation ahead of older trainers, and many examples run fuel-efficient Austro Jet-A diesels — a combination that, together with an outstanding safety record, has made Diamonds favorites of flight schools and co-ownership groups alike. A partnership gets a new-feeling, economical airplane that members are glad to fly often.',
    'The economics fit a group neatly: the diesels sip Jet-A and the airframes hold up well, keeping running costs low, while the higher purchase price and the engine and gearbox reserves are exactly the kind of fixed costs that divide cleanly across partners. The result is a modern glass-panel airplane for a sensible monthly share — and a partnership structure that lets a group enjoy current avionics and diesel economy without any one member carrying the whole bill.',
  ],
  vans: [
    'Van’s RV series shows up in partnerships more than almost any other experimental. These sporty two- and four-seat kit airplanes offer performance per dollar that certified singles can’t touch, and they come backed by one of the largest, most active builder communities in aviation — so there is always knowledge, parts, and help close at hand. Sharing a finished RV lets a group of sport pilots fly something that climbs, cruises, and rolls far beyond its modest fuel burn for a fraction of the per-person cost.',
    'The experimental nature is the real cost advantage: owners can perform much of their own maintenance, which keeps a shared RV remarkably inexpensive to run. The trade-off a partnership should square away up front is the paperwork — confirm the operating limitations and that insurance works cleanly for multiple owners and, where relevant, the builder. Settle that, and an RV is one of the most rewarding and affordable airplanes a small group can own together.',
  ],
  grumman: [
    'Grumman’s light singles make excellent first partnerships. The four-seat AA-5 line — the Traveler, Cheetah, and Tiger — pairs sliding-canopy character and sporty, responsive handling with bonded aluminum airframes and genuinely simple systems. There is little to go wrong and little that is expensive to fix, which is exactly what a group of newer co-owners wants in a shared airplane they can learn on and travel in.',
    'Simplicity drives the cost story: clean, slippery airframes and uncomplicated systems keep both fuel and shared maintenance bills low, so the monthly-per-partner figure stays small even after hangar and insurance are split. Within the line, the Tiger is the faster, stronger climber and the Cheetah the more economical — either way a partnership gets the same open-canopy fun at one of the lowest costs of entry in four-seat ownership.',
  ],
}

/**
 * Resolve a partnership make slug to its 2-paragraph "About co-owning a {Make}" overview
 * prose, or null when the make isn't curated (→ no About section). Mirrors
 * `getPartnershipMakeFaqs`.
 */
export function getPartnershipMakeOverview(slug: string): string[] | null {
  return PARTNERSHIP_MAKE_OVERVIEWS[slug.toLowerCase()] ?? null
}

/**
 * Per-state co-ownership FAQs for `/partnerships/state/[state]`, keyed by lowercase
 * USPS code (the route's slug). Curated high-GA-activity states only — the priority
 * index pages (ca/tx/fl) plus a few genuinely distinctive GA states. Non-curated
 * states render no FAQ (like a thin make), so we never ship templated boilerplate
 * across all 50 states (GOAL.md guardrail). Answers are evergreen, partnership-
 * focused, and use only well-known, durable facts — no fabricated stats, no live counts.
 */
const PARTNERSHIP_STATE_FAQS: Record<string, { q: string; a: string }[]> = {
  ca: [
    { q: 'Why is California a good place to co-own an aircraft?', a: 'California has one of the largest general-aviation communities in the country and mild, fly-almost-year-round weather across much of the state, so a shared airplane gets used instead of sitting. Hangar space is scarce and expensive near the coast, which is exactly why splitting those fixed costs across a partnership makes ownership pencil out for many California pilots.' },
    { q: 'Where are aircraft partnerships concentrated in California?', a: 'Around the major GA hubs: the Bay Area (Palo Alto, San Carlos, Hayward, Reid-Hillview, Livermore), the Los Angeles basin (Van Nuys — one of the busiest GA airports in the world — plus Santa Monica, Long Beach, and Camarillo), and San Diego (Montgomery-Gibbs, Gillespie). Searching partnerships by your home airport is the fastest way to find a share you can actually fly from.' },
    { q: 'What affects co-ownership costs in California?', a: 'Hangar and tie-down rates near the coastal metros are among the highest in the nation and waitlists are long, so the monthly fixed share is usually the biggest line item. The flip side is heavy utilization — good weather means the airplane flies often — and sharing the hangar, insurance, and annual across partners is what keeps each owner’s number reasonable.' },
  ],
  tx: [
    { q: 'Why co-own an aircraft in Texas?', a: 'Texas is big, flat, and full of airports, with long VFR-friendly flying seasons and wide-open airspace once you leave the major Class B areas — ideal for cross-country flying and time-building. With distances between cities that make light aircraft genuinely useful, a co-ownership share spreads the cost of a capable traveling airplane across several pilots.' },
    { q: 'Where are aircraft partnerships concentrated in Texas?', a: 'The big metros: the Dallas–Fort Worth area (Addison, Arlington, Denton, Fort Worth Meacham), greater Houston (Sugar Land, Hooks/David Wayne Hooks, Pearland, La Porte), Austin (Georgetown, San Marcos), and San Antonio. Hangars are generally more available and more affordable than on the coasts, so groups have more options on where to base.' },
    { q: 'What affects co-ownership costs in Texas?', a: 'Hangar costs are typically lower than in California or the Northeast, and Texas has no state income tax — though sales/use tax can apply to an aircraft purchase, so it is worth checking with a tax professional before you buy into a share. Hot summers make a hangar (rather than a tie-down) worthwhile to protect avionics and paint, a cost the partnership splits.' },
  ],
  fl: [
    { q: 'Why is Florida popular for aircraft co-ownership?', a: 'Florida has year-round VFR weather, flat terrain, and one of the densest concentrations of general-aviation activity and flight training in the country, so airplanes here fly a lot. High utilization plus a deep pool of pilots and mechanics makes Florida a natural place to share an airplane and keep it busy.' },
    { q: 'Where are aircraft partnerships concentrated in Florida?', a: 'Across the big GA areas: South Florida (Fort Lauderdale Executive, Pompano Beach, Boca Raton, Opa-locka), the Orlando area (Orlando Executive, Kissimmee, Sanford), Tampa Bay (St. Petersburg–Clearwater, Tampa Executive), and Jacksonville. Searching by your home airport surfaces the partnerships you could realistically fly from.' },
    { q: 'What should Florida co-owners plan for?', a: 'Two things shape the budget: summer thunderstorms and heat, which make a hangar valuable to protect the airplane, and the coastal salt-air environment, which is hard on airframes and avionics and rewards diligent maintenance. Both are easier to absorb as a shared cost — a partnership covers the hangar and upkeep across several owners.' },
  ],
  az: [
    { q: 'Why co-own an aircraft in Arizona?', a: 'Arizona offers some of the most reliable VFR flying weather anywhere — clear skies the large majority of the year — which is why so much flight training and recreational flying is based here. A shared airplane in Arizona rarely sits weathered-in, so the partnership gets real use out of it.' },
    { q: 'What do Arizona co-owners need to know about density altitude?', a: 'Summer heat and elevation push density altitude high, which hurts takeoff and climb performance — so groups often favor airplanes with more horsepower or accept density-altitude limits in the hotter months. It is a key consideration when a partnership chooses which aircraft to buy and how to operate it safely from higher or shorter strips.' },
    { q: 'Where are aircraft partnerships concentrated in Arizona?', a: 'Mainly around Phoenix (Deer Valley — one of the busiest GA airports in the country — Scottsdale, Falcon Field/Mesa, Chandler, Glendale) and Tucson (Ryan Field, Tucson International GA). Hangars are more available than on the coasts, which gives partnerships flexibility on where to base.' },
  ],
  co: [
    { q: 'Why co-own an aircraft in Colorado?', a: 'Colorado has a strong general-aviation community and spectacular flying, and an airplane opens up the mountains and the wide distances of the Front Range and Western Slope. Because capable, well-equipped airplanes suit Colorado flying, co-ownership is a common way for pilots to share the cost of an aircraft up to the mission.' },
    { q: 'What makes mountain flying important for Colorado co-owners?', a: 'High terrain and high density altitude make performance and pilot proficiency genuinely matter — groups often choose airplanes with adequate horsepower and agree on mountain-flying currency and weather minimums. Setting those expectations among partners up front is part of safely sharing an airplane in the Rockies.' },
    { q: 'Where are aircraft partnerships concentrated in Colorado?', a: 'Largely along the Front Range: the Denver area (Centennial — among the busiest GA airports in the nation — Rocky Mountain Metro, Front Range), Boulder, Colorado Springs, and Fort Collins–Loveland, with mountain-town fields like Eagle and Aspen serving recreational flying. Searching by home airport finds the shares you can fly from.' },
  ],
  wa: [
    { q: 'Why co-own an aircraft in Washington?', a: 'Washington has a deep aviation culture and a busy general-aviation scene, and an airplane is genuinely useful for reaching the San Juan Islands, the coast, and destinations east of the Cascades. Sharing the airplane spreads the cost of a well-equipped aircraft that can handle the region’s varied flying.' },
    { q: 'How does Pacific Northwest weather shape co-ownership here?', a: 'Marine-layer clouds, rain, and shorter winter days make IFR capability and instrument proficiency valuable, and a hangar helps protect the airplane from persistent moisture. Groups often favor a well-equipped airplane and agree on instrument currency — costs and standards a partnership shares.' },
    { q: 'Where are aircraft partnerships concentrated in Washington?', a: 'Mostly around Puget Sound: the Seattle area (Boeing Field, Renton, Paine Field/Everett, Auburn), Tacoma (Thun Field/Pierce County), and Olympia, plus Spokane and the Bellingham area near the islands. Searching partnerships by your home airport surfaces the ones you could realistically join.' },
  ],
}

/**
 * Resolve a partnership state code (lowercase USPS, the route slug) to its 3 curated
 * co-ownership FAQs, or null when the state isn't curated (→ no FAQ). Mirrors
 * `getPartnershipMakeFaqs`.
 */
export function getPartnershipStateFaqs(code: string): { q: string; a: string }[] | null {
  return PARTNERSHIP_STATE_FAQS[code.toLowerCase()] ?? null
}

/**
 * Per-STATE "Co-owning an aircraft in {State}" overview prose — 2 genuine, evergreen
 * narrative paragraphs per curated state, rendered as editorial body copy near the top
 * of the partnership state page (`/partnerships/state/[state]`). The co-ownership
 * counterpart to `FORSALE_STATE_OVERVIEWS`: unique content depth (how co-ownership
 * works in that state's GA scene + the basing/cost realities that make sharing pay off)
 * to lift these priority hubs (ca/tx/fl are seed pages #8/#9/#10) above templated,
 * count-only boilerplate in the INDEXING stage. Deliberately distinct in wording from
 * BOTH the page's Q&A `PARTNERSHIP_STATE_FAQS` AND the for-sale `FORSALE_STATE_OVERVIEWS`.
 * Keyed by lowercase USPS code; same curated high-GA set as the partnership-state FAQs.
 * Well-known GA facts only — NO fabricated statistics, NO live listing counts, so the
 * copy never goes stale. Non-curated states render no overview.
 */
const PARTNERSHIP_STATE_OVERVIEWS: Record<string, string[]> = {
  ca: [
    'California is partnership country. The state pairs one of the largest pilot populations in the nation with a fly-almost-year-round climate, so a shared airplane actually earns its keep instead of sitting on a ramp between weekend flights. With several partners spreading the calendar, a Bay Area or LA-basin group can keep an airplane flying often enough that everyone stays current — the kind of utilization that makes co-ownership click rather than drift.',
    'The economics are what push so many California pilots toward a share in the first place. Tie-down and hangar space near the coastal metros is scarce and expensive, and insurance and labor track the state’s high cost of living, so the fixed bills that sink a solo owner are exactly the ones a partnership splits cleanly. Divide the hangar, insurance, and annual across two to four owners and a capable airplane becomes a realistic monthly figure — which is why shares change hands steadily here whenever a member moves on.',
  ],
  tx: [
    'Texas is built for shared flying. The long distances between its cities make a personal airplane genuinely useful, the VFR-friendly season is long, and there is no shortage of airports to base at — so a co-ownership group gets real, regular use out of a traveling single or light twin. A partnership turns "I’d fly more if it were closer and cheaper" into an airplane several pilots can reach from Dallas–Fort Worth, Houston, Austin, or San Antonio.',
    'Sharing also smooths the costs that come with a capable traveler. Hangars are generally more available and more affordable than on the coasts, and the state’s no-income-tax setting helps — though a purchase can still trigger sales or use tax, worth checking before you buy into a share. Hot summers and the odd hailstorm make covered storage worthwhile, and that hangar, like the insurance and the annual, is simply one more fixed cost a Texas partnership divides among its members.',
  ],
  fl: [
    'Florida’s combination of year-round VFR weather and some of the densest flight-training activity in the country makes it a natural place to co-own. High utilization is the whole point of a partnership, and here an airplane rarely waits long for good weather — a group of two to four pilots can keep a shared single genuinely busy across South Florida, Orlando, Tampa Bay, or Jacksonville while everyone stays proficient.',
    'The Florida environment is also why sharing the upkeep pays off. Coastal salt air is hard on airframes and avionics, and summer heat and storms reward covered storage — so a hangar and diligent maintenance matter more here than in milder places. Those are precisely the costs a partnership is good at absorbing: split the hangar and the annual across several owners and protecting the airplane properly stops being a budget strain and becomes a shared, manageable line item.',
  ],
  az: [
    'Arizona offers some of the most dependable flying weather anywhere, and that reliability is a gift to a co-ownership group — a shared airplane in Phoenix or Tucson rarely sits weathered-in, so partners get steady, predictable access to it. The dry desert air is also kind to airframes, which means the aircraft a partnership buys tends to age well and hold its value, an underrated advantage when several owners share the long-term asset.',
    'The desert does shape the group’s choices. Summer heat and field elevation push density altitude high, so partners often favor an airplane with horsepower to spare and agree on hot-and-high operating limits up front — the sort of shared standard a well-run partnership sets together. Hangars are easier to come by than on the coasts, keeping the fixed costs each member pays reasonable, which is a big part of why Arizona’s co-ownership scene stays healthy.',
  ],
  co: [
    'Colorado rewards a capable, well-equipped airplane, and that is exactly the kind of aircraft a partnership makes affordable. The flying — mountains, wide Front Range distances, real IFR weather — calls for more airplane than a bare-bones trainer, and splitting the cost across several owners is how many Colorado pilots get into one. A group also keeps a shared airplane flown regularly enough that everyone maintains the proficiency this terrain demands.',
    'Mountain flying makes the partners’ agreement matter as much as the airplane. High terrain and high density altitude mean performance and currency genuinely count, so co-owners here tend to set mountain-flying and weather standards together and choose an airplane with the horsepower and equipment to back them. The hangar, insurance, and annual on a well-equipped Front Range single all divide cleanly across the group — turning a serious mountain airplane into a sensible monthly share.',
  ],
  wa: [
    'Washington’s deep aviation culture and varied flying — the San Juans and the coast on one side, the high country east of the Cascades on the other — make a well-equipped airplane genuinely useful, and a partnership is how a lot of Northwest pilots afford one. Sharing keeps an IFR-capable single in regular use rather than parked through the gray months, and spreads the cost of the equipment this region rewards across several owners instead of one.',
    'Pacific Northwest weather shapes how a group operates and what it spends on. Marine-layer clouds, rain, and short winter days make instrument capability and currency valuable, so partners often favor a well-equipped airplane and agree to keep their IFR proficiency up. Persistent moisture also makes a hangar worth the cost to fend off corrosion — and like the insurance and the annual, that hangar is a fixed bill a Puget Sound partnership comfortably divides among its members.',
  ],
}

/**
 * Resolve a partnership state code (lowercase USPS, the route slug) to its 2-paragraph
 * overview prose, or null when the state isn't curated (→ no overview section). Mirrors
 * `getForSaleStateOverview` / `getPartnershipStateFaqs`.
 */
export function getPartnershipStateOverview(code: string): string[] | null {
  return PARTNERSHIP_STATE_OVERVIEWS[code.toLowerCase()] ?? null
}

/**
 * Per-state *buying*-focused FAQs for `/aircraft/for-sale/[state]`, keyed by lowercase
 * USPS code. Curated high-GA-activity states only — the top for-sale search targets
 * (`aircraft for sale california` is the #1 autocomplete) plus other distinctive GA
 * states. This set extends beyond PARTNERSHIP_STATE_FAQS (ca/tx/fl/az/co/wa) with
 * ny/il/ga/nc, since for-sale geo demand is the heaviest; the partnership-state set is
 * the natural next slice to bring back to parity.
 * Non-curated states render no FAQ (like a thin make), so we never ship templated
 * boilerplate across all 50 (GOAL.md guardrail). These answer BUYING questions (where
 * to look, what to inspect, what drives price in that state) and are intentionally
 * distinct from the co-ownership-focused PARTNERSHIP_STATE_FAQS. Evergreen, well-known,
 * durable facts only — no fabricated stats, no live counts.
 */
const FORSALE_STATE_FAQS: Record<string, { q: string; a: string }[]> = {
  ca: [
    { q: 'Is it a good idea to buy an aircraft in California?', a: 'California has one of the largest used-aircraft markets in the country, so selection is deep across makes, models, and price points — you are rarely stuck with just one or two candidates. The trade-off is cost of ownership after the sale: hangar and tie-down space near the coastal metros is scarce and expensive, so factor your basing costs in before you commit to a purchase.' },
    { q: 'Where should I look for aircraft for sale in California?', a: 'Inventory clusters around the major GA hubs — the Bay Area (Palo Alto, San Carlos, Hayward, Reid-Hillview, Livermore), the Los Angeles basin (Van Nuys, Santa Monica, Long Beach, Camarillo), and San Diego (Montgomery-Gibbs, Gillespie). Buying near where you intend to base saves a ferry flight and lets you do the pre-buy inspection with a local mechanic who knows the airplane.' },
    { q: 'What should I check before buying an aircraft in California?', a: 'Beyond the usual logbook and airworthiness review, get an independent pre-buy inspection from an A&P you trust, confirm the annual status and any open ADs, and budget for California’s higher fixed costs (hangar, insurance). Note that buying an aircraft can trigger California sales/use tax — check the current rules with a tax professional before you close.' },
  ],
  tx: [
    { q: 'Why buy an aircraft in Texas?', a: 'Texas has a large, active general-aviation market and the long VFR-friendly flying seasons that keep airplanes flying and well-exercised. Distances between cities make a light aircraft genuinely useful, so there is steady demand and a deep supply of traveling singles and twins to choose from, often at more reasonable basing costs than the coasts.' },
    { q: 'Where should I look for aircraft for sale in Texas?', a: 'The big metros carry most of the inventory: Dallas–Fort Worth (Addison, Arlington, Denton, Fort Worth Meacham), greater Houston (Sugar Land, David Wayne Hooks, Pearland, La Porte), Austin (Georgetown, San Marcos), and San Antonio. Hangars are generally more available and more affordable than in California, which widens your options on where to base after the sale.' },
    { q: 'What should I know about taxes and inspections when buying in Texas?', a: 'Texas has no state income tax, but sales/use tax can apply to an aircraft purchase, so confirm the current rules with a tax professional before closing. As anywhere, get an independent pre-buy inspection, review the logbooks and AD compliance, and budget for a hangar — hot Texas summers are hard on paint and avionics, so covered storage protects your investment.' },
  ],
  fl: [
    { q: 'Is Florida a good place to buy an aircraft?', a: 'Florida has one of the densest concentrations of general-aviation activity and flight training in the country, which means a deep, fast-moving used market and plenty of mechanics and shops to support a pre-buy. Year-round VFR weather keeps airplanes flying, so you will find a wide range of well-used aircraft as well as project planes.' },
    { q: 'Where should I look for aircraft for sale in Florida?', a: 'Inventory concentrates in the big GA areas: South Florida (Fort Lauderdale Executive, Pompano Beach, Boca Raton, Opa-locka), the Orlando area (Orlando Executive, Kissimmee, Sanford), Tampa Bay (St. Petersburg–Clearwater, Tampa Executive), and Jacksonville. Shopping near your intended base lets a local mechanic handle the inspection and saves a long ferry flight.' },
    { q: 'What should Florida buyers watch out for?', a: 'The coastal salt-air environment is hard on airframes and avionics, so look closely for corrosion during the pre-buy — especially on airplanes that have lived outside on a tie-down. Confirm logbooks, annual status, and AD compliance as you would anywhere, and budget for a hangar to protect the airplane from summer storms, heat, and salt after you buy.' },
  ],
  az: [
    { q: 'Why buy an aircraft in Arizona?', a: 'Arizona’s dry climate and reliable VFR weather are kind to airframes — airplanes based here tend to see less corrosion than coastal aircraft — and the heavy flight-training and recreational activity means a steady supply of well-flown singles. Dry-stored, sun-faded paint is common, but the underlying metal is often in good shape.' },
    { q: 'Where should I look for aircraft for sale in Arizona?', a: 'Most inventory is around Phoenix (Deer Valley — one of the busiest GA airports in the country — Scottsdale, Falcon Field/Mesa, Chandler, Glendale) and Tucson (Ryan Field, Tucson International GA). Hangars are more available than on the coasts, so you have flexibility on where to base after the sale.' },
    { q: 'What should Arizona buyers keep in mind about performance?', a: 'Summer heat and field elevation push density altitude high, which hurts takeoff and climb performance — so think about whether a given airplane has enough horsepower for how and where you plan to fly. During the pre-buy, check that paint and interior plastics have not been baked brittle by years of intense sun, and confirm logbooks and AD compliance as usual.' },
  ],
  co: [
    { q: 'What should I know about buying an aircraft in Colorado?', a: 'Colorado has a strong general-aviation community and a good used market, with many airplanes already equipped and flown for the kind of mountain and long-distance flying the state demands. That means you can often find a capable, well-equipped aircraft — just match the airplane’s performance to the high-altitude flying you intend to do.' },
    { q: 'Where should I look for aircraft for sale in Colorado?', a: 'Inventory clusters along the Front Range: the Denver area (Centennial — among the busiest GA airports in the nation — Rocky Mountain Metro, Front Range), Boulder, Colorado Springs, and Fort Collins–Loveland. Buying near your base lets a local mechanic familiar with high-altitude operations handle the pre-buy inspection.' },
    { q: 'How does mountain flying affect what I should buy in Colorado?', a: 'High terrain and high density altitude make performance genuinely matter, so many Colorado buyers favor airplanes with adequate horsepower and the equipment for IFR and mountain flying. Beyond the standard logbook and pre-buy review, consider whether the aircraft suits the missions — and the airports — you actually plan to fly from.' },
  ],
  wa: [
    { q: 'Is Washington a good place to buy an aircraft?', a: 'Washington has a deep aviation culture and an active general-aviation market, with a good supply of well-equipped airplanes suited to the varied Pacific Northwest flying — the islands, the coast, and the high country east of the Cascades. IFR-capable singles are common because the region’s weather rewards them.' },
    { q: 'Where should I look for aircraft for sale in Washington?', a: 'Most inventory is around Puget Sound: the Seattle area (Boeing Field, Renton, Paine Field/Everett, Auburn), Tacoma (Thun Field/Pierce County), and Olympia, plus Spokane and the Bellingham area near the islands. Shopping near your intended base keeps the pre-buy and any post-sale squawks local.' },
    { q: 'What should Pacific Northwest buyers check before buying?', a: 'Persistent moisture makes corrosion and water intrusion worth a close look during the pre-buy, particularly on airplanes kept outside rather than hangared. Marine-layer weather and shorter winter days make IFR capability and a solid avionics panel valuable, so confirm the equipment matches how you plan to fly — and review logbooks and AD status as always.' },
  ],
  ny: [
    { q: 'Is New York a good place to buy an aircraft?', a: 'Yes — New York has a more active general-aviation market than its big-city image suggests, spanning the New York City metro and a broad upstate corridor, so selection is reasonably deep. Inventory leans toward capable, IFR-equipped singles because the Northeast’s weather and busy airspace reward them. The main thing to plan for is what it costs to keep the airplane after the sale.' },
    { q: 'Where should I look for aircraft for sale in New York?', a: 'Inventory concentrates around the metro — Long Island (Republic/Farmingdale, Brookhaven), Westchester, and the Hudson Valley — and across a busy upstate band through Albany, the Finger Lakes, Rochester, and Buffalo. Hangar and tie-down costs drop sharply as you move upstate, so it is worth weighing where you intend to base, not just where the airplane is listed.' },
    { q: 'What should New York buyers keep in mind about costs and taxes?', a: 'Hangar and tie-down space near the metro is scarce and expensive, and cold winters make covered storage and diligent maintenance worthwhile statewide, so budget for basing before you commit. A New York purchase can also trigger state and local sales or use tax — confirm the current rules with a tax professional before you close — and get an independent pre-buy and logbook review as you would anywhere.' },
  ],
  il: [
    { q: 'Why buy an aircraft in Illinois?', a: 'Illinois sits at the crossroads of the Midwest and has a deep used market, anchored by the Chicago metro and fed by steady cross-country and training traffic downstate. Flat terrain and good airport coverage make a personal airplane genuinely useful for getting around the region, so demand and supply are both healthy and you can usually compare several candidates.' },
    { q: 'Where should I look for aircraft for sale in Illinois?', a: 'Most inventory is around Chicago’s reliever fields — Chicago Executive (Wheeling), DuPage, Aurora, Waukegan, and Lewis University — with more turning over downstate near Springfield, Champaign-Urbana, Bloomington, and the Quad Cities. Buying near your intended base lets a local mechanic handle the pre-buy and saves a ferry flight.' },
    { q: 'What should Illinois buyers watch out for?', a: 'Midwest weather is the big planning item: cold, snowy winters and summer thunderstorms make a hangar close to a necessity, so factor covered storage into your budget. An Illinois purchase can be subject to sales or use tax — check the current rules with a tax professional before closing — and get an independent pre-buy plus the usual logbook and AD review.' },
  ],
  ga: [
    { q: 'Is Georgia a good place to buy an aircraft?', a: 'Georgia has one of the South’s strongest general-aviation markets, centered on metro Atlanta, with a long, warm flying season that keeps airplanes active and the used market deep and quick to turn over. You will find everything from economical trainers to capable cross-country singles, supported by plenty of shops and mechanics for a pre-buy.' },
    { q: 'Where should I look for aircraft for sale in Georgia?', a: 'Inventory clusters around Atlanta — Peachtree-DeKalb (PDK), one of the busiest GA airports in the country, plus Fulton County (Brown Field), Cobb County (McCollum), and Gwinnett — with more around Savannah, Augusta, Macon, and the coast. Shopping near your intended base keeps the inspection and any post-sale squawks local.' },
    { q: 'What should Georgia buyers keep in mind?', a: 'The warm, humid climate makes a hangar worthwhile to protect paint and avionics, and summer thunderstorms are part of the planning, though year-round VFR flying is a real perk. A Georgia purchase can trigger sales or use tax, so confirm the current rules with a tax professional before you buy, and get an independent pre-buy with the usual logbook and AD review.' },
  ],
  nc: [
    { q: 'Why buy an aircraft in North Carolina?', a: 'North Carolina — the birthplace of flight — has a healthy, growing general-aviation market with a mild Piedmont climate and a long flying season that keep airplanes active. Inventory is well distributed across the state, so buyers find a steady supply of well-flown singles across a range of missions and budgets, from coast to mountains.' },
    { q: 'Where should I look for aircraft for sale in North Carolina?', a: 'The main clusters are the Charlotte area (Concord, Monroe, Gastonia) and the Research Triangle (Raleigh Exec, Johnston County, Burlington), with more around Greensboro, Asheville in the mountains, and Wilmington on the coast. Buying near your base lets a local mechanic handle the pre-buy and keeps any follow-up close.' },
    { q: 'What should North Carolina buyers consider?', a: 'The state spans coast, Piedmont, and Blue Ridge, so match the airplane’s performance to the flying you actually plan to do — especially if mountain trips are on the agenda. The gentle climate keeps basing costs reasonable, though a hangar still guards against humidity and storms. A purchase may be subject to state sales or use tax, so confirm the current rules before closing, and get an independent pre-buy as always.' },
  ],
}

/**
 * Resolve a for-sale state code (USPS) to its 3 curated buying FAQs, or null when the
 * state isn't curated (→ no FAQ). Mirrors `getPartnershipStateFaqs`.
 */
export function getForSaleStateFaqs(code: string): { q: string; a: string }[] | null {
  return FORSALE_STATE_FAQS[code.toLowerCase()] ?? null
}

/**
 * Per-STATE "Buying an aircraft in {State}" overview prose — 2 genuine, evergreen
 * narrative paragraphs per curated state, rendered as editorial body copy near the
 * top of the for-sale state page (`/aircraft/for-sale/[state]`). This is unique
 * content depth (the character/size of the state's used-aircraft market + its basing
 * and climate realities) to lift these pages above templated, count-only boilerplate
 * in the INDEXING stage — deliberately distinct in wording from the Q&A
 * `FORSALE_STATE_FAQS` on the same page (narrative market overview, not questions).
 * Keyed by lowercase USPS code; same curated high-GA set as the FAQs. Drawn from
 * well-known general-aviation facts — NO fabricated statistics and NO live listing
 * counts, so the copy never goes stale. Non-curated states render no overview.
 */
const FORSALE_STATE_OVERVIEWS: Record<string, string[]> = {
  ca: [
    'California is one of the largest and most active general-aviation markets in the country. Decades of flight training, a long flying season, and a dense population of pilots keep the used market deep and fast-moving — from former trainers and economical four-seaters to high-performance singles and twins. Whatever mission you have in mind, you can usually compare several airplanes here rather than chasing the only candidate within ferry range.',
    'Keeping an airplane in California is the part that takes planning. Covered storage near the big coastal airports is in short supply and commands premium rates, and insurance and labor track the state’s high cost of living. That math is a big reason shared ownership has such a following here — spreading the hangar, insurance, and annual across a partnership turns a capable airplane into a realistic monthly figure. You can browse California partnerships right alongside these for-sale listings.',
  ],
  tx: [
    'Texas backs up its size with one of the busiest general-aviation scenes in the country. The long distances between cities make a personal airplane genuinely useful, and a long VFR season keeps the fleet flying and well exercised. The result is a deep, steady supply of traveling singles and light twins for sale — from simple trainers to fast cross-country machines — usually at friendlier basing costs than the coasts.',
    'Ownership economics are part of the appeal. Hangars are generally more available and more affordable than in California, and Texas levies no state income tax (though sales or use tax can still apply to a purchase). Summer heat and the occasional hailstorm are the main hazards, so most owners budget for covered storage to protect paint and avionics. For pilots who would rather split the cost, Texas has an active partnership market you can explore next to these listings.',
  ],
  fl: [
    'Florida packs in some of the densest flight-training and general-aviation activity in the United States, which keeps the used market deep and quick to turn over. Year-round VFR weather means airplanes here fly a lot, so you will find everything from well-used trainers and four-seaters to project planes — and no shortage of shops and mechanics to handle a pre-buy inspection.',
    'The Florida environment is the thing to plan around. Salt air along the coasts is hard on airframes and avionics, so hangared airplanes hold up far better than those left on a tie-down, and summer storms and heat make covered storage worthwhile. Insurance and hangar space near the busy metros can add up, which is one reason many Florida pilots co-own — you can compare partnerships beside these for-sale listings.',
  ],
  az: [
    'Arizona’s dry desert climate is famously kind to airplanes, so the state has a reputation for airframes that wear well — sun-faded paint is common, but the metal underneath is often far cleaner than on coastal aircraft. Heavy recreational and training activity around the Phoenix and Tucson areas keeps a steady supply of well-flown singles on the market.',
    'The desert does shape what makes sense to own. High summer temperatures and field elevation push density altitude up, so performance and adequate horsepower matter more here than in cooler, lower country. Hangars are easier to come by than on the coasts, which keeps fixed costs reasonable — and for pilots who want to share those costs, Arizona has a healthy partnership scene alongside these for-sale listings.',
  ],
  co: [
    'Colorado has a strong, mountain-savvy general-aviation community, and that shows up in the kind of airplanes that come up for sale: many are already well-equipped for the high-altitude, long-distance flying the state demands. The used market along the Front Range is active, so a buyer can often find a capable, IFR-ready single rather than starting from a bare-bones airframe.',
    'High terrain and high density altitude make performance genuinely matter in Colorado, so matching an airplane’s horsepower and equipment to your missions is the central decision here. Hangar space and the cost of keeping a capable airplane lead a lot of Colorado pilots toward partnerships — sharing a well-equipped mountain airplane spreads the cost, and you can browse those partnerships next to these for-sale listings.',
  ],
  wa: [
    'Washington has a deep aviation culture and a varied flying environment — the islands and coast on one side, the high country east of the Cascades on the other — which is reflected in a used market well stocked with capable, IFR-equipped singles. The Pacific Northwest weather rewards instrument capability, so airplanes here often come better equipped than their counterparts in sunnier states.',
    'Persistent moisture is the main thing Northwest owners plan around: corrosion and water intrusion are worth a close look, and hangared airplanes fare much better than those left outside. Marine-layer weather also makes a solid avionics panel valuable. Between the equipment and the basing costs, co-ownership is common here — you can compare Washington partnerships alongside these for-sale listings.',
  ],
  ny: [
    'New York has a busier general-aviation scene than its big-city reputation suggests. The used market spans the crowded New York City metro — Long Island and the Hudson Valley — and a wide, active upstate corridor running through Albany, the Finger Lakes, Rochester, and Buffalo, so a buyer can usually compare several airplanes rather than settling for the only one nearby. Inventory leans toward capable, IFR-equipped singles, because the Northeast’s weather and airspace reward an airplane that can handle instrument conditions.',
    'Where you base shapes the ownership math more than the purchase price does. Hangar and tie-down space near the metro is scarce and expensive, while upstate fields are far easier on the budget, and cold winters make covered storage and attentive maintenance worthwhile statewide. A New York purchase can also trigger state and local sales or use tax, so it is worth checking the current rules with a tax professional before you close. Those fixed costs are a big reason many New York pilots co-own — you can browse partnerships right alongside these for-sale listings.',
  ],
  il: [
    'Illinois sits at the crossroads of the Midwest, and its used-aircraft market reflects that reach. The Chicago metro anchors a deep supply of airplanes around busy reliever fields like Chicago Executive, DuPage, Aurora, and Waukegan, while a steady stream of cross-country and training aircraft turns over downstate near Springfield, Champaign, and the Quad Cities. The flat terrain and good airport coverage make a personal airplane genuinely useful for getting around the region, which keeps demand and supply both healthy.',
    'Midwest weather is the main thing Illinois owners plan around. Cold, snowy winters and summer thunderstorms make a hangar more a necessity than a luxury, so budget for covered storage when you compare airplanes. An Illinois purchase can be subject to sales or use tax — confirm the current rules with a tax professional before closing — and, as anywhere, get an independent pre-buy and review the logbooks and AD status. Splitting those hangar and fixed costs is why co-ownership is popular here; you can compare Illinois partnerships next to these for-sale listings.',
  ],
  ga: [
    'Georgia has become one of the South’s strongest general-aviation markets, centered on metro Atlanta — Peachtree-DeKalb (PDK) is one of the busiest GA airports in the country, with Fulton County, Cobb County, and Gwinnett rounding out a dense field of inventory. Savannah, Augusta, Macon, and the coast add to the supply, and a long, warm flying season keeps airplanes flying and well exercised, so the used market is deep and quick to turn over.',
    'The warm climate is mostly a gift to owners, with year-round VFR flying and easier winters than the North, though summer heat and humidity make a hangar worthwhile to protect paint and avionics, and afternoon thunderstorms are part of the planning. A Georgia purchase can trigger sales or use tax, so check the current rules with a tax professional before you buy, and get the usual independent pre-buy and logbook review. For pilots who would rather share the cost of a capable airplane, Georgia has an active partnership scene alongside these for-sale listings.',
  ],
  nc: [
    'North Carolina — the birthplace of flight — backs up its heritage with a healthy, growing general-aviation market. Inventory clusters around the Charlotte area (Concord, Monroe, and Gastonia) and the Research Triangle (Raleigh Exec, Johnston County, and Burlington), with more around Greensboro, Asheville in the mountains, and Wilmington on the coast. The mild Piedmont climate and long flying season keep airplanes active, so buyers find a steady supply of well-flown singles across a range of missions and budgets.',
    'North Carolina’s geography gives owners a bit of everything — coast, Piedmont, and Blue Ridge — so matching the airplane to the flying you actually plan to do matters, especially if mountain trips out west are on the agenda. The climate is gentle enough that basing costs stay reasonable, though a hangar still protects against humidity and the occasional storm. A purchase may be subject to state sales or use tax, so confirm the current rules before closing, and get an independent pre-buy as always. Many North Carolina pilots split those costs through co-ownership — you can browse partnerships beside these for-sale listings.',
  ],
}

/**
 * Resolve a for-sale state code (USPS) to its 2-paragraph overview prose, or null
 * when the state isn't curated (→ no overview section). Mirrors `getForSaleStateFaqs`.
 */
export function getForSaleStateOverview(code: string): string[] | null {
  return FORSALE_STATE_OVERVIEWS[code.toLowerCase()] ?? null
}

/**
 * Make+model+STATE intersection FAQs for `/aircraft/[makeSlug]/[modelSlug]/[state]`,
 * keyed by `makeSlug/modelSlug/stateCode` (lowercase USPS). This is the most specific
 * for-sale family — the #1 autocomplete pattern is "{make} {model} for sale {state}"
 * (e.g. `cessna 172 for sale california`) — so the few highest-intent, highest-inventory
 * intersections get genuinely unique content here.
 *
 * Each answer combines THIS model's traits (mission, fuel burn, what to inspect) with
 * THIS state's GA scene (where inventory clusters, basing costs, climate) — intentionally
 * distinct from the model-only `MODEL_FAQS` and the generic-buying `FORSALE_STATE_FAQS`,
 * so it isn't a near-duplicate of a parent page (GOAL.md: no thin/near-duplicate pages).
 * Curated marquee combos only — every other combo renders no FAQ (no templated boilerplate
 * across the long tail). Evergreen, well-known, durable facts only: no fabricated stats,
 * no live counts → never stale. The combo page 404s below the inventory threshold, so an
 * out-of-stock curated combo simply shows no FAQ (harmless).
 */
const MAKE_MODEL_STATE_FAQS: Record<string, { q: string; a: string }[]> = {
  'cessna/172/ca': [
    { q: 'Why is the Cessna 172 a popular choice in California?', a: 'California’s dense network of flight schools and clubs means a deep supply of Cessna 172s — from high-time former trainers to carefully kept private airplanes. The 172’s docile handling, four seats, and low operating cost make it a natural first airplane, and the state’s mild, VFR-friendly weather keeps these airplanes flying year-round. Because so many change hands here, you usually have several to compare rather than settling for the only one within ferry range.' },
    { q: 'What does it cost to own a Cessna 172 in California?', a: 'The airplane itself is one of the most economical four-seaters to run — roughly 8–9 gallons an hour and a well-understood maintenance picture — but California’s basing costs are the variable that bites. Hangar and tie-down space near the Bay Area and Los Angeles is scarce and among the most expensive in the country, so price that in before you buy. Splitting those fixed costs is exactly why many California 172 owners co-own; you can browse partnerships alongside the for-sale listings here.' },
    { q: 'What should I check when buying a Cessna 172 in California?', a: 'Many California 172s have spent time on a flight line, so scrutinize engine time since overhaul, the logbook history, and how hard the airframe has been worked. For airplanes based near the coast, look closely for corrosion during the pre-buy; inland and high-desert airplanes are usually drier. As always, confirm annual status and AD compliance, and use an independent A&P for the inspection rather than the seller’s shop.' },
  ],
  'cessna/172/tx': [
    { q: 'Why look for a Cessna 172 in Texas?', a: 'Texas has a large, active general-aviation community and plenty of flight training, so 172s come up for sale regularly across the state. The 172’s four seats and modest fuel burn suit the long VFR cross-countries that Texas distances invite, and basing costs are generally friendlier than on the coasts — making it easier to keep a simple, trainer-class airplane affordable.' },
    { q: 'What does it cost to own a Cessna 172 in Texas?', a: 'Operating a 172 is inexpensive by four-seat standards — about 8–9 gallons an hour — and Texas helps on the fixed-cost side: hangars are more available and more affordable than in California, and the state has no income tax (though sales/use tax can apply to the purchase — check current rules with a tax professional). Budget for covered storage anyway: Texas heat and hail are hard on paint, glass, and avionics.' },
    { q: 'What should I check before buying a Cessna 172 in Texas?', a: 'Look at engine time since overhaul and the logbooks first — many 172s have trainer histories with a lot of cycles. Texas sun and summer heat bake interiors and can craze old skylights and windows, so check the plastics and paint. Confirm annual and AD status, and have an independent A&P do the pre-buy rather than relying on the seller’s shop.' },
  ],
  'cirrus/sr22/ca': [
    { q: 'Is the Cirrus SR22 a good fit for flying in California?', a: 'The SR22’s speed, range, and full glass panel make quick work of California’s long hauls — Bay Area to LA, or out to the desert and the Sierra — and its airframe parachute appeals to owners flying over terrain and water. The state has an active high-performance owner community and avionics shops that know the airplane, so support is easy to find, and inventory turns over regularly in the major metros.' },
    { q: 'What does it cost to own a Cirrus SR22 in California?', a: 'An SR22 is a serious step up from a trainer: higher fuel burn, higher insurance (especially for lower-time pilots), and the recurring cost of the airframe-parachute repack down the road. Add California’s premium hangar rates — you’ll want covered storage for the avionics and paint — and the all-in number climbs. Many California SR22 owners share the airplane in a partnership to make those fixed costs manageable; partnership listings sit alongside the for-sale ones here.' },
    { q: 'What should I check when buying an SR22 in California?', a: 'Confirm the CAPS parachute repack status and the avionics/database currency, since both drive near-term cost. Review the maintenance history with a shop familiar with Cirrus airframes, and for coastal-based airplanes inspect for corrosion. As with any purchase, verify annual and AD compliance, and budget for transition training and insurance, which carriers weigh heavily on this type.' },
  ],
  'cirrus/sr22/tx': [
    { q: 'Why is the Cirrus SR22 popular in Texas?', a: 'Texas distances reward a fast, comfortable single, and the SR22’s range and glass panel make it a genuine traveling airplane between the state’s far-flung metros. There’s a strong Cirrus owner community here and shops that specialize in the type, so finding support and a knowledgeable pre-buy is straightforward. Airplanes change hands regularly around Dallas–Fort Worth, Houston, Austin, and San Antonio.' },
    { q: 'What does an SR22 cost to own in Texas?', a: 'Plan for high-performance economics: more fuel per hour than a trainer, higher insurance, and the eventual CAPS parachute repack. Texas eases the fixed costs — hangars are more available and there’s no state income tax (sales/use tax may still apply to the purchase; confirm with a tax professional) — but you’ll still want a hangar to protect the glass panel and paint from heat and hail.' },
    { q: 'What should I check before buying an SR22 in Texas?', a: 'Check the parachute repack timeline and avionics database/subscription status first, then review the maintenance history with a Cirrus-experienced shop. Texas heat is hard on avionics cooling and interior plastics, so look there during the pre-buy. Confirm annual and AD compliance, and factor in transition training and an insurance quote, since underwriters scrutinize time-in-type on this airplane.' },
  ],
  'cirrus/sr22/fl': [
    { q: 'Is Florida a good place to buy a Cirrus SR22?', a: 'Florida’s dense general-aviation and training activity means SR22s come up for sale often, and the year-round VFR weather keeps them flying. The airplane’s speed suits the long runs up and down the peninsula and across to the islands, and there’s no shortage of shops familiar with the type for a pre-buy. South Florida, Orlando, and Tampa Bay carry most of the inventory.' },
    { q: 'What does it cost to own an SR22 in Florida?', a: 'Expect high-performance running costs — fuel, higher insurance, and the periodic CAPS parachute repack — plus the Florida basing reality: a hangar is strongly advised to shield the avionics and paint from salt air, sun, and summer storms, and hangar space near the coast can be tight. Sharing the airplane in a partnership is a common way Florida owners keep those fixed costs in check.' },
    { q: 'What should I check when buying an SR22 in Florida?', a: 'Salt air is the headline risk: inspect carefully for corrosion, especially on airplanes kept outside, and confirm the avionics have been protected. Verify the parachute repack status and database currency, and review the maintenance log with a Cirrus-savvy shop. Confirm annual and AD compliance, and line up transition training and an insurance quote before you commit.' },
  ],
  'cessna/182/tx': [
    { q: 'Why choose a Cessna 182 in Texas?', a: 'The 182 Skylane adds useful load, speed, and a constant-speed prop over a 172 — handy for Texas distances and density-altitude summer days when you’re carrying four people and bags. It’s a popular step-up airplane with a deep parts and maintenance network, and Texas’s active GA scene means Skylanes turn up for sale around the major metros fairly regularly.' },
    { q: 'What does a Cessna 182 cost to own in Texas?', a: 'A 182 burns more fuel than a 172 (typically in the low-to-mid teens of gallons per hour) and the larger engine costs more at overhaul, but it’s still a straightforward, well-supported airplane. Texas helps on fixed costs — more affordable hangars and no state income tax (sales/use tax may apply to the purchase; check with a tax professional) — and a hangar is worth it to keep heat and hail off the paint and avionics.' },
    { q: 'What should I check before buying a Cessna 182 in Texas?', a: 'Pay attention to engine time since overhaul and any history of corrosion, and on older Skylanes review the firewall area and the long-known maintenance items for the type. Texas sun is hard on paint and window plastics, so check those during the pre-buy. Confirm annual and AD compliance and use an independent A&P rather than the seller’s shop.' },
  ],
}

/**
 * Resolve a make+model+state intersection to its 3 curated FAQs, or null when the combo
 * isn't curated (→ no FAQ). `code` is the USPS state code. Mirrors `getForSaleStateFaqs`.
 */
export function getMakeModelStateFaqs(
  makeSlug: string,
  modelSlug: string,
  code: string,
): { q: string; a: string }[] | null {
  return MAKE_MODEL_STATE_FAQS[`${makeSlug}/${modelSlug}/${code.toLowerCase()}`] ?? null
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
  /**
   * 2 genuine, evergreen narrative paragraphs (model history + lineup positioning
   * + why it's commonly co-owned), rendered as editorial body copy on the
   * make+model page. Unique content depth for the INDEXING stage — deliberately
   * distinct from `specs`/`costToOwn` and the Q&A `faqs`. Curated combos only;
   * dynamically-discovered combos have none. See MODEL_OVERVIEWS.
   */
  overview?: string[]
  /**
   * Scannable key/value spec rows of real, public-domain, representative figures
   * (seats, engine, hp, cruise, range, useful load, fuel, gear). Rendered as a
   * "key specifications" table for unique, factual on-page depth. Curated combos
   * with confident, well-documented data only; dynamically-discovered combos have
   * none (we never fabricate specs). Figures are representative of a popular
   * variant — the page footnotes that exact specs vary by year/config. See
   * MODEL_SPECS.
   */
  specTable?: { label: string; value: string }[]
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

// ---------------------------------------------------------------------------
// Per-model "About the {Make} {Model}" overview prose — 2 genuine, evergreen
// narrative paragraphs per curated make+model, rendered as editorial body copy on
// the make+model page (`/aircraft/[make]/[model]`). Unique content depth (model
// history + lineup positioning + the co-ownership angle) to lift these pages above
// templated, count-only boilerplate in the INDEXING stage — deliberately distinct
// from the one-line `specs`/`costToOwn` blurbs and the Q&A `MODEL_FAQS`. Keyed by
// `${makeSlug}/${modelSlug}`. Drawn from the curated copy above + well-known
// general-aviation history — NO fabricated statistics and NO live listing counts,
// so the copy never goes stale. Curated combos only; dynamically-discovered combos
// render no About section (graceful, like the make pages absent from MAKE_OVERVIEWS).
// ---------------------------------------------------------------------------
const MODEL_OVERVIEWS: Record<string, string[]> = {
  'cirrus/sr22': [
    'The Cirrus SR22 is the airplane that redefined the modern piston single. A four-seat composite cruiser of roughly 310 hp, it pairs a full glass panel with the CAPS whole-airframe parachute — a safety system no rival offered when it arrived — and for years has ranked among the best-selling piston airplanes in the world. Side-yoke controls, big screens, and a genuinely fast cross-country cruise made it the airplane the rest of the industry chased.',
    'All that capability is expensive to own alone, which is precisely why the SR22 is one of the most commonly co-owned high-performance singles. Splitting the hangar, the higher insurance, and the periodic CAPS parachute repack across three or four partners turns a flagship traveler into a realistic monthly number — and keeps it flown often enough that everyone stays current.',
  ],
  'cirrus/sr22t': [
    'The SR22T is the turbo-normalized member of the Cirrus line — the same composite airframe and CAPS parachute as the SR22, with a turbocharger and oxygen that let it cruise comfortably into the flight levels and the 200-kt range. For pilots who routinely cross high terrain, fly long legs, or want the option to top weather, the turbo transforms what the airframe can do.',
    'That altitude and speed come with a higher fuel burn and a larger turbo overhaul reserve, so the SR22T rewards owners who actually use its capability. Most are flown by flying clubs and partnerships that split the reserves and insurance three or four ways — the standard way to keep an advanced turbo single both affordable and current.',
  ],
  'mooney/m20': [
    'The Mooney M20 series built its reputation on one idea: speed per dollar. The low, tightly cowled airframe with its signature forward-swept tail slips through the air with far less drag than its peers, posting cruise numbers that embarrass airplanes burning much more fuel. Across decades of refinement — from the early wood-wing models to the long-body Ovation and Acclaim — the M20 has stayed the efficiency benchmark of piston aviation.',
    'A Mooney is a traveler rather than a trainer: the cabin is snug, the gear retracts, and there are more systems to manage, so many owners arrive after time in fixed-gear singles. The low fuel burn keeps variable costs down, while the retractable gear adds an annual inspection and an insurance line — exactly the kind of fixed cost a partnership spreads comfortably across owners.',
  ],
  'beechcraft/bonanza': [
    'The Beechcraft Bonanza is one of the longest continuously produced airplanes in history, first as the iconic V-tail and later in the conventional straight-tail form. It has always sat at the premium end of the piston single market — fast, refined, and roomy, built to a heavier standard that owners describe as feeling a class above typical trainers. Generations of pilots have regarded it as the benchmark high-performance single.',
    'That refinement brings traveling-machine running costs: a healthy fuel burn and a serious engine reserve. Co-ownership is the traditional answer, and a Bonanza partnership spreads the hangar, insurance, and reserves so a group can enjoy a genuine cross-country machine without carrying it alone. A pre-purchase inspection by a Bonanza-savvy mechanic is considered essential whichever tail you choose.',
  ],
  'cessna/182': [
    'The Cessna 182 Skylane is the do-everything member of the high-wing Cessna family — more power, more useful load, and more speed than the 172 it resembles, while keeping the same forgiving high-wing manners and fixed gear. With a constant-speed prop and a strong climb, it comfortably carries four people and real baggage out of shorter or higher fields, which has made it a perennial favorite for families and traveling pilots.',
    'Operating costs sit between a 172 and a complex retractable single, so the 182 is meaningfully more airplane without stepping into twin-class budgets. A partnership keeps the hangar, insurance, and annual manageable while partners split genuine flying hours — and because the type is so widely supported, maintenance stays predictable and resale demand stays deep.',
  ],
  'cirrus/sr20': [
    'The Cirrus SR20 is the entry point to Cirrus ownership — the same composite airframe, CAPS parachute, and modern glass cockpit as the SR22, with a roughly 215-hp engine in place of the bigger six. It was the airplane that launched the Cirrus revolution, and it remains a popular trainer and step-up for pilots who want the full Cirrus experience at a lower running cost.',
    'Lower fuel burn and a smaller overhaul reserve than the SR22 are the whole point of the SR20, and they make shared ownership especially attractive: a partnership splits the fixed costs so the glass-panel, parachute-equipped ownership experience becomes genuinely affordable. For groups doing training and regional trips rather than high-altitude long hauls, the SR20 is often all the airplane they need.',
  ],
  'cessna/172': [
    'The Cessna 172 Skyhawk is the most-produced airplane ever built and the default first airplane for good reason: a four-seat high wing with docile, forgiving handling, excellent visibility, and a maintenance and parts network unmatched by anything else in aviation. More pilots have learned to fly in a 172 than in any other type, and that familiarity follows the airplane into ownership.',
    'It is also the most commonly co-owned single in America. Because parts are everywhere and every A&P knows the airplane, a 172 partnership is about as low-drama as ownership gets — splitting the hangar, insurance, and annual across a few partners makes it genuinely cheap per person while keeping a reliable, always-available airplane on the field.',
  ],
  'piper/cherokee': [
    'The Piper Cherokee is the low-wing counterpart to the Cessna 172 — the airplane that anchors Piper’s huge PA-28 family, which also includes the Warrior, Archer, and retractable Arrow. Stable, simple, and forgiving, the Cherokee has been a fixture of flight schools and first-time owners for generations, with one of the largest parts and maintenance networks in general aviation behind it.',
    'Fixed gear, uncomplicated systems, and deep parts availability make the Cherokee one of the most economical four-seat singles to own and share. It is a frequent choice for a first partnership precisely because maintenance is so predictable — a group can split the hangar and annual on an airplane that rarely surprises anyone with a big bill.',
  ],
  'beechcraft/baron': [
    'The Beechcraft Baron is the twin-engine sibling of the Bonanza — a cabin-class, six-seat traveler cruising north of 190 kt, and the natural step into piston twins for pilots who want a second engine for redundancy and range. Built to the same premium Beechcraft standard, it has been the aspirational light twin for decades, prized for its handling and its genuinely capable cross-country performance.',
    'A twin doubles the engines and the maintenance — two overhaul reserves plus higher insurance — which is exactly why Barons are so often co-owned. A group of partners is what makes those costs realistic, spreading the two reserves and the twin-rated insurance so a serious all-weather traveler becomes attainable for pilots who could never justify it alone.',
  ],
  'piper/arrow': [
    'The Piper Arrow is the retractable-gear member of the PA-28 family — a Cherokee airframe with a constant-speed prop and folding gear, making it one of the most common complex trainers in the world. Countless pilots have earned their complex and commercial time in an Arrow, and its predictable systems and strong parts supply have kept it a staple of flight schools and step-up owners alike.',
    'It is the logical next airplane for a pilot who learned in a fixed-gear single and wants to build complex experience without leaping to a high-performance traveler. The retractable gear adds a modest insurance and annual premium over a Cherokee, which a partnership keeps economical while members log the complex hours that move a license forward.',
  ],
  'piper/comanche': [
    'The Piper Comanche is the PA-24 — a fast, low-wing retractable single from the era before the Cherokee, with a 160+ kt cruise and big tanks that make it a genuine long-legged traveler. Pilots who fly Comanches tend to love them fiercely: they punch well above their fuel burn and cover distance with a refinement that belies their modest operating cost.',
    'Production ended decades ago, so some parts are sourced through active type clubs and specialists rather than off the shelf — which is why so many Comanches are flown in partnerships with a shared maintenance kitty. A knowledgeable mechanic and a pooled parts fund make the airframe very manageable, and the group gets a remarkable amount of airplane for the money.',
  ],
  'bellanca/citabria': [
    'The Bellanca Citabria is a two-seat tandem taildragger — fabric-covered, aerobatic-capable, and pure stick-and-rudder joy. Its name is famously "airbatic" spelled backward, a nod to the mild aerobatics it was built to perform. Light, simple, and endlessly charming, it has introduced generations of pilots to tailwheel flying and gentle aerobatics alike.',
    'It is cheap to fly and a blast to own — the main costs are fabric upkeep and a tailwheel-rated insurance policy. Partnerships are common among tailwheel and aerobatic pilots who share the fun and the upkeep, and the Citabria is itself a wonderful airplane in which to earn the tailwheel endorsement that flying it requires.',
  ],
  'vans/rv': [
    'Van’s Aircraft RV series sits at the heart of the experimental amateur-built movement. Sold as kits and built by their owners, the sporty two- and four-seat RVs deliver performance per dollar that certified airplanes simply cannot match, backed by one of the largest and most active builder communities in aviation. An RV grin at a fly-in is a genuine cultural fixture.',
    'Because they are experimental, owners can perform much of their own maintenance, which keeps costs low and knowledge high. Partnerships are common among builders and sport pilots — sharing a finished RV spreads the cost while the group enjoys an airplane that climbs, cruises, and rolls far beyond its modest fuel burn. Just confirm the operating limitations and insurance work for multiple owners.',
  ],
  'cessna/150': [
    'The Cessna 150 is the classic two-seat high-wing trainer — cheap to run, simple to maintain, and famously forgiving. Together with its near-identical successor the 152, it taught generations of pilots to fly, and its small engine and light airframe keep the running costs about as low as airplane ownership gets.',
    'For a budget-minded owner it is one of the most attainable ways into the air, and a partnership splits an already-modest hangar and annual even further. Two seats and a small engine mean small bills across the board — an ideal first airplane to own with a friend or two while you build hours.',
  ],
  'piper/cub': [
    'The Piper Cub is the yellow taildragger most people picture when they imagine light aviation — fabric, tandem seating, slow, simple, and endlessly charming. It is bought with the heart as much as the head, a piece of aviation history that is still genuinely delightful to fly low and slow on a calm evening.',
    'Despite its iconic status, a Cub is genuinely cheap to fly; fabric upkeep and a tailwheel insurance policy are the main costs. Shared ownership is a natural fit — it keeps a classic in the air and in regular use — and the Cub is one of the most rewarding airplanes in which to learn the stick-and-rudder skills its tailwheel endorsement requires.',
  ],
  'cessna/180': [
    'The Cessna 180 is the tailwheel high-wing hauler that built Cessna’s backcountry reputation — rugged, float-capable, and blessed with a strong useful load. Long before purpose-built bush planes were fashionable, the 180 (and its 185 sibling) was the airplane that flew people and gear into places paved runways never reached, and it remains a favorite for adventure and utility flying.',
    'It is a backcountry favorite that holds its value well — a durable airframe that, tailwheel insurance and big tundra tires aside, rewards an owner for years. Partnerships split the hangar and the adventures, and because the type demands real tailwheel proficiency, a group that flies it regularly stays sharp on an airplane worth staying sharp for.',
  ],
  'piper/saratoga': [
    'The Piper Saratoga is the six-seat flagship of the PA-32 family — a big-cabin, big-useful-load single built in both fixed- and retractable-gear forms. With a genuine third row and the load to fill it, the Saratoga is a true family and IFR traveling machine, the airplane Piper owners step up to when four seats are no longer enough.',
    'Fuel burn matches the big cabin, so a Saratoga is not the cheapest single to run — which is exactly why co-ownership across a few families is the classic way to keep one affordable. A partnership spreads the fixed costs of a genuine six-seater so each family flies a capable traveler for a sensible monthly share.',
  ],
  'grumman/aa-1': [
    'The Grumman AA-1 is a two-seat low-wing single with a sliding canopy and a sporty, responsive feel — the little sports car of the trainer ramp. Light and quick on the controls thanks to its bonded aluminum airframe, it stands apart from the typical two-seat trainer and has earned a devoted following among pilots who want something with a bit more character.',
    'Ownership is simple and economical: the bonded airframe and uncomplicated systems keep weight and maintenance costs low, which makes the AA-1 an easy airplane to share. Many owners enjoy it as a step beyond basic trainers — just get a checkout from someone who knows the type, since it flies a little more crisply than a 150.',
  ],
  'grumman/aa-5': [
    'The Grumman AA-5 family — the Traveler, Cheetah, and Tiger — brings the brand’s sliding-canopy character to a four-seat airframe. Low-drag and quick for the fuel burn, with a roughly 130-kt cruise, these airplanes developed a loyal following for being light, fast, and simply fun to fly, with the open-canopy taxi that defines a Grumman.',
    'Simplicity is the ownership story: clean, slippery airframes and uncomplicated systems keep both fuel and shared maintenance costs low, which makes an AA-5 an excellent first-partnership single. Within the line the Tiger is the faster, stronger climber and the Cheetah the more economical — both delivering the same sporty character that owners fall for.',
  ],
  'robinson/r44': [
    'The Robinson R44 is the world’s most popular civil helicopter — a four-seat piston machine cruising around 110 kt, widely used for training, personal travel, and utility work. Affordable to buy relative to turbine helicopters and supported by a vast global network, the R44 is the airplane-equivalent default for pilots entering rotary ownership.',
    'Helicopter ownership runs on a scheduled overhaul clock — the airframe and major components carry a 2,200-hour/12-year overhaul — which makes a partnership almost essential. Splitting that overhaul reserve and the insurance across owners, and budgeting per-hour for it from the start, is how most R44s are flown and what keeps rotary ownership realistic.',
  ],
}

// Per-model "key specifications" tables — real, public-domain, REPRESENTATIVE
// figures for a popular variant of each family (POH / type-certificate data
// points). Deliberately family-level and disclosed as representative on the page
// (variants differ by year/engine/avionics), so no fabricated precision. Keyed by
// `make/model`. Only well-documented, high-inventory families I'm confident about
// get a table; everything else (and every dynamic combo) renders no table rather
// than guess. Mirrors the MODEL_FAQS / MODEL_OVERVIEWS attach pattern below.
const MODEL_SPECS: Record<string, { label: string; value: string }[]> = {
  'cessna/172': [
    { label: 'Seats', value: '4' },
    { label: 'Engine', value: 'Lycoming IO-360 (172S)' },
    { label: 'Horsepower', value: '180 hp' },
    { label: 'Cruise speed', value: '~124 kt' },
    { label: 'Range', value: '~640 nm' },
    { label: 'Useful load', value: '~880 lb' },
    { label: 'Fuel (usable)', value: '53 gal' },
    { label: 'Landing gear', value: 'Fixed tricycle' },
  ],
  'cessna/182': [
    { label: 'Seats', value: '4' },
    { label: 'Engine', value: 'Lycoming IO-540 (182T)' },
    { label: 'Horsepower', value: '230 hp' },
    { label: 'Cruise speed', value: '~145 kt' },
    { label: 'Range', value: '~930 nm' },
    { label: 'Useful load', value: '~1,100 lb' },
    { label: 'Fuel (usable)', value: '87 gal' },
    { label: 'Landing gear', value: 'Fixed tricycle' },
  ],
  'cessna/150': [
    { label: 'Seats', value: '2' },
    { label: 'Engine', value: 'Continental O-200-A' },
    { label: 'Horsepower', value: '100 hp' },
    { label: 'Cruise speed', value: '~100 kt' },
    { label: 'Range', value: '~420 nm' },
    { label: 'Useful load', value: '~500 lb' },
    { label: 'Fuel (usable)', value: '~22.5 gal' },
    { label: 'Landing gear', value: 'Fixed tricycle' },
  ],
  'cirrus/sr22': [
    { label: 'Seats', value: '4–5' },
    { label: 'Engine', value: 'Continental IO-550-N' },
    { label: 'Horsepower', value: '310 hp' },
    { label: 'Cruise speed', value: '~183 kt' },
    { label: 'Range', value: '~1,000 nm' },
    { label: 'Useful load', value: '~1,300 lb' },
    { label: 'Fuel (usable)', value: '92 gal' },
    { label: 'Safety', value: 'CAPS whole-airframe parachute' },
  ],
  'cirrus/sr20': [
    { label: 'Seats', value: '4–5' },
    { label: 'Engine', value: 'Continental IO-390 (later)' },
    { label: 'Horsepower', value: '215 hp' },
    { label: 'Cruise speed', value: '~155 kt' },
    { label: 'Range', value: '~700 nm' },
    { label: 'Useful load', value: '~1,050 lb' },
    { label: 'Fuel (usable)', value: '56 gal' },
    { label: 'Safety', value: 'CAPS whole-airframe parachute' },
  ],
  'piper/cherokee': [
    { label: 'Seats', value: '4' },
    { label: 'Engine', value: 'Lycoming O-360 (PA-28-180)' },
    { label: 'Horsepower', value: '180 hp' },
    { label: 'Cruise speed', value: '~120 kt' },
    { label: 'Range', value: '~560 nm' },
    { label: 'Useful load', value: '~1,000 lb' },
    { label: 'Fuel (usable)', value: '48 gal' },
    { label: 'Landing gear', value: 'Fixed tricycle' },
  ],
  'piper/arrow': [
    { label: 'Seats', value: '4' },
    { label: 'Engine', value: 'Lycoming IO-360 (PA-28R-201)' },
    { label: 'Horsepower', value: '200 hp' },
    { label: 'Cruise speed', value: '~137 kt' },
    { label: 'Range', value: '~880 nm' },
    { label: 'Useful load', value: '~1,150 lb' },
    { label: 'Fuel (usable)', value: '72 gal' },
    { label: 'Landing gear', value: 'Retractable tricycle' },
  ],
  'beechcraft/bonanza': [
    { label: 'Seats', value: '4–6' },
    { label: 'Engine', value: 'Continental IO-550-B (A36)' },
    { label: 'Horsepower', value: '300 hp' },
    { label: 'Cruise speed', value: '~174 kt' },
    { label: 'Range', value: '~920 nm' },
    { label: 'Useful load', value: '~1,050 lb' },
    { label: 'Fuel (usable)', value: '74 gal' },
    { label: 'Landing gear', value: 'Retractable tricycle' },
  ],
}

export function getMakeModel(makeSlug: string, modelSlug: string): SeoMakeModel | null {
  const m = makeSlug.toLowerCase()
  const md = modelSlug.toLowerCase()
  const entry = SEO_MAKE_MODELS.find((e) => e.makeSlug === m && e.modelSlug === md)
  if (!entry) return null
  // Attach the curated FAQs + "About" overview prose + key-spec table (if any)
  // without mutating the source array. Mirrors how resolveMake attaches MAKE_FAQS
  // + MAKE_OVERVIEWS.
  const key = `${entry.makeSlug}/${entry.modelSlug}`
  const faqs = MODEL_FAQS[key]
  const overview = MODEL_OVERVIEWS[key]
  const specTable = MODEL_SPECS[key]
  return faqs || overview || specTable
    ? {
        ...entry,
        ...(faqs && { faqs }),
        ...(overview && { overview }),
        ...(specTable && { specTable }),
      }
    : entry
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
  /**
   * 3 genuine, evergreen MAKE-level Q&As shown on the make hub page + emitted as
   * FAQPage JSON-LD (visible text must match the structured data 1:1). Brand /
   * lineup-level (which model to pick, what the make is known for, cost to own) —
   * distinct from the per-model FAQs. Curated makes only; non-curated makes have
   * none. See MAKE_FAQS.
   */
  faqs?: { q: string; a: string }[]
  /**
   * 2 genuine, evergreen "About {Make}" narrative paragraphs shown on the make hub
   * page — brand history + lineup positioning, distinct from the Q&A `faqs`. Plain
   * editorial body copy (NOT structured data), so no fabricated statistics and no
   * live listing counts — the copy stays accurate and never goes stale. Curated
   * makes only; a make absent from MAKE_OVERVIEWS renders no About section.
   */
  overview?: string[]
}

// Per-MAKE FAQs — genuine, evergreen, brand/lineup-level Q&As attached to each
// curated make hub page (`/aircraft/[make]`), rendered visibly AND emitted as
// FAQPage JSON-LD (visible text must match the structured data 1:1). Keyed by
// makeSlug. Drawn from the SEO_MAKES blurbs + well-known general-aviation facts —
// NO fabricated statistics and NO live listing counts, so the copy stays accurate
// and never goes stale. Curated makes (SEO_MAKES) only; a make absent here renders
// no FAQ (graceful, like the dynamically-discovered model pages).
const MAKE_FAQS: Record<string, { q: string; a: string }[]> = {
  cessna: [
    { q: 'What is Cessna known for?', a: 'Cessna is the most prolific maker of general-aviation singles — high-wing trainers and haulers from the two-seat 150/152 up through the 172 Skyhawk, the 182 Skylane, and the 206. Parts are everywhere and nearly every A&P knows them, which is a big reason Cessnas are the most commonly co-owned aircraft in America.' },
    { q: 'Which Cessna is best for a first airplane or partnership?', a: 'The 172 Skyhawk is the default first airplane and the most commonly shared single — forgiving, inexpensive to run, and universally supported. Step up to the 182 Skylane if you regularly carry four people or fly out of higher or shorter fields.' },
    { q: 'How much does it cost to own a Cessna?', a: 'It varies by model, but Cessna singles are about as low-drama and predictable as ownership gets thanks to ubiquitous parts and mechanics. Splitting the hangar, insurance, and annual across a partnership keeps each owner’s share modest.' },
  ],
  piper: [
    { q: 'What is Piper known for?', a: 'Piper builds the low-wing PA-28 Cherokee family — Cherokees, Archers, and Arrows — alongside the iconic Cub taildragger and the six-seat Saratoga. They are valued for low operating costs, forgiving handling, and a huge parts supply.' },
    { q: 'Which Piper is best to co-own?', a: 'A fixed-gear Cherokee or Archer is one of the most economical singles to share — simple systems and predictable maintenance make it an ideal first partnership. Move up to an Arrow for retractable and complex time, or a Saratoga when you need six seats.' },
    { q: 'How much does it cost to own a Piper?', a: 'The fixed-gear PA-28s are among the lowest-cost four-seat singles to run; retractable Arrows and the larger Saratoga cost a bit more. A partnership spreads the fixed costs and keeps any of them affordable.' },
  ],
  cirrus: [
    { q: 'What is Cirrus known for?', a: 'Cirrus builds modern composite singles — the SR20 and SR22 — with full glass panels and the CAPS whole-airframe parachute. They have been among the best-selling piston singles in the world and set the template for the modern GA cockpit.' },
    { q: 'Should I choose an SR20 or an SR22?', a: 'The SR20 (about 215 hp) is the more attainable entry — cheaper to buy and run, and plenty for training and regional trips. The SR22 (about 310 hp) carries more, climbs better, and flies faster. Both share the same glass panel and parachute.' },
    { q: 'Why co-own a Cirrus?', a: 'Co-ownership is how most pilots make a Cirrus pencil out. Splitting the hangar, insurance, and the periodic CAPS parachute repack across a few partners turns an advanced single into a realistic monthly number.' },
  ],
  beechcraft: [
    { q: 'What is Beechcraft known for?', a: 'Beechcraft builds high-performance travelers — the legendary Bonanza single and the twin-engine Baron — to a premium standard, with roomy cabins and strong cruise speeds.' },
    { q: 'Are Beechcraft aircraft expensive to own?', a: 'They are serious traveling machines with traveling-machine costs — higher fuel burn and healthy engine reserves (two of them on a Baron). That is exactly why Bonanzas and Barons are so often co-owned.' },
    { q: 'Bonanza or Baron?', a: 'The Bonanza is a fast, efficient single; the Baron adds a second engine for redundancy and range at roughly double the maintenance. Choose the single unless you specifically want twin redundancy.' },
  ],
  mooney: [
    { q: 'What is Mooney known for?', a: 'Mooney builds sleek, low-drag retractable singles — the M20 series — famous for delivering the best speed-per-dollar in piston aviation. They go fast on remarkably little fuel.' },
    { q: 'How much does it cost to own a Mooney?', a: 'Fuel costs are low for the speed, but the retractable gear adds an annual inspection and an insurance premium. A partnership spreads those fixed costs across owners.' },
    { q: 'Is a Mooney a good first airplane?', a: 'It is a capable cross-country traveler rather than a trainer — a snug cabin, retractable gear, and more systems to manage. Many owners step into a Mooney after some time in fixed-gear singles.' },
  ],
  diamond: [
    { q: 'What is Diamond known for?', a: 'Diamond builds modern composite airframes — the four-seat DA40 and the twin DA42 — many fitted with fuel-efficient Austro diesel engines, with an excellent safety record. They are popular with flight schools and shared-ownership groups.' },
    { q: 'Are Diamonds cheap to own?', a: 'The diesel models sip Jet-A and the composite airframes are durable, which keeps running costs reasonable; the trade-offs are a higher purchase price and engine/gearbox reserves. Sharing the airplane spreads those reserves.' },
    { q: 'Why co-own a Diamond?', a: 'The modern panel, strong safety record, and diesel economy make Diamonds attractive to share — a partnership splits the fixed costs while everyone enjoys a new-feeling, efficient airplane.' },
  ],
  vans: [
    { q: 'What are Van’s RV aircraft?', a: 'The RV series are experimental amateur-built kit airplanes — sporty two- and four-seat singles offering unmatched performance per dollar, backed by a huge and active builder community.' },
    { q: 'Are experimentals cheaper to own?', a: 'Often yes — owner-performed maintenance is allowed on experimentals, which keeps costs low, and the performance per dollar is the best in aviation. Partnerships are common among builders and sport pilots.' },
    { q: 'Can you co-own an experimental RV?', a: 'Absolutely — many RVs are shared. Just confirm the operating limitations and insurance work for multiple owners, and that everyone is comfortable with the builder-maintained nature of the airplane.' },
  ],
  grumman: [
    { q: 'What is Grumman known for?', a: 'Grumman’s light singles are defined by sliding canopies and sporty handling — the two-seat AA-1 and the four-seat AA-5 Traveler, Tiger, and Cheetah. Simple bonded airframes keep them light and quick for the fuel burn.' },
    { q: 'Are Grummans cheap to own?', a: 'Yes — simple systems and slippery airframes keep both fuel and shared maintenance costs down, which makes them popular first-partnership singles.' },
    { q: 'Grumman Tiger or Cheetah?', a: 'The Tiger has more power and is the faster, better climber; the Cheetah is a bit more economical. Both share the same fun sliding-canopy character.' },
  ],
}

// Per-MAKE "About" overview prose — 2 genuine, evergreen narrative paragraphs per
// curated make, rendered as editorial body copy on the make hub page
// (`/aircraft/[make]`). This is unique content depth (brand history + lineup
// positioning) to lift these pages above templated, count-only boilerplate in the
// INDEXING stage — deliberately distinct from the Q&A `MAKE_FAQS` (narrative, not
// questions). Keyed by makeSlug. Drawn from the SEO_MAKES blurbs + well-known
// general-aviation history — NO fabricated statistics and NO live listing counts,
// so the copy never goes stale. Curated makes (SEO_MAKES) only; a make absent here
// renders no About section (graceful, like the dynamically-discovered model pages).
const MAKE_OVERVIEWS: Record<string, string[]> = {
  cessna: [
    'Cessna has built more general-aviation airplanes than any other manufacturer, and its high-wing singles are the airplanes most people picture when they think of light aviation. The line runs from the two-seat 150 and 152 trainers up through the four-seat 172 Skyhawk — the most-produced airplane in history — to the more powerful 182 Skylane and the load-hauling 206. The high wing gives shade on the ramp, easy fuel checks, and a clear view of the ground, which is part of why so many pilots learn and travel in them.',
    'For shared ownership, the appeal is practicality: parts are stocked everywhere, almost every mechanic has worked on them, and resale demand is deep, so a Cessna is rarely hard to maintain or sell. That predictability is why Cessna singles are the most commonly co-owned aircraft in America — a partnership splits the hangar, insurance, and annual while keeping a famously low-drama airplane on the field.',
  ],
  piper: [
    'Piper is the other great name in American light singles, best known for the low-wing PA-28 Cherokee family — the Cherokee, Warrior, Archer, and retractable Arrow — alongside the timeless Cub taildragger and the six-seat Saratoga. The PA-28s pair forgiving, stable handling with simple systems and one of the largest parts and maintenance networks in aviation, which has made them perennial trainers and first airplanes.',
    'Those same traits make Pipers natural partnership aircraft. A fixed-gear Warrior or Archer is among the most economical four-seat singles to share, the Arrow adds complex and retractable time for a group that wants to build experience, and the Saratoga steps up to six seats when a partnership needs to carry families. Across the range, low operating costs mean each owner’s monthly share stays modest.',
  ],
  cirrus: [
    'Cirrus reshaped the modern piston single with the SR20 and SR22 — sleek composite airframes built around a full glass panel and the CAPS whole-airframe parachute, a safety system no other production single offered at their launch. For years they have been among the best-selling piston airplanes in the world, and their side-yoke, big-screen cockpit set the template the rest of the industry followed.',
    'All that capability comes at a real cost to buy and operate, which is exactly why so many Cirrus owners fly in partnerships. Splitting the hangar, the higher insurance, and the periodic CAPS parachute repack across a few partners turns an advanced, fast traveling airplane into a realistic monthly number — and keeps it flying often enough to stay current.',
  ],
  beechcraft: [
    'Beechcraft has long occupied the premium end of piston general aviation. The V-tail and later straight-tail Bonanza is one of the longest-running airplane designs ever built — a fast, refined single with a roomy cabin — and the twin-engine Baron extends that pedigree with a second engine for redundancy and range. Both are built to a heavier, higher-quality standard that owners describe as feeling a class above typical trainers.',
    'That refinement brings traveling-machine running costs: more fuel, healthy engine reserves, and (on a Baron) two of everything to maintain. Co-ownership is the classic answer — a Bonanza or Baron partnership spreads the fixed costs so a group can enjoy a genuine cross-country airplane without carrying it alone.',
  ],
  mooney: [
    'Mooney built its reputation on speed-per-dollar. The low-slung M20 series — with its distinctive forward-swept tail and tightly cowled airframe — slips through the air with less drag than its rivals, delivering cruise speeds that embarrass airplanes burning far more fuel. For pilots who measure an airplane by how quickly and cheaply it covers distance, a Mooney is hard to beat.',
    'A Mooney is a traveler rather than a trainer: the cabin is snug, the gear retracts, and there are more systems to manage, so many owners arrive after time in fixed-gear singles. The low fuel burn keeps variable costs down, while the retractable gear adds an inspection and an insurance line that a partnership comfortably spreads across owners.',
  ],
  diamond: [
    'Diamond is the modern-composite story in general aviation. The four-seat DA40 and twin-engine DA42 use bonded composite airframes, large bubble canopies, and — on many examples — fuel-efficient Austro Jet-A diesel engines. Combined with an outstanding safety record, those traits have made Diamonds favorites of flight schools and shared-ownership groups looking for a new-feeling, economical airplane.',
    'The economics suit a partnership well: the diesels sip Jet-A and the airframes are durable, which keeps running costs down, while the higher purchase price and engine/gearbox reserves are exactly the kind of fixed cost that splits cleanly across owners. The result is a group flying a modern glass-panel airplane for a sensible monthly share.',
  ],
  vans: [
    'Van’s Aircraft sits at the heart of the experimental amateur-built movement. The RV series — sporty two- and four-seat singles sold as kits — offers performance per dollar that certified airplanes simply can’t match, backed by one of the largest and most active builder communities in aviation. An RV-flyer’s grin is a genuine cultural fixture at fly-ins.',
    'Because they are experimental, owners can perform much of their own maintenance, which keeps costs low and knowledge high. Partnerships are common among builders and sport pilots — sharing a finished RV spreads the cost while the group enjoys an airplane that climbs, cruises, and rolls far beyond its modest fuel burn. Just confirm the operating limitations and insurance work for multiple owners.',
  ],
  grumman: [
    'Grumman’s light singles are the sports cars of the trainer ramp — defined by sliding canopies you taxi with open, bonded aluminum airframes, and a sporty, responsive feel. The two-seat AA-1 and the four-seat AA-5 line (the Traveler, Cheetah, and Tiger) developed a devoted following for being light, quick, and simply fun to fly.',
    'Simplicity is the ownership story: clean, slippery airframes and uncomplicated systems keep both fuel and shared maintenance costs low, which makes a Grumman an excellent first-partnership single. Within the line, the Tiger is the faster, stronger climber and the Cheetah the more economical — both delivering the same open-canopy character that owners fall for.',
  ],
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
  const found = makes.find((m) => m.makeSlug === slug)
  if (!found) return null
  // Attach the curated make-level FAQs + "About" overview prose (if any) without
  // mutating the source — mirrors how getMakeModel attaches MODEL_FAQS. Non-curated
  // makes stay FAQ-less / overview-less.
  const faqs = MAKE_FAQS[found.makeSlug]
  const overview = MAKE_OVERVIEWS[found.makeSlug]
  return faqs || overview ? { ...found, ...(faqs && { faqs }), ...(overview && { overview }) } : found
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
  // `model` may be a comma-joined multi-select (e.g. "SR20,SR22") — render the
  // selection cleanly as "SR20 / SR22" rather than leaking the raw comma.
  const model = (params.model ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
    .join(' / ')
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
  // Listing-quality multi-select (subset of A/B/C). Prefer the new `grade` param;
  // fall back to a legacy single `min_grade` floor (A → [A]; B → [A,B]).
  const gradeRaw = (params.grade ?? '')
    .split(',')
    .map((g) => g.trim().toUpperCase())
    .filter((g) => ['A', 'B', 'C'].includes(g))
  const grades = gradeRaw.length
    ? ['A', 'B', 'C'].filter((g) => gradeRaw.includes(g))
    : params.min_grade === 'A'
      ? ['A']
      : params.min_grade === 'B'
        ? ['A', 'B']
        : []

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
  // Only meaningful as a narrowing when it's a real subset (1 or 2 grades).
  if (grades.length >= 1 && grades.length <= 2) {
    clauses.push(`grade ${grades.join(' or ')}`)
  }

  const hasMakeOrModel = Boolean(make || model)
  if (!hasMakeOrModel && clauses.length === 0) return 'general aviation'

  return [lead, ...clauses].join(' ')
}
