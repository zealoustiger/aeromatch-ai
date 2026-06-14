import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Partnership } from './types'

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

/**
 * A listing is "complete" enough to surface prominently when it has a real
 * make/model AND at least one price (buy-in or monthly). Captured/scraped
 * listings with "Unknown" make/model or no pricing are considered incomplete:
 * they stay published (per owner decision) but get ranked last and de-emphasized.
 *
 * NOTE: We intentionally do NOT key completeness off `image_is_placeholder`.
 * In the current data almost every listing (incl. the highest-quality ones)
 * uses a placeholder photo, so treating that as "incomplete" would mute nearly
 * the whole catalog and bury the good listings the ranking is meant to surface.
 */
export function isCompleteListing(p: Partnership): boolean {
  const make = (p.make ?? '').trim().toLowerCase()
  const model = (p.model ?? '').trim().toLowerCase()
  const hasRealMakeModel =
    make.length > 0 && model.length > 0 && make !== 'unknown' && model !== 'unknown'
  const hasPrice = p.buy_in_price != null || p.monthly_fixed != null
  return hasRealMakeModel && hasPrice
}

/**
 * Stable sort that pushes incomplete listings to the end while preserving the
 * incoming order (typically `created_at` desc) within the complete and
 * incomplete groups. No complete listing is ever ranked below an incomplete one.
 */
export function rankListings<T extends Partnership>(listings: T[]): T[] {
  return [...listings].sort(
    (a, b) => Number(isCompleteListing(b)) - Number(isCompleteListing(a)),
  )
}
