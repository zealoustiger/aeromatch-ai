import { createServerSupabaseClient } from './supabase-server'
import { scoreMatch, type AirportCoords, type MatchResult } from './matching'
import { Partnership, PartnershipSeeker } from './types'
import { MOCK_PARTNERSHIPS, MOCK_SEEKERS } from './mockData'

/**
 * Server-side glue around the pure matching engine: resolves airport coordinates
 * from the `airports` table and ranks live listings. Everything here is best-effort
 * and fails soft (returns []) so match surfaces never break a page render.
 */

export interface ScoredPartnership {
  partnership: Partnership
  match: MatchResult
}

export interface ScoredSeeker {
  seeker: PartnershipSeeker
  match: MatchResult
}

function hasSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!url && url !== 'https://placeholder.supabase.co'
}

/** Resolve ICAO → coordinates for just the airports we need (one indexed `in` query). */
export async function getAirportCoords(icaos: string[]): Promise<AirportCoords> {
  const unique = [...new Set(icaos.map((i) => (i ?? '').toUpperCase()).filter(Boolean))]
  if (unique.length === 0 || !hasSupabase()) return {}
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('airports').select('icao, lat, lng').in('icao', unique)
    const map: AirportCoords = {}
    for (const a of data ?? []) {
      if (a.lat != null && a.lng != null) map[String(a.icao).toUpperCase()] = { lat: Number(a.lat), lng: Number(a.lng) }
    }
    return map
  } catch {
    return {}
  }
}

async function fetchActivePartnerships(): Promise<Partnership[]> {
  if (!hasSupabase()) return MOCK_PARTNERSHIPS
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('partnerships').select('*').eq('status', 'active')
    return data ?? []
  } catch {
    return []
  }
}

async function fetchActiveSeekers(): Promise<PartnershipSeeker[]> {
  if (!hasSupabase()) return MOCK_SEEKERS
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('partnership_seekers').select('*').eq('status', 'active')
    return data ?? []
  } catch {
    return []
  }
}

/** Rank active partnerships for a given seeker. Qualified-only unless includeUnqualified. */
export async function getMatchesForSeeker(
  seeker: PartnershipSeeker,
  opts: { includeUnqualified?: boolean } = {}
): Promise<ScoredPartnership[]> {
  const partnerships = (await fetchActivePartnerships()).filter(
    // Don't match a user against their own partnership listings.
    (p) => !(seeker.poster_id && p.poster_id && p.poster_id === seeker.poster_id)
  )
  if (partnerships.length === 0) return []

  const coords = await getAirportCoords([seeker.home_airport, ...partnerships.map((p) => p.home_airport)])
  const scored = partnerships.map((partnership) => ({
    partnership,
    match: scoreMatch(seeker, partnership, coords),
  }))
  return scored
    .filter((s) => (opts.includeUnqualified ? true : s.match.qualified))
    .sort((a, b) => b.match.score - a.match.score)
}

/** Rank active seekers for a given partnership (the owner's view). */
export async function getMatchesForPartnership(
  partnership: Partnership,
  opts: { includeUnqualified?: boolean } = {}
): Promise<ScoredSeeker[]> {
  const seekers = (await fetchActiveSeekers()).filter(
    (s) => !(partnership.poster_id && s.poster_id && s.poster_id === partnership.poster_id)
  )
  if (seekers.length === 0) return []

  const coords = await getAirportCoords([partnership.home_airport, ...seekers.map((s) => s.home_airport)])
  const scored = seekers.map((seeker) => ({
    seeker,
    match: scoreMatch(seeker, partnership, coords),
  }))
  return scored
    .filter((s) => (opts.includeUnqualified ? true : s.match.qualified))
    .sort((a, b) => b.match.score - a.match.score)
}

/** The current user's own active seeker + partnership listings. */
export async function getCurrentUserListings(): Promise<{
  userId: string | null
  seekers: PartnershipSeeker[]
  partnerships: Partnership[]
}> {
  if (!hasSupabase()) return { userId: null, seekers: [], partnerships: [] }
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { userId: null, seekers: [], partnerships: [] }

    const [{ data: seekers }, { data: partnerships }] = await Promise.all([
      supabase.from('partnership_seekers').select('*').eq('poster_id', user.id).eq('status', 'active'),
      supabase.from('partnerships').select('*').eq('poster_id', user.id).eq('status', 'active'),
    ])
    return { userId: user.id, seekers: seekers ?? [], partnerships: partnerships ?? [] }
  } catch {
    return { userId: null, seekers: [], partnerships: [] }
  }
}
