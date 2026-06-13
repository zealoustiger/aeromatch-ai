import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import DraftCard from '@/components/DraftCard'

export const metadata = { title: 'Review drafts', robots: { index: false } }
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export default async function ReviewPage() {
  const supabase = await createServerSupabaseClient()
  const { data: userData } = await supabase.auth.getUser()
  const email = userData.user?.email?.toLowerCase()

  const allowed = email && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email))

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Admin only</h1>
        <p className="mt-2 text-sm text-slate-500">
          {email ? 'This account is not an admin.' : 'Sign in with an admin account to review captured listings.'}
        </p>
        <Link
          href="/auth?next=/admin/review"
          className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const admin = createAdminClient()
  const { data: drafts } = await admin
    .from('listing_drafts')
    .select('*')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Review captured listings</h1>
        <p className="mt-1 text-sm text-slate-500">
          {drafts?.length ?? 0} draft{(drafts?.length ?? 0) === 1 ? '' : 's'} waiting. Confirm the
          parsed fields, then publish to go live.
        </p>
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
    </div>
  )
}
