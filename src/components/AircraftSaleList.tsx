import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AircraftForSale } from '@/lib/types'
import AircraftSaleCard from './AircraftSaleCard'

interface Filters {
  q?: string
  make?: string
  state?: string
  max_price?: string
  min_year?: string
}

export default async function AircraftSaleList({ filters }: { filters: Filters }) {
  let listings: AircraftForSale[] = []
  let error = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) {
    return renderList([], filters)
  }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('aircraft_for_sale')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (filters.make) query = query.ilike('make', `%${filters.make}%`)
    if (filters.state) query = query.eq('state', filters.state)
    if (filters.max_price) query = query.lte('asking_price', parseInt(filters.max_price))
    if (filters.min_year) query = query.gte('year', parseInt(filters.min_year))
    if (filters.q) {
      const term = filters.q.replace(/[%,()]/g, ' ').trim()
      if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    }

    const { data, error: err } = await query.limit(60)
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

  return renderList(listings, filters)
}

function renderList(listings: AircraftForSale[], filters: Filters) {
  if (listings.length === 0) {
    const filtered = Object.values(filters).some(Boolean)
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">
          {filtered ? 'No aircraft match these filters.' : 'No aircraft for sale yet.'}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {filtered ? 'Try widening your search.' : 'Check back soon — new listings are added daily.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        {listings.length} aircraft for sale
        {listings.length === 60 ? '+' : ''} found
      </p>
      <div className="space-y-4">
        {listings.map((p) => (
          <AircraftSaleCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  )
}
