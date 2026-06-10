export type ShareType = '1/2' | '1/3' | '1/4' | 'leaseback' | 'dry_lease' | 'other'
export type ListingStatus = 'active' | 'pending' | 'closed'
export type ContactMethod = 'email' | 'phone' | 'both'

export interface Partnership {
  id: string
  created_at: string
  updated_at: string

  make: string
  model: string
  year: number | null
  registration: string | null

  home_airport: string
  airport_name: string | null
  city: string | null
  state: string | null
  lat: number | null
  lng: number | null

  share_type: ShareType
  shares_available: number
  total_shares: number | null

  buy_in_price: number | null
  monthly_fixed: number | null
  hourly_wet: number | null

  min_hours: number | null
  ratings_required: string[] | null
  scheduling_system: string | null

  title: string
  description: string | null
  images: string[] | null
  source_url: string | null
  image_is_placeholder: boolean | null

  contact_name: string | null
  contact_email: string
  contact_method: ContactMethod
  contact_phone: string | null

  status: ListingStatus
  poster_id: string | null
}

export interface AircraftForSale {
  id: string
  created_at: string

  source: string
  source_url: string | null

  make: string | null
  model: string | null
  year: number | null
  registration: string | null

  ttaf: number | null
  smoh: number | null
  annual_due: string | null
  damage_history: boolean | null
  avionics: string[] | null
  engine_type: string | null

  title: string
  description: string | null
  asking_price: number | null
  price_text: string | null

  location: string | null
  state: string | null
  status: ListingStatus
}

export interface Airport {
  icao: string
  iata: string | null
  name: string
  city: string | null
  state: string | null
  lat: number
  lng: number
  elevation: number | null
  type: string | null
}

export interface PartnershipFilters {
  airport?: string
  radiusNm?: number
  make?: string
  model?: string
  maxMonthly?: number
  maxBuyIn?: number
  shareType?: ShareType
  state?: string
  minHours?: number
}
