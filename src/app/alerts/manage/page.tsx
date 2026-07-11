import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, LogIn } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_NAME } from '@/lib/seo'
import { parseEditableAlertTarget } from '@/lib/alertEditCriteria'
import AlertEditForm from '@/components/AlertEditForm'
import PriceDropToggle from '@/components/PriceDropToggle'

// Private, per-user utility page — no SEO value.
export const metadata: Metadata = {
  title: `Your alerts | ${SITE_NAME}`,
  description: 'See every email alert subscription tied to your account.',
  robots: { index: false, follow: false },
}

interface AlertRow {
  id: string
  context: string | null
  source_path: string | null
  status: string
  created_at: string
  confirmed_at: string | null
  price_drop_opt_in?: boolean
}

export default async function AlertsManagePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="ch-surface min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <Bell className="h-7 w-7 text-sky-600" />
              Your alerts
            </h1>
            <p className="mt-1 text-slate-600">
              Sign in to see every email alert subscription tied to your account.
            </p>
          </div>
          <div className="ch-panel p-6">
            <p className="text-sm leading-relaxed text-slate-600">
              You can set up alerts anywhere on ClubHanger without an account — this page
              just lets you see and manage them once you&apos;re signed in with the same
              email address.
            </p>
            <div className="mt-5">
              <Link
                href="/auth?next=/alerts/manage"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
              >
                <LogIn className="h-4 w-4" />
                Sign in or create a free account
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Email-keyed, not user_id-keyed (alerts require no account). Anon/authenticated
  // has no SELECT on this PII-holding table by design (see actions.ts), so this
  // reads via the service-role client, scoped to the signed-in user's own email —
  // the same ownership-by-email pattern the pause/resume/delete actions use.
  // A query failure still looks like "no rows" here, never a 500.
  const email = (user.email ?? '').toLowerCase()
  let alerts: AlertRow[] = []
  if (email) {
    const admin = createAdminClient()
    let { data, error }: { data: AlertRow[] | null; error: { message: string } | null } = await admin
      .from('alerts')
      .select('id, context, source_path, status, created_at, confirmed_at, price_drop_opt_in')
      .eq('email', email)
      .neq('status', 'unsubscribed')
      .order('created_at', { ascending: false })
    // Not-yet-migrated DB (`price_drop_opt_in` column missing) — retry without it
    // rather than losing the whole page (graceful fallback, same pattern as
    // profiles.favorite_airports); rows just render with the toggle defaulted on.
    if (error?.message?.includes('price_drop_opt_in')) {
      ;({ data, error } = await admin
        .from('alerts')
        .select('id, context, source_path, status, created_at, confirmed_at')
        .eq('email', email)
        .neq('status', 'unsubscribed')
        .order('created_at', { ascending: false }))
    }
    alerts = data ?? []
  }

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <Bell className="h-7 w-7 text-sky-600" />
            Your alerts
          </h1>
          <p className="mt-1 text-slate-600">
            Every new-listing alert subscribed with <strong>{user.email}</strong>.
          </p>
        </div>

        <section className="ch-panel p-6">
          {alerts.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 px-5 py-8 text-center">
              <Bell className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="font-medium text-slate-600">No alerts yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Look for &ldquo;Get alerts&rdquo; on{' '}
                <Link href="/aircraft" className="text-sky-600 underline-offset-2 hover:underline">
                  planes for sale
                </Link>
                ,{' '}
                <Link href="/partnerships" className="text-sky-600 underline-offset-2 hover:underline">
                  partnerships
                </Link>{' '}
                or{' '}
                <Link href="/partnerships/seeking" className="text-sky-600 underline-offset-2 hover:underline">
                  pilots seeking a partnership
                </Link>{' '}
                — one email field, no extra account needed.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => {
                const target = parseEditableAlertTarget(a.source_path)
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">
                          {a.context || 'New listings'}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.status === 'paused'
                              ? 'bg-slate-100 text-slate-600'
                              : a.confirmed_at
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {a.status === 'paused'
                            ? 'Paused'
                            : a.confirmed_at
                              ? 'Active'
                              : 'Pending confirmation'}
                        </span>
                        {/* Price-drop matching only exists for aircraft-for-sale
                            alerts (see alert-digest's countRecentAircraftPriceDrops) —
                            partnerships/seekers get no toggle. */}
                        {target?.type === 'aircraft' ? (
                          <PriceDropToggle id={a.id} enabled={a.price_drop_opt_in ?? true} />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Subscribed {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <AlertEditForm
                      id={a.id}
                      status={a.status}
                      sourcePath={a.source_path}
                      target={target}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
