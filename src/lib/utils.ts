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

/** Sentinel address stamped on Facebook/Craigslist-captured listings (admin/review/actions.ts). */
export const CAPTURED_NOREPLY_EMAIL = 'facebook-noreply@clubhanger.com'

/**
 * Whether an email can actually receive mail. Captured listings carry the
 * non-routable `facebook-noreply@clubhanger.com` sentinel (and any other
 * "noreply" address is a dead end too), so a "Send Email" CTA pointed at one
 * goes nowhere. Use this to decide whether to render the email CTA at all.
 */
export function isContactableEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const e = email.trim().toLowerCase()
  if (e === CAPTURED_NOREPLY_EMAIL) return false
  if (/(^|[._-])no-?reply([._-]|@)/.test(e)) return false
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)
}
