import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, LogIn } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_NAME } from '@/lib/seo'
import { parseEditableAlertTarget } from '@/lib/alertEditCriteria'
import { getAlertMatchCount } from '@/lib/alertMatchCounts'
import { normalizeFrequency } from '@/lib/alertFrequency'
import { formatResumeDate } from '@/lib/alertSnooze'
import { getCrossSellSuggestion } from '@/lib/alertCrossSell'
import { getWatchedListingStatus } from '@/lib/alertWatchStatus'
import { formatPrice } from '@/lib/utils'
import AlertEditForm from '@/components/AlertEditForm'
import PriceDropToggle from '@/components/PriceDropToggle'
import FrequencyToggle from '@/components/FrequencyToggle'
import ManageAlertCrossSell from '@/components/ManageAlertCrossSell'
import NewAlertForm from '@/components/NewAlertForm'
import ManageLinkRequestForm from '@/components/ManageLinkRequestForm'
import AlertSubscriberMarker from '@/components/AlertSubscriberMarker'

// Private, per-user utility page — no SEO value.
export const metadata: Metadata = {
  title: { absolute: `Your alerts | ${SITE_NAME}` },
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
  frequency?: string
  paused_until?: string | null
}

const OPTIONAL_COLS = ['price_drop_opt_in', 'frequency', 'paused_until']

// Email-keyed, not user_id-keyed (alerts require no account). Anon/authenticated
// has no SELECT on this PII-holding table by design (see actions.ts), so this
// reads via the service-role client, scoped to the owning email — either the
// signed-in user's own, or the one resolved from a manage-link token below.
// A query failure still looks like "no rows" here, never a 500.
async function fetchAlertsForEmail(email: string): Promise<AlertRow[]> {
  const admin = createAdminClient()
  const baseCols = ['id', 'context', 'source_path', 'status', 'created_at', 'confirmed_at']
  let cols = [...baseCols, ...OPTIONAL_COLS]
  let { data, error } = (await admin
    .from('alerts')
    .select(cols.join(', '))
    .eq('email', email)
    .neq('status', 'unsubscribed')
    .order('created_at', { ascending: false })) as unknown as {
    data: AlertRow[] | null
    error: { message: string } | null
  }
  // Any subset of price_drop_opt_in/frequency/paused_until may not be
  // migrated live yet — retry without whichever column(s) the error names
  // (PostgREST reports one unknown column per error, so this can take up to
  // three passes) rather than losing the whole page (graceful fallback, same
  // pattern as profiles.favorite_airports); rows just render with those
  // toggles defaulted on/weekly/never-snoozed.
  for (let i = 0; i < OPTIONAL_COLS.length && error && OPTIONAL_COLS.some((c) => error!.message?.includes(c)); i++) {
    cols = cols.filter((c) => !error!.message.includes(c))
    ;({ data, error } = (await admin
      .from('alerts')
      .select(cols.join(', '))
      .eq('email', email)
      .neq('status', 'unsubscribed')
      .order('created_at', { ascending: false })) as unknown as {
      data: AlertRow[] | null
      error: { message: string } | null
    })
  }
  return data ?? []
}

type SearchParams = Record<string, string | string[] | undefined>

