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

  // Airframe assembly fragments (not whole aircraft)
  '% assembly%', // "wing assembly", "tail assembly" — leading space avoids broad matches

  // Engine/powerplant parts listed alone (not an aircraft with engine)
  '%engine only%',
  '%engine for sale%',
]
