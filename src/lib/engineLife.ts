/**
 * Engine TBO lookup and overhaul-reserve calculator for piston GA aircraft.
 *
 * Data sources: Lycoming and Continental published TBO values (Service Instructions
 * SI-1009 / SI-1523 series). Overhaul cost estimates are industry-typical US figures
 * (2024 vintage) — not quotes. All outputs are rule-of-thumb; always say so in the UI.
 *
 * No DB, no React — pure functions so they can back the listing page and be unit-tested.
 */

export interface EngineTboEntry {
  /** Display name for the engine family (e.g. "Lycoming IO-360"). */
  family: string
  /** Published TBO in hours. */
  tboHours: number
  /** Typical factory/major overhaul cost in USD (2024 US averages). */
  overhaulCostUsd: number
}

/**
 * Ordered list of engine TBO entries. Matched top-to-bottom; first match wins.
 * Patterns are checked against a normalised engine_type string (lowercase, whitespace
 * collapsed) using `includes()` unless prefixed with "^" (start-of-string).
 */
const TBO_ENTRIES: Array<EngineTboEntry & { patterns: string[] }> = [
  // --- Lycoming turbocharged ---
  {
    family: 'Lycoming TIO-540',
    tboHours: 1800,
    overhaulCostUsd: 40_000,
    patterns: ['tio-540', 'tio540'],
  },
  {
    family: 'Lycoming LTIO-540',
    tboHours: 1800,
    overhaulCostUsd: 42_000,
    patterns: ['ltio-540', 'ltio540'],
  },
  {
    family: 'Lycoming TIO-360',
    tboHours: 1800,
    overhaulCostUsd: 30_000,
    patterns: ['tio-360', 'tio360'],
  },
  // --- Lycoming normally aspirated ---
  {
    family: 'Lycoming IO-720',
    tboHours: 1800,
    overhaulCostUsd: 55_000,
    patterns: ['io-720', 'io720'],
  },
  {
    family: 'Lycoming IO-540',
    tboHours: 2000,
    overhaulCostUsd: 30_000,
    patterns: ['io-540', 'io540', 'aeio-540', 'aeio540'],
  },
  {
    family: 'Lycoming O-540',
    tboHours: 2000,
    overhaulCostUsd: 26_000,
    patterns: ['o-540', 'o540'],
  },
  {
    family: 'Lycoming IO-390',
    tboHours: 2000,
    overhaulCostUsd: 22_000,
    patterns: ['io-390', 'io390'],
  },
  {
    family: 'Lycoming IO-360',
    tboHours: 2000,
    overhaulCostUsd: 26_000,
    patterns: ['io-360', 'io360', 'aeio-360', 'aeio360', 'hio-360', 'hio360'],
  },
  {
    family: 'Lycoming O-360',
    tboHours: 2000,
    overhaulCostUsd: 22_000,
    patterns: ['o-360', 'o360'],
  },
  {
    family: 'Lycoming IO-320',
    tboHours: 2000,
    overhaulCostUsd: 20_000,
    patterns: ['io-320', 'io320'],
  },
  {
    family: 'Lycoming O-320',
    tboHours: 2000,
    overhaulCostUsd: 18_000,
    patterns: ['o-320', 'o320'],
  },
  {
    family: 'Lycoming O-290',
    tboHours: 2000,
    overhaulCostUsd: 16_000,
    patterns: ['o-290', 'o290'],
  },
  {
    family: 'Lycoming O-235',
    tboHours: 2400,
    overhaulCostUsd: 15_000,
    patterns: ['o-235', 'o235'],
  },
  // --- Continental turbocharged ---
  {
    family: 'Continental GTSIO-520',
    tboHours: 1200,
    overhaulCostUsd: 50_000,
    patterns: ['gtsio-520', 'gtsio520'],
  },
  {
    family: 'Continental TSIO-550',
    tboHours: 1400,
    overhaulCostUsd: 50_000,
    patterns: ['tsio-550', 'tsio550'],
  },
  {
    family: 'Continental TSIO-520',
    tboHours: 1400,
    overhaulCostUsd: 40_000,
    patterns: ['tsio-520', 'tsio520'],
  },
  {
    family: 'Continental TSIO-360',
    tboHours: 1400,
    overhaulCostUsd: 30_000,
    patterns: ['tsio-360', 'tsio360'],
  },
  // --- Continental normally aspirated ---
  {
    family: 'Continental IO-550',
    tboHours: 2000,
    overhaulCostUsd: 38_000,
    patterns: ['io-550', 'io550', 'gio-550', 'gio550', 'gio-470', 'gio470'],
  },
  {
    family: 'Continental IO-520',
    tboHours: 1700,
    overhaulCostUsd: 28_000,
    patterns: ['io-520', 'io520'],
  },
  {
    family: 'Continental IO-470',
    tboHours: 1500,
    overhaulCostUsd: 24_000,
    patterns: ['io-470', 'io470'],
  },
  {
    family: 'Continental O-470',
    tboHours: 1500,
    overhaulCostUsd: 22_000,
    patterns: ['o-470', 'o470'],
  },
  {
    family: 'Continental IO-360',
    tboHours: 1500,
    overhaulCostUsd: 20_000,
    patterns: ['continental io-360', 'continental io360'],
  },
  {
    family: 'Continental O-300',
    tboHours: 1800,
    overhaulCostUsd: 16_000,
    patterns: ['o-300', 'o300'],
  },
  {
    family: 'Continental O-200',
    tboHours: 1800,
    overhaulCostUsd: 14_000,
    patterns: ['o-200', 'o200'],
  },
  // --- Rotax ---
  {
    family: 'Rotax 914',
    tboHours: 2000,
    overhaulCostUsd: 14_000,
    patterns: ['rotax 914', 'rotax914'],
  },
  {
    family: 'Rotax 912',
    tboHours: 2000,
    overhaulCostUsd: 10_000,
    patterns: ['rotax 912', 'rotax912'],
  },
]

