import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number | null, fallback = 'Contact for price'): string {
  if (!cents) return fallback
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents)
}

/** Compact price label for use inside badges/chips: "$118k" or "$1.2M".
 *  Rounds to nearest $1k for values under $1M, nearest $100k for $1M+. */
export function formatPriceK(dollars: number): string {
  if (dollars >= 1_000_000) {
    const m = Math.round(dollars / 100_000) / 10
    return `$${m}M`
  }
  const k = Math.round(dollars / 1_000)
  return `$${k}k`
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
 * Anonymize a person's name for public display as "First L." so a pilot's full
 * identity is never published (privacy-by-default for seeker listings).
 * - "John Smith"      -> "John S."
 * - "Jonathan Q. Lee" -> "Jonathan L."
 * - "Alex" / "Alex R." (single token / already short) -> returned unchanged
 * - empty / null -> null
 * Idempotent on names that are already in "First L." form.
 */
export function anonymizeName(name?: string | null): string | null {
  if (!name) return null
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null
  const first = tokens[0]
  if (tokens.length === 1) return first
  const lastInitial = tokens[tokens.length - 1][0]?.toUpperCase()
  return lastInitial ? `${first} ${lastInitial}.` : first
}

/**
 * Convert a stored nautical-mile travel radius to a human-readable drive-time
 * label. Seekers think in drive time, not nm — this translates stored values
 * (from either the old nm options or the new drive-time options) for display.
 */
export function travelLabel(nm: number): string {
  if (nm <= 28) return '~30 min drive'
  if (nm <= 45) return '~45 min drive'
  if (nm <= 60) return '~1 hr drive'
  if (nm <= 85) return '~1.5 hr drive'
  return '~2 hr drive'
}
