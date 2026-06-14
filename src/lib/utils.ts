import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Partnership } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number | null, fallback = 'Contact for price'): string {
  if (!cents) return fallback
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents)
}

export function formatShareType(type: string): string {
  const labels: Record<string, string> = {
    '1/2': '1/2 Share',
    '1/3': '1/3 Share',
    '1/4': '1/4 Share',
    'leaseback': 'Leaseback',
    'dry_lease': 'Dry Lease',
    'other': 'Other',
  }
  return labels[type] ?? type
}

export function aircraftLabel(make: string, model: string, year?: number | null): string {
  return [year, make, model].filter(Boolean).join(' ')
}

type CompletenessFields = Pick<Partnership, 'make' | 'model' | 'buy_in_price' | 'monthly_fixed'>

/**
 * A listing is "complete" enough to surface prominently when it has a real
 * make AND model AND at least one price (buy-in or monthly). Captured
 * Facebook/Craigslist drafts default make/model to "Unknown" and often carry
 * no price — those rank last and are de-emphasized.
 *
 * NOTE: the spec also lists `image_is_placeholder = true` as an incompleteness
 * signal, but in the current data *every* listing (including high-quality ones
 * like the 2006 C182T Skylane) is a placeholder image, so using it would mute
 * everything. Completeness is therefore keyed on make/model/price only; the
 * placeholder photo is handled separately by the "Not actual plane photo"
 * badge. Revisit if/when real photos start landing in `images[]`.
 */
export function isCompleteListing(p: CompletenessFields): boolean {
  const hasMake = !!p.make && p.make.trim().toLowerCase() !== 'unknown'
  const hasModel = !!p.model && p.model.trim().toLowerCase() !== 'unknown'
  const hasPrice = !!p.buy_in_price || !!p.monthly_fixed
  return hasMake && hasModel && hasPrice
}

/**
 * Stable partition: complete listings first, incomplete last. Order *within*
 * each group is preserved, so an upstream `created_at desc` ordering is kept
 * intact inside both groups (no complete listing is ever ranked below an
 * incomplete one).
 */
export function rankByCompleteness<T extends CompletenessFields>(listings: T[]): T[] {
  const complete: T[] = []
  const incomplete: T[] = []
  for (const p of listings) {
    ;(isCompleteListing(p) ? complete : incomplete).push(p)
  }
  return [...complete, ...incomplete]
}
