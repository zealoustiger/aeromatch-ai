import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Heart, Plane } from 'lucide-react'
import Link from 'next/link'
import PartnershipCard from '@/components/PartnershipCard'
import type { Partnership } from '@/lib/types'

export default async function SavedPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth?next=/saved')

  // Saved listing ids in save order (newest first). Only partnerships are
  // favoritable today; aircraft hearts are a future slice.
  const { data: savedRows } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_type', 'partnership')
    .order('created_at', { ascending: false })

  const savedIds = (savedRows ?? []).map((r) => r.listing_id as string)

  // Hydrate the actual listings. A saved row whose partnership is no longer
  // active simply drops out (the .in() returns only existing active rows).
  let listings: Partnership[] = []
  if (savedIds.length > 0) {
    const { data } = await supabase
      .from('partnerships')
      .select('*')
      .eq('status', 'active')
      .in('id', savedIds)
    const byId = new Map((data ?? []).map((p) => [p.id, p as Partnership]))
    listings = savedIds.map((id) => byId.get(id)).filter((p): p is Partnership => !!p)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Heart className="h-6 w-6 text-sky-600" />
          My Saved Listings
        </h1>
        <p className="mt-1 text-slate-500">
          Partnerships you've hearted — all in one place.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Heart className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-600">No saved listings yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Browse{' '}
            <Link href="/partnerships" className="text-sky-600 underline-offset-2 hover:underline">
              partnerships
            </Link>{' '}
            and tap the{' '}
            <Heart className="inline-block h-3.5 w-3.5 -translate-y-px text-sky-500" aria-hidden="true" />{' '}
            on any listing to save it here.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            {listings.length} saved {listings.length === 1 ? 'listing' : 'listings'}
          </p>
          <div className="space-y-4">
            {listings.map((p) => (
              <PartnershipCard key={p.id} p={p} saved />
            ))}
          </div>
          <p className="mt-8 flex items-center justify-center gap-1.5 text-sm text-slate-400">
            <Plane className="h-3.5 w-3.5" />
            Looking for more?{' '}
            <Link href="/partnerships" className="text-sky-600 underline-offset-2 hover:underline">
              Browse all partnerships
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
