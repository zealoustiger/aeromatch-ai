import { createServerSupabaseClient } from './supabase-server'

function haversineNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065 // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const MILES_PER_NM = 1.15078

/**
 * Returns ICAO codes of all airports within `radiusMiles` statute miles of `homeIcao`.
 * Always includes `homeIcao` itself even if not in the airports table.
 */
export async function getAirportsWithinRadius(
  homeIcao: string,
  radiusMiles: number
): Promise<string[]> {
  const supabase = await createServerSupabaseClient()

  const { data: home } = await supabase
    .from('airports')
    .select('lat, lng')
    .eq('icao', homeIcao.toUpperCase())
    .single()

  if (!home) return [homeIcao.toUpperCase()]

  const radiusNm = radiusMiles / MILES_PER_NM

  const { data: all } = await supabase.from('airports').select('icao, lat, lng')

  const nearby = (all ?? [])
    .filter((a) => haversineNm(home.lat, home.lng, a.lat, a.lng) <= radiusNm)
    .map((a) => a.icao as string)

  if (!nearby.includes(homeIcao.toUpperCase())) nearby.push(homeIcao.toUpperCase())
  return nearby
}

/**
 * Batched ICAO → lat/lng lookup against the seeded FAA `airports` table.
 * Codes that don't exist in the table are simply absent from the result (no
 * fabricated coordinates) — callers should drop anything not present.
 */
export async function resolveAirportCoords(
  icaos: string[]
): Promise<Record<string, { lat: number; lng: number }>> {
  const unique = Array.from(new Set(icaos.map((c) => c.trim().toUpperCase()))).filter(Boolean)
  if (unique.length === 0) return {}

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('airports').select('icao, lat, lng').in('icao', unique)

  const out: Record<string, { lat: number; lng: number }> = {}
  for (const a of data ?? []) {
    out[a.icao] = { lat: a.lat, lng: a.lng }
  }
  return out
}
