import { createAdminClient } from './supabase-admin'

/**
 * "What is this watch alert actually watching, right now" for `/alerts/manage`.
 *
 * A "watch this listing" alert (shipped in `listing-watch-price-alert`) has its
 * own `source_path` shape — `/aircraft/listing/<id>?watch=price` — that the
 * generic `alertMatchCounts.ts` parser doesn't recognize (by design: a family
 * match count is meaningless for a single-listing watch). This is a deliberately
 * separate, narrow lookup: resolve the one watched row by id and report its live
 * status honestly, rather than rendering nothing.
 */

const WATCH_PATH = /^\/aircraft\/listing\/([^/?]+)\?watch=price$/

export function isListingWatchPath(sourcePath: string | null): boolean {
  return WATCH_PATH.test(sourcePath ?? '')
}

export interface WatchedListingStatus {
  active: boolean
  id: string
  label: string
  price: number | null
}

/**
 * Resolve a watch alert's `source_path` to the real listing's current status.
 * Returns `null` for any alert that isn't this shape. A listing that's been
 * sold, removed, or deleted outright still resolves — `active: false` — rather
 * than throwing, so the manage page can say so honestly instead of going blank.
 */
export async function getWatchedListingStatus(sourcePath: string | null): Promise<WatchedListingStatus | null> {
  const match = WATCH_PATH.exec(sourcePath ?? '')
  if (!match) return null
  const id = match[1]

  const admin = createAdminClient()
  const { data } = await admin
    .from('aircraft_for_sale')
    .select('id, status, year, make, model, asking_price')
    .eq('id', id)
    .maybeSingle()

  if (!data) return { active: false, id, label: 'This aircraft', price: null }

  const label = [data.year, data.make, data.model].filter(Boolean).join(' ') || 'This aircraft'
  return {
    active: data.status === 'active',
    id: data.id,
    label,
    price: data.asking_price ?? null,
  }
}
