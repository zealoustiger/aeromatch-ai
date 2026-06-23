import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAirportsWithinRadius } from '@/lib/airports'
import { MOCK_SEEKERS } from '@/lib/mockData'
import type { PartnershipSeeker } from '@/lib/types'

export type SeekerFilters = {
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
  return Boolean(f.airport || f.state || f.make || f.rating || f.min_hours || f.share_type)
}

/** Pilots-seeking listings matching the active filters (newest first). Seeker
 *  fields are mostly arrays (preferred makes / ratings / share types), so those
 *  filters use array-contains; hours is a floor; location is airport±radius or state. */
export async function getSeekers(f: SeekerFilters): Promise<PartnershipSeeker[]> {
  if (!hasSupabase()) {
    let r = MOCK_SEEKERS
    if (f.state) r = r.filter((s) => s.state === f.state!.toUpperCase())
    if (f.make) r = r.filter((s) => s.preferred_makes?.some((m) => m.toLowerCase() === f.make!.toLowerCase()))
    if (f.rating) r = r.filter((s) => s.ratings_held?.includes(f.rating!))
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

  // Location: a home airport (optionally expanded by radius) wins over a plain state.
  if (f.airport?.trim()) {
    const code = f.airport.trim().toUpperCase()
    const radius = f.radius ? parseInt(f.radius, 10) : 0
    const icaos = radius > 0 ? await getAirportsWithinRadius(code, radius) : [code]
    if (icaos.length) query = query.in('home_airport', icaos)
  } else if (f.state?.trim()) {
    query = query.eq('state', f.state.trim().toUpperCase())
  }

  if (f.make?.trim()) query = query.contains('preferred_makes', [f.make.trim()])
  if (f.rating?.trim()) query = query.contains('ratings_held', [f.rating.trim()])
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