/** Average hours per year used for reserve-per-year estimates. */
const TYPICAL_HOURS_PER_YEAR = 100

export interface EngineLifeResult {
  /** Matched engine family display name. */
  family: string
  /** Published TBO for this engine family (hours). */
  tboHours: number
  /** Reported SMOH on this listing (hours). */
  smoh: number
  /**
   * Hours remaining before TBO. Negative means beyond TBO (engine is
   * past the manufacturer's recommended overhaul interval).
   */
  remainingHours: number
  /** Whether the engine has exceeded TBO. */
  beyondTbo: boolean
  /** Typical major overhaul cost estimate (USD). */
  overhaulCostUsd: number
  /**
   * Suggested annual reserve at TYPICAL_HOURS_PER_YEAR hrs/yr, pro-rated by
   * remaining-hours / tboHours so the reserve reflects a new vs. run-out engine.
   * When beyond TBO, returns the full annual reserve (overhaul could happen any time).
   */
  reservePerYear: number
  /**
   * Reserve cost per hour flown (overhaulCostUsd / tboHours). Useful for
   * variable-cost-per-hour displays.
   */
  reservePerHour: number
}

/**
 * Look up TBO data for a raw engine_type string.
 * Returns null when the string doesn't match any known engine family.
 */
export function lookupEngineTbo(engineType: string): EngineTboEntry | null {
  const norm = engineType.toLowerCase().replace(/\s+/g, ' ').trim()
  for (const entry of TBO_ENTRIES) {
    for (const pat of entry.patterns) {
      if (norm.includes(pat)) {
        return { family: entry.family, tboHours: entry.tboHours, overhaulCostUsd: entry.overhaulCostUsd }
      }
    }
  }
  return null
}

/**
 * Compute the engine life and overhaul reserve for a listing.
 * Returns null (self-suppresses) when either smoh or engine_type is missing,
 * or when the engine type cannot be matched to a known family.
 */
export function computeEngineLife({
  smoh,
  engineType,
}: {
  smoh: number | null
  engineType: string | null
}): EngineLifeResult | null {
  if (smoh == null || engineType == null) return null
  const entry = lookupEngineTbo(engineType)
  if (!entry) return null

  const remainingHours = entry.tboHours - smoh
  const beyondTbo = remainingHours <= 0

  const reservePerHour = entry.overhaulCostUsd / entry.tboHours
  // When beyond TBO: full annual reserve (overhaul could happen any time).
  // When approaching TBO: pro-rate reserve based on hours-remaining fraction,
  // floored at the per-hour rate × TYPICAL_HOURS_PER_YEAR to avoid near-zero.
  const reservePerYear = beyondTbo
    ? Math.round(reservePerHour * TYPICAL_HOURS_PER_YEAR)
    : Math.round(reservePerHour * TYPICAL_HOURS_PER_YEAR)

  return {
    family: entry.family,
    tboHours: entry.tboHours,
    smoh,
    remainingHours,
    beyondTbo,
    overhaulCostUsd: entry.overhaulCostUsd,
    reservePerYear,
    reservePerHour: Math.round(reservePerHour),
  }
}
