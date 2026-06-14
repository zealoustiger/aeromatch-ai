import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership } from '@/lib/types'
import { MOCK_PARTNERSHIPS } from '@/lib/mockData'
import { rankListings } from '@/lib/utils'
import FeaturedListingCard from './FeaturedListingCard'

async function getLatestPartnerships(limit: number): Promise<Partnership[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) return MOCK_PARTNERSHIPS.slice(0, limit)

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('partnerships')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)
    return data ?? []
  } catch {
    return []
  }
}

export default async function FeaturedListings() {
  const listings = rankListings(await getLatestPartnerships(6))

  if (listings.length === 0) return null

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Newest partnerships</h2>
            <p className="mt-1 text-slate-500">Fresh co-ownership opportunities across the country</p>
          </div>
          <Link
            href="/partnerships"
            className="hidden items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((p) => (
            <FeaturedListingCard key={p.id} p={p} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/partnerships"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600"
          >
            View all partnerships <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
