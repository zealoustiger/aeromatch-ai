// Curated "mission" landing pages for `/aircraft/mission/[mission]`.
//
// Each mission is a real, high-intent buyer search ("glass cockpit aircraft for
// sale", "tailwheel aircraft for sale", …) that maps onto the EXISTING
// `fetchAircraftPage` filters — no new query logic, no new DB columns. This is a
// FIXED, hand-curated set (like the guides), not a programmatic explosion: every
// page carries substantively-unique editorial guidance PLUS the live grid of real
// matching listings, so none is a thin/doorway page.
//
// The `filters` map onto the same keys `fetchAircraftPage` already understands:
//   q       → title/description keyword (ilike OR) — for equipment/type intents
//   max_tt  → airframe total time ceiling (lte ttaf) — for the low-time intent
// Keep these honest: only filters that genuinely select the named kind of aircraft.

export interface MissionFilters {
  q?: string
  max_tt?: string
  min_year?: string
  max_price?: string
}

export interface Mission {
  /** URL slug under /aircraft/mission/. */
  slug: string
  /** Short label for chips/links, e.g. "Glass cockpit". */
  label: string
  /** Page H1. */
  h1: string
  /** Absolute <title> (bypasses the "%s | ClubHanger" template). */
  metaTitle: string
  metaDescription: string
  /** One-line sub-header under the H1. */
  blurb: string
  /** 2-3 paragraphs of unique buyer guidance — distinct per mission. */
  intro: string[]
  /** Existing fetchAircraftPage filter keys applied to the live listing grid. */
  filters: MissionFilters
}

export const MISSIONS: Mission[] = [
  {
    slug: 'glass-cockpit',
    label: 'Glass cockpit',
    h1: 'Glass Cockpit Aircraft for Sale',
    metaTitle: 'Glass Cockpit Aircraft for Sale | ClubHanger',
    metaDescription:
      'Browse general aviation aircraft for sale with glass cockpit avionics — Garmin G1000, Aspen, and similar integrated displays. Aggregated from across the web.',
    blurb: 'Aircraft equipped with integrated digital flight displays.',
    intro: [
      'A glass cockpit replaces the traditional cluster of mechanical "steam gauge" instruments with one or more large digital displays. Integrated suites like the Garmin G1000, Avidyne Entegra, or an Aspen Evolution retrofit put your attitude, navigation, engine data, traffic, and weather on the same screens — which is why glass-panel aircraft are popular with pilots who fly cross-country and in instrument conditions, where the reduced scan and built-in situational awareness genuinely lower the workload.',
      'Glass also tends to hold its value and broaden the buyer pool at resale, but the panel is where a lot of the money lives, so it deserves close attention. Confirm the navigators are WAAS-capable and ADS-B Out compliant, ask when the databases were last current, and find out whether the displays are factory-integrated or a later retrofit — retrofits vary widely in capability and in how cleanly they were installed.',
      'The listings below are the aircraft in our inventory whose title or description calls out glass-panel avionics. Always verify the exact equipment on the source listing and, ideally, in the aircraft logs before you buy — avionics descriptions in classified listings are a starting point, not a guarantee.',
    ],
    filters: { q: 'glass' },
  },
  {
    slug: 'ifr',
    label: 'IFR-equipped',
    h1: 'IFR-Equipped Aircraft for Sale',
    metaTitle: 'IFR-Equipped Aircraft for Sale | ClubHanger',
    metaDescription:
      'Browse IFR-equipped general aviation aircraft for sale — instrument-capable singles and twins for serious cross-country travel. Aggregated from across the web.',
    blurb: 'Instrument-capable aircraft for all-weather cross-country flying.',
    intro: [
      'An IFR-equipped aircraft is set up to be flown under Instrument Flight Rules — in cloud and low visibility — rather than only in good visual conditions. In practice that means a certified instrument navigation system, the required flight instruments, and increasingly a coupled autopilot to fly approaches and hold headings while you manage the flight. For pilots who actually want to use an aircraft for travel, IFR capability is what turns a fair-weather toy into dependable transportation.',
      'Equipment alone is not the whole story. For the aircraft to be legal in the system its pitot-static and transponder checks must be current, and any GPS used for IFR navigation has to be an approved unit with up-to-date databases. Ask about the most recent avionics certifications, whether ADS-B Out is installed, and what the autopilot can and cannot do — a two-axis autopilot with approach coupling is a very different airplane to hand-fly than a wing-leveler.',
      'The listings below are the aircraft in our inventory described as IFR-capable. Treat the description as a lead and confirm the panel, certifications, and logbooks on the source listing before making an offer.',
    ],
    filters: { q: 'IFR' },
  },
  {
    slug: 'tailwheel',
    label: 'Tailwheel',
    h1: 'Tailwheel Aircraft for Sale',
    metaTitle: 'Tailwheel Aircraft for Sale | ClubHanger',
    metaDescription:
      'Browse tailwheel (conventional-gear) aircraft for sale — taildraggers for backcountry, bush, and stick-and-rudder flying. Aggregated from across the web.',
    blurb: 'Conventional-gear taildraggers for backcountry and stick-and-rudder flying.',
    intro: [
      'A tailwheel aircraft — a "taildragger" — carries its third wheel under the tail instead of the nose. That conventional-gear layout sits behind much of backcountry and bush flying: it handles rough, unimproved strips well, keeps the propeller higher off the ground, and rewards precise stick-and-rudder technique. Classic taildraggers also have a devoted following simply because they are a joy to fly.',
      'The trade-off is on the ground. Tailwheel aircraft are less forgiving during takeoff and landing and can ground-loop if mishandled, so a tailwheel endorsement is required and insurers will look closely at your time-in-type and recent experience. If you are stepping into one for the first time, budget for transition training and expect the insurance conversation to focus on it.',
      'The listings below are the aircraft in our inventory described as tailwheel or conventional-gear. Confirm the gear configuration, recent damage history, and any required endorsements on the source listing and in the logs before you commit.',
    ],
    filters: { q: 'tailwheel' },
  },
  {
    slug: 'low-time',
    label: 'Low-time',
    h1: 'Low-Time Aircraft for Sale',
    metaTitle: 'Low-Time Aircraft for Sale | ClubHanger',
    metaDescription:
      'Browse low-time general aviation aircraft for sale — airframes with under 1,500 hours total time. Aggregated from across the web.',
    blurb: 'Airframes with under 1,500 hours total time.',
    intro: [
      'A "low-time" aircraft has accumulated relatively few hours on the airframe over its life. The listings below are filtered to aircraft with under 1,500 hours total time (TTAF). Lower airframe time can mean less wear on the structure and a longer remaining service life, which is part of why low-time aircraft often command a premium — but total time is only one number, and a low figure is not automatically a bargain.',
      'Read the total airframe time alongside the engine time. An airframe with few hours can still have a high-time or run-out engine, or the reverse — a freshly overhauled engine on a high-time airframe. What matters for ownership cost is usually time since major overhaul (SMOH) and how the aircraft has been used and stored: an engine that has sat unflown for years can be in worse shape than one flown regularly, regardless of the hour count.',
      'Use the total-time figure here as a filter, then verify the engine times, overhaul history, and complete logbooks on the source listing before you buy. The numbers in aggregated classifieds are a starting point, not a substitute for the logs.',
    ],
    filters: { max_tt: '1500' },
  },
]

/** Look up a mission by slug. Returns undefined for unknown slugs (→ 404). */
export function getMission(slug: string): Mission | undefined {
  return MISSIONS.find((m) => m.slug === slug)
}
