import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PartnershipSeeker } from '@/lib/types'
import { MOCK_SEEKERS } from '@/lib/mockData'
import SeekerCard from './SeekerCard'

async function getSeekers(state?: string, make?: string): Promise<PartnershipSeeker[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) {
    let results = MOCK_SEEKERS
    if (state) results = results.filter((s) => s.state === state)
    if (make) results = results.filter((s) => s.preferred_makes?.some((m) => m.toLowerCase().includes(make.toLowerCase())))
    return results
  }

  const supabase = await createServerSupabaseClient()
  let query = supabase.from('partnership_seekers').select('*').eq('status', 'active').order('created_at', { ascending: false })

  if (state) query = query.eq('state', state)

  const { data } = await query
  return (data as PartnershipSeeker[]) ?? []
}

export default async function SeekerList({ filters }: { filters: Record<string, string | undefined> }) {
  const seekers = await getSeekers(filters.state, filters.make)

  if (seekers.length === 0) {
    const hasFilters = Object.values(filters).some(Boolean)
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
        <p className="text-slate-500">
          {hasFilters ? 'No seeking listings match your filters.' : 'No seeking listings yet.'}
        </p>
        <p className="mt-1 text-sm text-slate-400">Be the first — post a seeking listing!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {seekers.map((seeker) => (
        <SeekerCard key={seeker.id} seeker={seeker} />
      ))}
    </div>
  )
}
