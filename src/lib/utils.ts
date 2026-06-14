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
 * Format a stored timestamp as a calendar date, deterministically.
 *
 * Pins the timezone to UTC so the server (which runs in UTC) and the browser
 * (which runs in the user's local timezone) always render the SAME calendar
 * day. Without this, a timestamp near a day boundary formats to different days
 * on server vs client, producing a React hydration mismatch warning.
 *
 * Accepts either a full ISO timestamp ("2026-06-09T02:30:00Z") or a date-only
 * string ("2026-06-09"); date-only values are anchored to UTC midnight.
 */
export function formatListedDate(value: string, month: 'long' | 'short' = 'long'): string {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value
  return new Date(iso).toLocaleDateString('en-US', {
    month,
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
