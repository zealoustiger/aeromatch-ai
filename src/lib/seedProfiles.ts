// Seed/demo partnership personas (e.g. "Marcus T.") — the hand-seeded listings
// used to bootstrap the marketplace before organic supply arrives. They are owned
// by the ClubHanger "concierge" house account (see scripts/create-concierge.mjs),
// so the normal in-site messaging flow works against them and inquiries reach the
// operator. These helpers identify such listings and shape a lightweight public
// "member" persona from the listing fields.

import type { Partnership } from '@/lib/types'

/** Synthetic contact-email domains used only by hand-seeded demo listings. */
const SYNTHETIC_DOMAINS = ['@example.com', '@aeromatch-demo.com']

/** Email of the concierge house account that owns the seed listings. */
export const CONCIERGE_EMAIL =
  process.env.SEED_CONCIERGE_EMAIL || 'concierge@clubhanger.com'

/** Where seed-listing inquiries are forwarded (operator's real inbox). */
export const SEED_INQUIRY_EMAIL =
  process.env.SEED_INQUIRY_EMAIL ||
  (process.env.ADMIN_EMAILS || '').split(',')[0].trim() ||
  'brian@iterative.vc'

type SeedShape = Pick<Partnership, 'contact_email' | 'source_url'>

/**
 * True when a partnership is a hand-seeded demo persona (not a scraped listing
 * and not a real user post). Keyed off the synthetic contact-email domain + no
 * source_url, so it can't misclassify a scraped or genuine listing.
 */
export function isSeedProfile(p: SeedShape): boolean {
  if (p.source_url) return false
  const email = (p.contact_email || '').toLowerCase()
  return SYNTHETIC_DOMAINS.some((d) => email.endsWith(d))
}

export interface MemberPersona {
  /** Stable id for the persona — the listing id (one persona per seed listing). */
  id: string
  name: string
  firstName: string
  /** Avatar seed; stable so the aviator avatar never changes for this persona. */
  avatarSeed: string
  homeAirport: string | null
  location: string | null
  /** ISO date the persona "joined" — the listing's created_at. */
  memberSince: string | null
}

/** Shape a public member persona from a seed partnership listing. */
export function personaFromPartnership(p: Partnership): MemberPersona {
  const name = (p.contact_name || 'A ClubHanger member').trim()
  const firstName = name.split(/\s+/)[0] || 'this member'
  const location =
    [p.city, p.state].filter(Boolean).join(', ') || null
  return {
    id: p.id,
    name,
    firstName,
    avatarSeed: p.id,
    homeAirport: p.home_airport ?? null,
    location,
    memberSince: p.created_at ?? null,
  }
}

/** "Member since June 2026" label from an ISO date (null → null). */
export function memberSinceLabel(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `Member since ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
}
