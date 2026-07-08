import { createAdminClient } from './supabase-admin'

export type SaveCountListingType = 'aircraft' | 'partnership' | 'seeker'

/** Minimum genuine save count before a "Saved by N pilots" chip renders — below
 *  this the signal is too thin to read as real social proof (GOAL.md: never
 *  fabricate/inflate). Below the floor the card just renders no chip. */
export const MIN_SAVES_TO_SHOW = 2

/**
 * Real save counts per listing id, aggregated across ALL users — not just the
 * signed-in viewer. `saved_listings` RLS is owner-scoped (`auth.uid() =
 * user_id`), so a regular client can only ever see its own saves; this reads
 * via the service-role client instead. Only counts are returned, never which
 * users saved a listing, so no other user's identity is exposed. Fails soft
 * to an empty map on any error — cards just render with no chip.
 */
export async function getSaveCounts(
  ids: string[],
  listingType: SaveCountListingType
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (ids.length === 0) return counts
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('saved_listings')
      .select('listing_id')
      .eq('listing_type', listingType)
      .in('listing_id', ids)
    for (const row of data ?? []) {
      const id = row.listing_id as string
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  } catch {
    // Non-fatal: cards just render with no save-count chip.
  }
  return counts
}
