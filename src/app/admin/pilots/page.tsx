import Link from 'next/link'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import { setPilotVerified } from './actions'

export const metadata = { title: 'Verify Pilots', robots: { index: false } }
export const dynamic = 'force-dynamic'

interface ProfileRow {
  user_id: string
  display_name: string | null
  home_airport: string | null
  ratings_held: string[] | null
  verified: boolean
  created_at: string | null
}

// Admin gate is enforced by src/app/admin/layout.tsx.
export default async function VerifyPilotsPage() {
  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id, display_name, home_airport, ratings_held, verified, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = (profiles ?? []) as ProfileRow[]

  const emails = await Promise.all(
    rows.map(async (p) => {
      const { data } = await admin.auth.admin.getUserById(p.user_id)
      return data.user?.email ?? null
    })
  )

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Verify pilots</h2>
        <p className="mt-1 text-sm text-slate-500">
          {rows.length} pilot profile{rows.length === 1 ? '' : 's'} (most recent {rows.length < 100 ? 'all' : '100'}).
          Verifying grants the public "Verified" badge on{' '}
          <Link href="/pilots" className="text-sky-600 hover:text-sky-700">
            /pilots/[id]
          </Link>
          .
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No pilot profiles yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Pilot</th>
                <th className="px-4 py-3">Home airport</th>
                <th className="px-4 py-3">Ratings</th>
                <th className="px-4 py-3">Member since</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p, i) => (
                <tr key={p.user_id}>
                  <td className="px-4 py-3">
                    <Link href={`/pilots/${p.user_id}`} className="font-medium text-slate-900 hover:text-sky-600">
                      {p.display_name || 'Unnamed pilot'}
                    </Link>
                    <div className="text-xs text-slate-400">{emails[i] ?? p.user_id}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.home_airport || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.ratings_held && p.ratings_held.length > 0 ? p.ratings_held.join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                        <ShieldOff className="h-3.5 w-3.5" />
                        Not verified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={setPilotVerified}>
                      <input type="hidden" name="user_id" value={p.user_id} />
                      <input type="hidden" name="verified" value={p.verified ? 'false' : 'true'} />
                      <button
                        type="submit"
                        className={`rounded-md px-2 py-1 text-xs font-medium ring-1 transition-colors ${
                          p.verified
                            ? 'text-rose-600 ring-rose-200 hover:bg-rose-50'
                            : 'text-emerald-700 ring-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {p.verified ? 'Unverify' : 'Verify'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
