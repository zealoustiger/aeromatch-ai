export type ShareType = '1/2' | '1/3' | '1/4' | 'leaseback' | 'dry_lease' | 'other'
export type ListingStatus = 'active' | 'pending' | 'closed' | 'admin'
export type ContactMethod = 'email' | 'phone' | 'both'
export type AircraftCategory = 'sel' | 'mel' | 'turboprop' | 'jet' | 'any'

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
  posted_at: string | null

  contact_name: string | null
  contact_email: string
  contact_method: ContactMethod
  contact_phone: string | null

  ttaf: number | null
  smoh: number | null
  engine_type: string | null

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
  // 'admin' = ingested but admin-only (e.g. Controller Bay-Area); hidden from the
  // public marketplace, which gates on status='active'.
  status: ListingStatus | 'sold' | 'admin'

  // Freshness + price history (Phase 2 ingestion)
  first_seen_at: string | null
  last_seen_at: string | null
  content_hash: string | null
  previous_price: number | null
  price_changed_at: string | null
  removed_at: string | null

  // Quality (generated column; 0-100). Grade derived in src/lib/listingQuality.ts
  quality_score: number | null

  // Real photos harvested from the source listing (hotlinked URLs). Empty when
  // the source had none or isn't yet supported → fall back to a make placeholder.
  images: string[]
  image_is_placeholder: boolean

  // Set on user-posted listings (source='user'); null for scraped rows.
  poster_id: string | null
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

export interface Thread {
  id: string
  created_at: string
  partnership_id: string | null
  seeker_id?: string | null
  inquirer_id: string
  owner_id: string
  last_message_at?: string | null
  last_message_sender_id?: string | null
  inquirer_read_at?: string | null
  owner_read_at?: string | null
}

export interface Message {
  id: string
  created_at: string
  thread_id: string
  sender_id: string
  body: string
}

export interface SavedSearch {
  id: string
  created_at: string
  user_id: string
  name: string
  search_params: string
  /** Marketplace the search belongs to, e.g. '/partnerships' or '/aircraft'. */
  path: string
}

export interface PartnershipSeeker {
  id: string
  created_at: string
  updated_at: string

  preferred_makes: string[] | null
  preferred_models: string | null
  min_year: number | null
  max_year: number | null
  aircraft_category: AircraftCategory | null

  max_buy_in: number | null
  max_monthly: number | null
  max_hourly: number | null

  home_airport: string
  airport_name: string | null
  city: string | null
  state: string | null
  willing_to_travel_nm: number | null

  total_hours: number | null
  ratings_held: string[] | null

  preferred_share_types: ShareType[] | null
  preferred_scheduling: string | null

  intended_use: string[] | null
  hours_per_month: number | null

  title: string
  description: string | null

  contact_name: string | null
  contact_email: string
  contact_method: ContactMethod
  contact_phone: string | null

  status: ListingStatus
  poster_id: string | null
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

export interface AircraftForSaleFilters {
  q?: string
  make?: string
  state?: string
  maxPrice?: number
  minYear?: number
}
