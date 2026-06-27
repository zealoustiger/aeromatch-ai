import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAirportsWithinRadius } from '@/lib/airports'
import { MOCK_SEEKERS } from '@/lib/mockData'
import type { PartnershipSeeker } from '@/lib/types'

export type SeekerFilters = {
  /** Multi-airport list (comma-joined ICAO codes), OR'd together. */
  airports?: string
  /** Legacy single airport (kept for old links / saved searches), optionally + radius. */
  airport?: string
  radius?: string
  state?: string
  make?: string
  rating?: string
  min_hours?: string
  share_type?: string
}

function hasSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!url && url !== 'https://placeholder.supabase.co'
}

export function anySeekerFilter(f: SeekerFilters): boolean {
  return Boolean(f.airports || f.airport || f.state || f.make || f.rating || f.min_hours || f.share_type)
}

/** Parse a comma-joined multi-select param ("Cessna,Cirrus") into a clean, de-duped
 *  list of exact stored values. Tolerates the legacy single-value form ("Cessna"). */
function parseMulti(raw: string | undefined): string[] {
  if (!raw) return []
  return [...new Set(raw.split(',').map((v) => v.trim()).filter(Boolean))]
}

/** Resolve the home-airport filter into a list of ICAO codes to OR over. Prefers
 *  the multi-airport `airports` param; falls back to the legacy single `airport`
 *  (optionally expanded by `radius`). A lone airport with a radius expands to every
 *  field within range; several airports are matched exactly (radius is ambiguous
 *  across multiple centers, so the UI only offers it for a single airport). */
async function resolveSeekerAirports(f: SeekerFilters): Promise<string[]> {
  const codes = parseMulti(f.airports ?? f.airport).map((c) => c.toUpperCase())
  if (codes.length === 1) {
    const radius = f.radius ? parseInt(f.radius, 10) : 0
    if (radius > 0) return getAirportsWithinRadius(codes[0], radius)
  }
  return codes
}

/** Pilots-seeking listings matching the active filters (newest first). Seeker
 *  fields are mostly arrays (preferred makes / ratings / share types), so those
 *  filters use array-contains; hours is a floor; location is airport±radius or state. */
export async function getSeekers(f: SeekerFilters): Promise<PartnershipSeeker[]> {
  // Make / Rating are multi-select (comma-joined params) → match seekers wanting
  // ANY of the chosen makes / holding ANY of the chosen ratings (OR semantics).
  const makes = parseMulti(f.make)
  const ratings = parseMulti(f.rating)

  if (!hasSupabase()) {
    let r = MOCK_SEEKERS
    const codes = parseMulti(f.airports ?? f.airport).map((c) => c.toUpperCase())
    if (codes.length) r = r.filter((s) => codes.includes((s.home_airport ?? '').toUpperCase()))
    else if (f.state) r = r.filter((s) => s.state === f.state!.toUpperCase())
    if (makes.length) {
      const wanted = new Set(makes.map((m) => m.toLowerCase()))
      r = r.filter((s) => s.preferred_makes?.some((m) => wanted.has(m.toLowerCase())))
    }
    if (ratings.length) {
      const wanted = new Set(ratings)
      r = r.filter((s) => s.ratings_held?.some((rt) => wanted.has(rt)))
    }
    if (f.share_type) r = r.filter((s) => (s.preferred_share_types ?? []).some((t) => t === f.share_type))
    if (f.min_hours) r = r.filter((s) => (s.total_hours ?? 0) >= parseInt(f.min_hours!, 10))
    return r
  }

  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('partnership_seekers')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Location: a home airport list (multi-airport, or a lone airport optionally
  // expanded by radius) wins over a plain state.
  const airportIcaos = await resolveSeekerAirports(f)
  if (airportIcaos.length) {
    query = query.in('home_airport', airportIcaos)
  } else if (f.state?.trim()) {
    query = query.eq('state', f.state.trim().toUpperCase())
  }

  // `.overlaps` (array `&&`) = the seeker's array shares ≥1 element with the selected
  // set, i.e. they want ANY of the chosen makes / hold ANY of the chosen ratings.
  if (makes.length) query = query.overlaps('preferred_makes', makes)
  if (ratings.length) query = query.overlaps('ratings_held', ratings)
  if (f.share_type?.trim()) query = query.contains('preferred_share_types', [f.share_type.trim()])
  if (f.min_hours) {
    const n = parseInt(f.min_hours, 10)
    if (Number.isFinite(n) && n > 0) query = query.gte('total_hours', n)
  }

  const { data } = await query
  return (data as PartnershipSeeker[]) ?? []
}

/** Makes that seekers are actually looking for (most-wanted first) — feeds the
 *  chip bar + the make filter so values match what's stored (exact array-contains). */
export async function getSeekerMakes(): Promise<string[]> {
  const rank = (lists: (string[] | null | undefined)[]): string[] => {
    const counts = new Map<string, number>()
    for (const list of lists) for (const raw of list ?? []) {
      const make = (raw ?? '').trim()
      if (make) counts.set(make, (counts.get(make) ?? 0) + 1)
    }
    return [...counts.keys()].sort((a, b) => (counts.get(b)! - counts.get(a)!) || a.localeCompare(b))
  }
  if (!hasSupabase()) return rank(MOCK_SEEKERS.map((s) => s.preferred_makes))
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('partnership_seekers')
      .select('preferred_makes')
      .eq('status', 'active')
      .limit(5000)
    return rank((data ?? []).map((r) => r.preferred_makes as string[] | null))
  } catch {
    return []
  }
}

export async function getSeekerCount(): Promise<number> {
  if (!hasSupabase()) return MOCK_SEEKERS.length
  try {
    const supabase = await createServerSupabaseClient()
    const { count } = await supabase
      .from('partnership_seekers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    return count ?? 0
  } catch {
    return 0
  }
}
