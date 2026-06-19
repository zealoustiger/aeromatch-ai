import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AircraftForSale } from '@/lib/types'
import AircraftSaleCard from './AircraftSaleCard'

interface Filters {
  q?: string
  make?: string
  model?: string
  state?: string
  max_price?: string
  min_year?: string
  max_tt?: string
  sort?: string
  drops?: string
}

const PAGE_SIZE = 60

export default async function AircraftSaleList({ filters }: { filters: Filters }) {
  let listings: AircraftForSale[] = []
  // Total number of listings matching the active filters (may exceed the rows
  // shown). null = unknown/not applicable, fall back to the displayed length.
  let totalCount: number | null = null
  let error = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) {
    return renderList([], filters, null)
  }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('aircraft_for_sale')
      .select('*', { count: 'exact' })
      .eq('status', 'active')

    if (filters.make) query = query.ilike('make', `%${filters.make}%`)
    if (filters.model) query = query.eq('model', filters.model)
    if (filters.state) query = query.eq('state', filters.state)
    if (filters.max_price) query = query.lte('asking_price', parseInt(filters.max_price))
    if (filters.min_year) query = query.gte('year', parseInt(filters.min_year))
    if (filters.max_tt) query = query.lte('ttaf', parseInt(filters.max_tt))
    if (filters.q) {
      const term = filters.q.replace(/[%,()]/g, ' ').trim()
      if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    }
    // "Price drops only" — narrowed precisely in JS below (column-to-column
    // comparison isn't expressible in PostgREST).
    if (filters.drops) query = query.not('price_changed_at', 'is', null)

    switch (filters.sort) {
      case 'price_asc':
        query = query.order('asking_price', { ascending: true, nullsFirst: false })
        break
      case 'price_desc':
        query = query.order('asking_price', { ascending: false, nullsFirst: false })
        break
      case 'reduced':
        query = query.order('price_changed_at', { ascending: false, nullsFirst: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data, error: err, count } = await query.limit(PAGE_SIZE)
    if (err) {
      error = true
    } else {
      listings = data ?? []
      // Keep only genuine drops (asking < previous), not price rises.
      if (filters.drops) {
        listings = listings.filter(
          (p) => p.previous_price != null && p.asking_price != null && p.asking_price < p.previous_price
        )
        // The genuine-drops narrowing is column-to-column and can't be expressed
        // in the count query, so fall back to the JS-narrowed length below.
        totalCount = null
      } else {
        totalCount = count ?? null
      }
    }
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

  return renderList(listings, filters, totalCount)
}

function renderList(listings: AircraftForSale[], filters: Filters, totalCount: number | null) {
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

  // Prefer the exact total when we have it; otherwise fall back to the displayed
  // length with a "+" when it pins to the page size (e.g. the price-drops path).
  const exact = totalCount != null
  const shown = exact ? (totalCount as number) : listings.length
  const approx = !exact && listings.length === PAGE_SIZE
  const moreThanShown = exact && (totalCount as number) > listings.length

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        {shown.toLocaleString()} aircraft for sale{approx ? '+' : ''} found
        {moreThanShown && (
          <span className="text-slate-400"> — showing first {listings.length}</span>
        )}
      </p>
      <div className="space-y-4">
        {listings.map((p) => (
          <AircraftSaleCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  )
}
