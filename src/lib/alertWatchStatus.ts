import { createAdminClient } from './supabase-admin'
import { aircraftLabel, formatShareType } from './utils'

/**
 * "What is this watch alert actually watching, right now" for `/alerts/manage`.
 *
 * A "watch this listing" alert (shipped in `listing-watch-price-alert` for
 * aircraft, `partnership-watch-buyin-alert` for partnerships) has its own
 * `source_path` shape — `/aircraft/listing/<id>?watch=price` or
 * `/partnerships/<id>?watch=price` — that the generic `alertMatchCounts.ts`
 * parser doesn't recognize (by design: a family match count is meaningless for
 * a single-listing watch). This is a deliberately separate, narrow lookup:
 * resolve the one watched row by id and report its live status honestly,
 * rather than rendering nothing.
 */

const AIRCRAFT_WATCH_PATH = /^\/aircraft\/listing\/([^/?]+)\?watch=price$/
const PARTNERSHIP_WATCH_PATH = /^\/partnerships\/([^/?]+)\?watch=price$/

export function isListingWatchPath(sourcePath: string | null): boolean {
  const path = sourcePath ?? ''
  return AIRCRAFT_WATCH_PATH.test(path) || PARTNERSHIP_WATCH_PATH.test(path)
}

export interface WatchedListingStatus {
  active: boolean
  id: string
  label: string
  price: number | null
  type: 'aircraft' | 'partnership'
}

/**
 * Resolve a watch alert's `source_path` to the real listing's current status.
 * Returns `null` for any alert that isn't this shape. A listing that's been
 * sold, removed, or deleted outright still resolves — `active: false` — rather
 * than throwing, so the manage page can say so honestly instead of going blank.
 */
export async function getWatchedListingStatus(sourcePath: string | null): Promise<WatchedListingStatus | null> {
  const path = sourcePath ?? ''

  const aircraftMatch = AIRCRAFT_WATCH_PATH.exec(path)
  if (aircraftMatch) return getAircraftWatchStatus(aircraftMatch[1])

  const partnershipMatch = PARTNERSHIP_WATCH_PATH.exec(path)
  if (partnershipMatch) return getPartnershipWatchStatus(partnershipMatch[1])

  return null
}

async function getAircraftWatchStatus(id: string): Promise<WatchedListingStatus> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('aircraft_for_sale')
    .select('id, status, year, make, model, asking_price')
    .eq('id', id)
    .maybeSingle()

  if (!data) return { active: false, id, label: 'This aircraft', price: null, type: 'aircraft' }

  const label = aircraftLabel(data.make, data.model, data.year) || 'This aircraft'
  return {
    active: data.status === 'active',
    id: data.id,
    label,
    price: data.asking_price ?? null,
    type: 'aircraft',
  }
}

async function getPartnershipWatchStatus(id: string): Promise<WatchedListingStatus> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('partnerships')
    .select('id, status, make, model, share_type, buy_in_price')
    .eq('id', id)
    .maybeSingle()

  if (!data) return { active: false, id, label: 'This partnership', price: null, type: 'partnership' }

  const aircraft = [data.make, data.model].filter(Boolean).join(' ')
  const label = [formatShareType(data.share_type), aircraft].filter(Boolean).join(' · ') || 'This partnership'
  return {
    active: data.status === 'active',
    id: data.id,
    label,
    price: data.buy_in_price ?? null,
    type: 'partnership',
  }
}
