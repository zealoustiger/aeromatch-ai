import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { Profile } from '@/lib/types'
import { setProfileVerification } from './actions'

export const metadata = { title: 'Verify pilots', robots: { index: false } }
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

async function loadProfiles(): Promise<{ profiles: Profile[]; tableMissing: boolean }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
    if (error) return { profiles: [], tableMissing: error.code === '42P01' }
    return { profiles: (data as Profile[]) ?? [], tableMissing: false }
  } catch {
    return { profiles: [], tableMissing: true }
  }
}

export default async function VerifyPilotsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: userData } = await supabase.auth.getUser()
  const email = userData.user?.email?.toLowerCase()
  const allowed = email && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email))

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Admin only</h1>
        <p className="mt-2 text-sm text-slate-500">
          {email ? 'This account is not an admin.' : 'Sign in with an admin account to verify pilots.'}
        </p>
        <Link href="/auth?next=/admin/verify" className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          Sign in
        </Link>
      </div>
    )
  }

  const { profiles, tableMissing } = await loadProfiles()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Verify pilots</h1>
      <p className="mt-1 text-sm text-slate-500">
        Grant the “Verified by ClubHanger” badge after manual review. Verification is admin-only and cannot be self-set.
      </p>

      {tableMissing ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          The <code>profiles</code> table doesn’t exist yet. Apply migration{' '}
          <code>supabase/migrations/0001_profiles_and_reviews.sql</code> to enable profiles and verification.
        </div>
      ) : profiles.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">No pilot profiles yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {profiles.map((p) => (
            <li key={p.user_id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/pilots/${p.user_id}`} className="font-semibold text-slate-900 hover:text-sky-700">
                  {p.display_name ?? 'Unnamed pilot'}
                </Link>
                <span className="text-xs text-slate-400">
                  {p.home_airport ?? '—'} · {p.ratings_held?.join(', ') || 'no ratings listed'}
                </span>
              </div>
              <form action={setProfileVerification} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="user_id" value={p.user_id} />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="verified" defaultChecked={p.verified} className="h-4 w-4 rounded border-slate-300" />
                  Verified
                </label>
                <label className="flex-1 text-sm text-slate-700">
                  Verified ratings <span className="text-xs text-slate-400">(comma-separated)</span>
                  <input
                    name="verified_ratings"
                    defaultValue={p.verified_ratings?.join(', ') ?? ''}
                    placeholder="PPL, IFR"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </label>
                <button type="submit" className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-700">
                  Save
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
