import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
 * Format a stored timestamp/date for display, pinned to UTC so the server (UTC)
 * and the client (local TZ) always render the same calendar day. Without the
 * fixed timeZone, `toLocaleDateString` uses the runtime's zone and can land on
 * different days server vs client, producing a React hydration mismatch.
 *
 * Accepts either a full ISO timestamp (e.g. `created_at`) or a bare `YYYY-MM-DD`
 * date (e.g. `posted_at`), which is interpreted as UTC midnight.
 */
export function formatListedDate(value: string, opts?: { month?: 'short' | 'long' }): string {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value
  return new Date(iso).toLocaleDateString('en-US', {
    month: opts?.month ?? 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
