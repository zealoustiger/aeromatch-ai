/**
 * Airframe utilization read for an aircraft listing.
 *
 * Turns total time (TTAF) + model year into an average hours-flown-per-year over the
 * aircraft's life — an honest, two-sided buyer signal distinct from the engine-since-
 * overhaul (SMOH) read in `engineLife.ts`. A life-average rule of thumb only: it uses
 * the listing's OWN ttaf and age — no type benchmarks, no fabricated figures — so it
 * self-suppresses (returns null) rather than guess when the inputs are missing.
 *
 * No DB, no React — pure function so it can back the listing page and be unit-tested.
 */

export type UtilizationBand = 'low' | 'typical' | 'high'

export interface AirframeUsageResult {
  /** Reported total time (airframe hours) on this listing. */
  ttaf: number
  /** Approximate age in years (current year − model year), at least 1. */
  ageYears: number
  /** Average airframe hours flown per year over its life (rounded). */
  hoursPerYear: number
  /** Utilization classification. */
  band: UtilizationBand
  /** Short headline for the band (e.g. "Low-time for its age"). */
  headline: string
  /** Honest, two-sided guidance for a buyer. */
  detail: string
}

// Personal piston GA aircraft typically fly on the order of ~50–100 hrs/year. These
// bands are deliberately wide and the copy is two-sided, so the read informs rather
// than scores — low utilization is NOT presented as strictly good.
const LOW_MAX = 40
const HIGH_MIN = 120

/**
 * Compute the airframe utilization read for a listing.
 * Returns null (self-suppresses) when ttaf or year is missing, ttaf is non-positive,
 * or the aircraft's age can't be established as at least one year (e.g. model year in
 * the current year or future) — in which case a per-year average would be meaningless.
 */
export function computeAirframeUsage(
  { ttaf, year }: { ttaf: number | null; year: number | null },
  now: Date = new Date()
): AirframeUsageResult | null {
  if (ttaf == null || year == null) return null
  if (ttaf <= 0) return null

  const ageYears = now.getUTCFullYear() - year
  if (ageYears < 1) return null

  const hoursPerYear = Math.round(ttaf / ageYears)

  let band: UtilizationBand
  let headline: string
  let detail: string
  if (hoursPerYear < LOW_MAX) {
    band = 'low'
    headline = 'Low-time for its age'
    detail =
      `This airframe has averaged about ${hoursPerYear.toLocaleString()} hrs/year over ~${ageYears} years — ` +
      `light use for a personal aircraft. Fewer hours can mean lighter wear, but aircraft that sit also ` +
      `risk dried seals, corrosion, and stale fuel-system components. Ask how regularly it's flown and ` +
      `what the recent annual inspections found.`
  } else if (hoursPerYear > HIGH_MIN) {
    band = 'high'
    headline = 'High utilization'
    detail =
      `This airframe has averaged about ${hoursPerYear.toLocaleString()} hrs/year over ~${ageYears} years — ` +
      `more than most personal aircraft. Regular flying keeps engines and systems healthy, but it also ` +
      `adds cumulative wear, so review the maintenance history, component overhauls, and how the total ` +
      `time compares with the type's typical service life.`
  } else {
    band = 'typical'
    headline = 'Typical utilization'
    detail =
      `This airframe has averaged about ${hoursPerYear.toLocaleString()} hrs/year over ~${ageYears} years — ` +
      `in the normal range for a personal aircraft: regularly exercised without being worked hard.`
  }

  return { ttaf, ageYears, hoursPerYear, band, headline, detail }
}
