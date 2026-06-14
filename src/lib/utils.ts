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
 * Whether an email is a real, reachable contact address. Captured
 * Facebook/Craigslist listings are stored with a non-routable sentinel
 * (`facebook-noreply@clubhanger.com`), so a "Send Email" button pointed at it
 * is a guaranteed dead-end. Returns false for that sentinel, any other
 * `*noreply@clubhanger.com` address, and anything that isn't a plausible email.
 */
export function isRoutableContactEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const e = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false
  if (/(^|[.-])noreply@clubhanger\.com$/.test(e)) return false
  return true
}
