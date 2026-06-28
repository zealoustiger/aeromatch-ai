/**
 * High-confidence title patterns that identify non-aircraft rows (parts listings
 * and WANTED/buyer-seeking ads) in `aircraft_for_sale`. Used to suppress junk from
 * every buyer-facing surface without touching the DB.
 *
 * Rules for adding a pattern:
 * - Must NEVER match a real aircraft listing title (zero false positives).
 * - Prefer narrow terms ("cowling", "fairing") over broad ones ("engine", "parts").
 * - Wrap in `%…%` for PostgREST ilike.
 *
 * Usage at each query call-site:
 *   for (const pattern of PARTS_TITLE_PATTERNS) {
 *     query = query.not('title', 'ilike', pattern)
 *   }
 */
export const PARTS_TITLE_PATTERNS: readonly string[] = [
  // WANTED / buyer-seeking ads (seller is looking to BUY, not sell an aircraft)
  '%wanted%',
  '%accepting orders%',

  // Cosmetic and structural parts
  '%wheelpant%',
  '%wheel pant%',
  '%cowling%',
  '%fairing%',
  '% strut%',         // wing struts, gear struts, lift struts
  '% propeller %',    // "Hartzell propeller", "Cirrus propeller blades"

  // Wing/airframe parts (suffixes catch things like "TURBO WING", "RIGHT WING")
  '% wing',
  '% wings',
  '% wing assembly%',
  '% wing structure%',
  '% wing tip%',

  // Airframe assembly fragments (not whole aircraft)
  '% assembly%', // "wing assembly", "tail assembly" — leading space avoids broad matches

  // Engine/powerplant parts listed alone (not an aircraft with engine)
  '%engine only%',
  '%engine for sale%',

  // Kits & build projects — not flyable aircraft. Catches both standalone parts
  // kits ("RV WING KIT", "CONVERSION KIT") and unfinished kit-builds the buyer
  // would have to assemble themselves ("VANS RV-8 QB KIT").
  '% kit',
  '% kit %',

  // Standalone floats (the brands below ONLY make floats; "% floats" by itself
  // would false-positive on real seaplane listings like "CITABRIA ON FLOATS").
  'edo %float%',
  'pk %float%',
  'pk % float%',
  '% wipline %float%',
  '% wipaire %float%',
  '% aerocet %float%',
  '% baumann %float%',

  // Placeholder titles a seller never filled in.
  'available',
]