export default async function AlertsManagePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const rawToken = params.token
  const urlToken = Array.isArray(rawToken) ? rawToken[0] : rawToken

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Token-scoped path: a subscriber with no account, arriving from the digest
  // email's "Manage alerts" link. The token proves ownership of the one alert
  // it was minted for (its own `unsubscribe_token`) — resolving that alert's
  // email then unlocks every alert for the SAME email, the same trust boundary
  // the signed-in path below already uses (it also just filters by email, not
  // user_id). A signed-in session always wins so a stray `?token=` on a
  // signed-in visit is never forwarded to that visitor's own alert actions.
  let email = (user?.email ?? '').toLowerCase()
  let scopeToken: string | undefined
  let tokenInvalid = false
  if (!email && urlToken) {
    const admin = createAdminClient()
    const { data: anchor } = await admin
      .from('alerts')
      .select('email')
      .eq('unsubscribe_token', urlToken)
      .maybeSingle()
    if (anchor?.email) {
      email = anchor.email.toLowerCase()
      scopeToken = urlToken
    } else {
      tokenInvalid = true
    }
  }

  if (!email) {
    return (
      <div className="ch-surface min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <Bell className="h-7 w-7 text-sky-600" />
              Your alerts
            </h1>
            <p className="mt-1 text-slate-600">
              {tokenInvalid
                ? 'This link is no longer valid.'
                : 'Sign in to see every email alert subscription tied to your account.'}
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
            {!tokenInvalid && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm font-medium text-slate-600">
                  Set up alerts without an account? Get a link to manage them instead:
                </p>
                <ManageLinkRequestForm />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const alerts = await fetchAlertsForEmail(email)

  // Real, server-computed "how many listings match this alert right now" per
  // row (GOAL.md: helps a subscriber tell if their alert is well-scoped or
  // dead). Runs in parallel; a row whose source_path isn't a recognized shape
  // gets `null` back and renders no count line — never a fake 0.
  const matchCounts = await Promise.all(alerts.map((a) => getAlertMatchCount(a.source_path)))

  // A "watch this listing" alert (source_path `/aircraft/listing/<id>?watch=price`)
  // gets no match count above (a family count doesn't apply to it) — resolve what
  // it's actually watching instead. `null` for every other alert shape.
  const watchStatuses = await Promise.all(alerts.map((a) => getWatchedListingStatus(a.source_path)))

  // Cross-sell (see ManageAlertCrossSell.tsx / GOAL.md's "digest → manage → grow
  // loop"): try each confirmed alert's source_path (most recent first) until one
  // yields a suggestion the visitor doesn't already have — never a duplicate or
  // forced suggestion. At most one box for the whole page.
  const existingPaths = new Set(alerts.map((a) => a.source_path).filter(Boolean))
  let crossSell = null as Awaited<ReturnType<typeof getCrossSellSuggestion>>
  for (const a of alerts) {
    if (a.status !== 'confirmed') continue
    const suggestion = await getCrossSellSuggestion(a.source_path)
    if (suggestion && !existingPaths.has(suggestion.sourcePath)) {
      crossSell = suggestion
      break
    }
  }

  return (
    <div className="ch-surface min-h-screen">
      {/* Owner resolved (session or valid token) — mark this browser a subscriber
          so the nav's "Get alerts" CTA becomes "My alerts". Boolean flag only. */}
      <AlertSubscriberMarker />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <Bell className="h-7 w-7 text-sky-600" />
            Your alerts
          </h1>
          <p className="mt-1 text-slate-600">
            Every new-listing alert subscribed with <strong>{email}</strong>.
          </p>
        </div>

        <section className="ch-panel p-6">
          <NewAlertForm token={scopeToken} />
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
              {alerts.map((a, i) => {
                const target = parseEditableAlertTarget(a.source_path)
                const match = matchCounts[i]
                const watch = watchStatuses[i]
                const resumeDate = a.status === 'paused' ? formatResumeDate(a.paused_until ?? null) : null
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
                            ? resumeDate
                              ? `Paused until ${resumeDate}`
                              : 'Paused'
                            : a.confirmed_at
                              ? 'Active'
                              : 'Pending confirmation'}
                        </span>
                        {/* Price-drop matching only exists for aircraft-for-sale
                            alerts (see alert-digest's countRecentAircraftPriceDrops) —
                            partnerships/seekers get no toggle. */}
                        {target?.type === 'aircraft' ? (
                          <PriceDropToggle id={a.id} enabled={a.price_drop_opt_in ?? true} token={scopeToken} />
                        ) : null}
                        <FrequencyToggle id={a.id} frequency={normalizeFrequency(a.frequency)} token={scopeToken} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Subscribed {new Date(a.created_at).toLocaleDateString()}
                        {watch ? (
                          <>
                            {' · '}
                            {watch.active ? (
                              <span className="text-slate-500">
                                Watching: {watch.label} — {formatPrice(watch.price)} today ·{' '}
                                <Link
                                  href={`/aircraft/listing/${watch.id}`}
                                  className="text-sky-600 underline-offset-2 hover:underline"
                                >
                                  View listing
                                </Link>
                              </span>
                            ) : (
                              <span className="text-amber-600">No longer for sale — this watch is done</span>
                            )}
                          </>
                        ) : match ? (
                          <>
                            {' · '}
                            <span className={match.count > 0 ? 'text-slate-500' : 'text-amber-600'}>
                              {match.count} {match.noun}
                              {match.count === 1 ? '' : 's'} match{match.count === 1 ? 'es' : ''} right
                              now
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <AlertEditForm
                      id={a.id}
                      status={a.status}
                      sourcePath={a.source_path}
                      target={target}
                      token={scopeToken}
                    />
                  </li>
                )
              })}
            </ul>
          )}
          {crossSell && <ManageAlertCrossSell token={scopeToken} suggestion={crossSell} />}
        </section>
      </div>
    </div>
  )
}
