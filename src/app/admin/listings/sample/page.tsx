import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import AircraftSaleCard from '@/components/AircraftSaleCard'
import type { AircraftForSale } from '@/lib/types'

export const metadata = { title: 'Listing sample', robots: { index: false } }
export const dynamic = 'force-dynamic'

const SAMPLE = 48

// Admin-only drill-down for the Photo coverage × grade table. Reuses the public
// marketplace card, but queries via the service-role client so it can show the
// HIDDEN (no-photo) buckets the public marketplace filters out by design.
export default async function ListingSamplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const source = sp.source ?? ''
  const grade = (sp.grade ?? '').toUpperCase()
  const photo = sp.photo ?? ''
  const admin = createAdminClient()

  // Same predicates the coverage table + marketplace use, so the sample matches
  // the counts exactly. quality_score bands: A≥78 / B≥50 / C<50.
  const apply = (q: any) => {
    if (source) q = q.eq('source', source)
    q = q.eq('status', 'active')
    if (grade === 'A') q = q.gte('quality_score', 78)
    else if (grade === 'B') q = q.gte('quality_score', 50).lt('quality_score', 78)
    else if (grade === 'C') q = q.lt('quality_score', 50)
    if (photo === 'hidden') q = q.eq('images', '[]')
    else if (photo === 'shown') q = q.not('images', 'eq', '[]')
    return q
  }

  const { count } = await apply(admin.from('aircraft_for_sale').select('id', { count: 'exact', head: true }))
  const { data } = await apply(admin.from('aircraft_for_sale').select('*'))
    .order('quality_score', { ascending: false })
    .order('first_seen_at', { ascending: false })
    .limit(SAMPLE)
  const rows = (data ?? []) as AircraftForSale[]

  const label = [
    source || 'all sources',
    grade ? `grade ${grade}` : 'all grades',
    photo === 'hidden' ? 'no photo (hidden)' : photo === 'shown' ? 'has photo (shown)' : 'all photo states',
  ].join('  ·  ')

  return (
    <div className="space-y-4">
      <Link href="/admin/listings" className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Review Listings
      </Link>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Listing sample</h2>
        <p className="mt-1 text-sm text-slate-500">
          {label} — showing {rows.length} of {(count ?? 0).toLocaleString()}.
        </p>
        {photo === 'hidden' && (
          <p className="mt-1 text-xs text-rose-600">
            These are hidden from the public marketplace because they have no photo. The cards below fall back to a make
            placeholder — that&apos;s what a real photo would replace.
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No active listings in this category.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((p) => (
            <AircraftSaleCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  )
}
