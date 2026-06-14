import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership } from '@/lib/types'
import { MOCK_PARTNERSHIPS } from '@/lib/mockData'
import { rankByCompleteness } from '@/lib/utils'
import FeaturedListingCard from './FeaturedListingCard'

// Pull a wider pool than we display so complete listings can lead even when the
// newest few are incomplete captured drafts; rank, then slice to `limit`.
async function getLatestPartnerships(limit: number): Promise<Partnership[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  const pool = Math.max(limit * 4, 24)

  if (!hasSupabase) return rankByCompleteness(MOCK_PARTNERSHIPS.slice(0, pool)).slice(0, limit)

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('partnerships')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(pool)
    return rankByCompleteness(data ?? []).slice(0, limit)
  } catch {
    return []
  }
}

export default async function FeaturedListings() {
  const listings = await getLatestPartnerships(6)

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
