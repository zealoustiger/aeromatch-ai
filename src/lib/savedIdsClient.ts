import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Client-side cache of the signed-in viewer's saved listings, shared by every
 * `SaveListingButton` on the page.
 *
 * Why: the public hub pages (/, make/model, state, deals, browse …) are now
 * served from the CDN cache (ISR), so their server render has no cookies and
 * every heart arrives as `initialSaved={false}`. Hearts therefore hydrate
 * themselves here instead — one `saved_listings` read per page load per user
 * (RLS `saved_listings_owner_all` scopes it to the viewer's own rows), not one
 * per card. Dynamic pages that still pass a real `initialSaved` are unaffected.
 *
 * Module-level on purpose: a single promise per userId that all mounted hearts
 * await, kept coherent on toggle via `markSaved` and dropped on sign-out.
 */

let cache: { userId: string; promise: Promise<Set<string>> } | null = null

export function savedKey(listingId: string, listingType: string): string {
  return `${listingType}:${listingId}`
}

export function getSavedKeys(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  if (cache && cache.userId === userId) return cache.promise
  const promise: Promise<Set<string>> = (async () => {
    const { data } = await supabase
      .from('saved_listings')
      .select('listing_id, listing_type')
      .eq('user_id', userId)
    return new Set((data ?? []).map((r) => savedKey(String(r.listing_id), String(r.listing_type))))
  })().catch(() => new Set<string>()) // non-fatal: just render unfilled hearts
  cache = { userId, promise }
  return promise
}

/** Keep the shared set in step with a toggle so sibling hearts stay correct. */
export function markSaved(userId: string, key: string, saved: boolean): void {
  if (!cache || cache.userId !== userId) return
  cache.promise = cache.promise.then((set) => {
    const next = new Set(set)
    if (saved) next.add(key)
    else next.delete(key)
    return next
  })
}

export function resetSavedKeys(): void {
  cache = null
}
