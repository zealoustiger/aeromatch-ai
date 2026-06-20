import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-admin'
import DraftCard from '@/components/DraftCard'

export const metadata = { title: 'Review Captures', robots: { index: false } }
export const dynamic = 'force-dynamic'

// Admin gate is enforced by src/app/admin/layout.tsx.
export default async function ReviewPage() {
  const admin = createAdminClient()
  const { data: drafts } = await admin
    .from('listing_drafts')
    .select('*')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  return (
    <section>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Review captured listings</h2>
          <p className="mt-1 text-sm text-slate-500">
            {drafts?.length ?? 0} draft{(drafts?.length ?? 0) === 1 ? '' : 's'} waiting. Confirm the
            parsed fields, then publish to go live.
          </p>
        </div>
        <Link href="/admin/quality" className="shrink-0 text-sm font-medium text-sky-600 hover:text-sky-700">
          Listing quality →
        </Link>
      </div>

      {!drafts || drafts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No drafts yet. Use the “Save to ClubHanger” bookmarklet on a Facebook post.
        </div>
      ) : (
        <div className="space-y-6">
          {drafts.map((d) => (
            <DraftCard key={d.id} draft={d} />
          ))}
        </div>
      )}
    </section>
  )
}
