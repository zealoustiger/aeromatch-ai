import { createAdminClient } from './supabase-admin'
import { createServerSupabaseClient } from './supabase-server'

export type FacilityType = 'fbo' | 'flying_club'

/** Minimum genuine rating count before an aggregate renders — below this the signal
 *  is too thin to read as real social proof (GOAL.md: never fabricate/inflate). */
export const MIN_RATINGS_TO_SHOW = 2

export type FacilityRatingSummary = { average: number; count: number }

/**
 * Real rating aggregates per facility, computed across ALL raters — not just the
 * signed-in viewer. `airport_facility_ratings` RLS is owner-scoped (`auth.uid() =
 * user_id`), so a regular client can only ever see its own rows; this reads via the
 * service-role client instead, same pattern as `saveCounts.ts`'s `getSaveCounts`.
 * Only the aggregate is returned, never who rated what. Fails soft to an empty map —
 * including when the table hasn't been migrated onto the live DB yet.
 */
export async function getFacilityRatingSummaries(
  icao: string,
  facilityNames: string[]
): Promise<Map<string, FacilityRatingSummary>> {
  const summaries = new Map<string, FacilityRatingSummary>()
  if (facilityNames.length === 0) return summaries
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('airport_facility_ratings')
      .select('facility_name, rating')
      .eq('airport_icao', icao.toUpperCase())
      .in('facility_name', facilityNames)
    if (error) return summaries
    const totals = new Map<string, { sum: number; count: number }>()
    for (const row of data ?? []) {
      const name = row.facility_name as string
      const rating = row.rating as number
      const existing = totals.get(name) ?? { sum: 0, count: 0 }
      existing.sum += rating
      existing.count += 1
      totals.set(name, existing)
    }
    for (const [name, { sum, count }] of totals) {
      if (count >= MIN_RATINGS_TO_SHOW) {
        summaries.set(name, { average: sum / count, count })
      }
    }
  } catch {
    // Non-fatal: widgets just render with no aggregate.
  }
  return summaries
}

/**
 * The signed-in viewer's own ratings for these facilities (to pre-fill the widget as
 * "your rating"). Uses the authed client, scoped by RLS to the caller's own rows —
 * no service role needed. Returns an empty map when signed out or on any error
 * (including a not-yet-migrated table).
 */
export async function getUserFacilityRatings(
  icao: string,
  facilityNames: string[]
): Promise<Map<string, number>> {
  const mine = new Map<string, number>()
  if (facilityNames.length === 0) return mine
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return mine
    const { data, error } = await supabase
      .from('airport_facility_ratings')
      .select('facility_name, rating')
      .eq('user_id', user.id)
      .eq('airport_icao', icao.toUpperCase())
      .in('facility_name', facilityNames)
    if (error) return mine
    for (const row of data ?? []) {
      mine.set(row.facility_name as string, row.rating as number)
    }
  } catch {
    // Non-fatal: widgets just render unrated.
  }
  return mine
}
