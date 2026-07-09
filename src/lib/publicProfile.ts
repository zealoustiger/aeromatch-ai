import { createServerSupabaseClient } from './supabase-server'
import type { AviatorConfig } from '@/components/AviatorAvatar'
import type { AircraftForSale, Partnership, PartnershipSeeker } from './types'

export interface PublicProfile {
  user_id: string
  display_name: string | null
  home_airport: string | null
  bio: string | null
  mission: string | null
  avatar_config: AviatorConfig | null
  verified: boolean
  created_at: string | null
}

/** A real signed-up pilot's public profile row (`profiles`, RLS: public read —
 *  same table + policy the `/airports/[icao]` "Pilots based here" section
 *  already reads from). Returns null when the user has no profile row yet
 *  (never visited /account), which the page treats as "nothing to show". */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name, home_airport, bio, mission, avatar_config, verified, created_at')
    .eq('user_id', userId)
    .maybeSingle()
  return (data as PublicProfile | null) ?? null
}

export interface PublicProfileListings {
  aircraft: AircraftForSale[]
  partnerships: Partnership[]
  seekers: PartnershipSeeker[]
}

/** This pilot's active, publicly-postable listings across all 3 marketplaces —
 *  same `poster_id` shape as `/listings` (My Listings), capped so a prolific
 *  poster's profile page stays a readable page, not a full dashboard dump. */
export async function getPublicProfileListings(userId: string): Promise<PublicProfileListings> {
  const supabase = await createServerSupabaseClient()
  const [aircraft, partnerships, seekers] = await Promise.all([
    supabase
      .from('aircraft_for_sale')
      .select('*')
      .eq('poster_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('partnerships')
      .select('*')
      .eq('poster_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('partnership_seekers')
      .select('*')
      .eq('poster_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12),
  ])
  return {
    aircraft: (aircraft.data as AircraftForSale[]) ?? [],
    partnerships: (partnerships.data as Partnership[]) ?? [],
    seekers: (seekers.data as PartnershipSeeker[]) ?? [],
  }
}
