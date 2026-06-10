import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAirportsWithinRadius } from '@/lib/airports'
import { Partnership } from '@/lib/types'
import PartnershipCard from './PartnershipCard'

interface Filters {
  airport?: string
  airports?: string
  radius?: string
  state?: string
  make?: string
  max_monthly?: string
  max_buyin?: string
  share_type?: string
}

export default async function PartnershipList({ filters }: { filters: Filters }) {
  let listings: Partnership[] = []
  let error = false

  // Resolve airport list: multi-airport input OR single airport (with optional radius)
  let airportList: string[] = []
  if (filters.airports) {
    airportList = filters.airports.split(',').map((a) => a.trim().toUpperCase()).filter(Boolean)
  } else if (filters.airport) {
    const radiusMiles = filters.radius ? parseInt(filters.radius) : 0
    if (radiusMiles > 0) {
      airportList = await getAirportsWithinRadius(filters.airport, radiusMiles)
    } else {
      airportList = [filters.airport.toUpperCase()]
    }
  }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('partnerships')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (airportList.length > 1) {
      query = query.in('home_airport', airportList)
    } else if (airportList.length === 1) {
      query = query.ilike('home_airport', `%${airportList[0]}%`)
    }

    if (filters.state) query = query.eq('state', filters.state)
    if (filters.make) query = query.ilike('make', `%${filters.make}%`)
    if (filters.share_type) query = query.eq('share_type', filters.share_type)
    if (filters.max_monthly) query = query.lte('monthly_fixed', parseInt(filters.max_monthly))
    if (filters.max_buyin) query = query.lte('buy_in_price', parseInt(filters.max_buyin))

    const { data, error: err } = await query.limit(50)
    if (err) { error = true } else { listings = data ?? [] }
  } catch {
    error = true
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center text-sm text-red-600">
        Failed to load listings. Please try again.
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">No partnerships found yet.</p>
        <p className="mt-1 text-sm text-slate-400">Be the first — post a listing and get discovered.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        {listings.length} {listings.length === 1 ? 'partnership' : 'partnerships'} found
        {filters.airport && filters.radius ? (
          <span className="ml-1">
            within <strong>{filters.radius} miles</strong> of{' '}
            <strong>{filters.airport.toUpperCase()}</strong>
            {airportList.length > 1 && (
              <span className="text-slate-400"> ({airportList.length} airports)</span>
            )}
          </span>
        ) : airportList.length > 0 ? (
          <span className="ml-1">near <strong>{airportList.join(', ')}</strong></span>
        ) : null}
      </p>
      <div className="space-y-4">
        {listings.map((p) => (
          <PartnershipCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  )
}
