/**
 * Overhaul-timeline read for an aircraft listing.
 *
 * Fuses two reads we already compute on a listing — the engine's hours remaining before
 * TBO (`engineLife.ts`) and the airframe's historical utilization in hrs/year
 * (`airframeUsage.ts`) — into the calendar question a buyer actually asks: "how many YEARS
 * until I'm on the hook for an overhaul?" Hours-to-TBO alone can't answer that; the same
 * 600 hrs remaining is ~12 years for a 50 hrs/yr flyer but ~4 years for a 150 hrs/yr flyer.
 *
 * Proprietary because it synthesizes our own extracted specs; honest because it self-
 * suppresses (returns null) rather than guess when the inputs don't support a projection,
 * and is framed in the UI as a rule-of-thumb off the aircraft's HISTORICAL rate.
 *
 * No DB, no React — pure function so it can back the listing page and be unit-tested.
 */

export interface OverhaulTimelineResult {
  /** Engine hours remaining before TBO (from the engine-life read). */
  remainingHours: number
  /** The aircraft's historical hours/year (from the airframe-utilization read). */
  hoursPerYear: number
  /** Estimated calendar years to TBO at the historical rate, rounded to 0.5, floored at 0.5. */
  yearsToTbo: number
}

/**
 * Compute the calendar-years-to-overhaul projection.
 *
 * Returns null (self-suppresses) when:
 *  - either input is non-finite,
 *  - the engine is at/beyond TBO (remainingHours <= 0) — the Engine Life panel already
 *    surfaces that case honestly, and a "years remaining" projection would be misleading,
 *  - the historical utilization is non-positive (hoursPerYear <= 0).
 */
export function computeOverhaulTimeline({
  remainingHours,
  hoursPerYear,
}: {
  remainingHours: number
  hoursPerYear: number
}): OverhaulTimelineResult | null {
  if (!Number.isFinite(remainingHours) || !Number.isFinite(hoursPerYear)) return null
  if (remainingHours <= 0) return null
  if (hoursPerYear <= 0) return null

  const rawYears = remainingHours / hoursPerYear
  // Round to the nearest half-year so the read isn't spuriously precise; floor at 0.5 so a
  // nearly-run-out engine never displays "0 years" (which would read as "already due").
  const yearsToTbo = Math.max(0.5, Math.round(rawYears * 2) / 2)

  return { remainingHours, hoursPerYear, yearsToTbo }
}
