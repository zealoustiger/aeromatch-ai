import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, LogIn } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { fetchAlertsForEmail } from '@/lib/alertsForOwner'
import { getAircraftFacets } from '@/lib/aircraft-facets'
import { SITE_NAME } from '@/lib/seo'
import {
  parseEditableAlertTarget,
  computeWidenCandidate,
  buildAlertCriteriaUpdate,
  getHiddenCriteria,
} from '@/lib/alertEditCriteria'
import { getAlertMatchCount, getNarrowSuggestions } from '@/lib/alertMatchCounts'
import { detectOverlappingAlerts } from '@/lib/alertOverlap'
import { describeLastDigest, normalizeFrequency } from '@/lib/alertFrequency'
import { formatResumeDate } from '@/lib/alertSnooze'
import { getCrossSellSuggestion } from '@/lib/alertCrossSell'
import { getWatchedListingStatus } from '@/lib/alertWatchStatus'
import { formatPrice } from '@/lib/utils'
import AlertEditForm from '@/components/AlertEditForm'
import ShareAlertButton from '@/components/ShareAlertButton'
import WidenAlertNudge, { type WidenSuggestion } from '@/components/WidenAlertNudge'
import NarrowAlertNudge from '@/components/NarrowAlertNudge'
import OverlapAlertNudge from '@/components/OverlapAlertNudge'
import AlertModeToggle from '@/components/AlertModeToggle'
import FrequencyToggle from '@/components/FrequencyToggle'
import InstantInterestNudge from '@/components/InstantInterestNudge'
import TargetPriceEdit from '@/components/TargetPriceEdit'
import ManageAlertCrossSell from '@/components/ManageAlertCrossSell'
import NewAlertForm from '@/components/NewAlertForm'
import ManageLinkRequestForm from '@/components/ManageLinkRequestForm'
import AlertSubscriberMarker from '@/components/AlertSubscriberMarker'
import VacationModeControl from '@/components/VacationModeControl'
import UpdateAlertEmailForm from '@/components/UpdateAlertEmailForm'
import DeleteAllAlertsControl from '@/components/DeleteAllAlertsControl'
import DownloadAlertDataLink from '@/components/DownloadAlertDataLink'

// Private, per-user utility page — no SEO value.
export const metadata: Metadata = {
  title: { absolute: `Your alerts | ${SITE_NAME}` },
  description: 'See every email alert subscription tied to your account.',
  robots: { index: false, follow: false },
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
  const rawEdit = params.edit
  const editId = Array.isArray(rawEdit) ? rawEdit[0] : rawEdit
  const rawDeleted = params.deleted
  const deletedCountParam = Array.isArray(rawDeleted) ? rawDeleted[0] : rawDeleted

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

  // The "delete all my alerts" flow (DeleteAllAlertsControl) redirects here
  // with `?deleted=N` for a token-scoped visitor — deleting every row for
  // that email also deletes the one row the token itself was minted from, so
  // it can no longer resolve an email below. Without this branch that would
  // fall straight into the generic "this link is no longer valid" / sign-in
  // wall right after a deliberate, successful deletion — technically
  // accurate but a confusing, unearned dead end. Shown regardless of
  // `tokenInvalid`/session state so it also covers the (currently unused)
  // case of a signed-in visitor landing here with the same param.
  if (deletedCountParam) {
    const deletedCount = Number(deletedCountParam) || 0
    return (
      <div className="ch-surface min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <Bell className="h-7 w-7 text-sky-600" />
              Your alerts
            </h1>
            <p className="mt-1 text-slate-600">
              Deleted {deletedCount} alert{deletedCount === 1 ? '' : 's'}. Nothing else is stored for you on
              ClubHanger.
            </p>
          </div>
          <div className="ch-panel p-6">
            <p className="text-sm leading-relaxed text-slate-600">
              You can set up a new alert anytime — no account needed.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/aircraft"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
              >
                Browse aircraft for sale
              </Link>
              <Link
                href="/partnerships"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Browse partnerships
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
  // For the aircraft Model chip picker in AlertEditForm (browse-filter parity) —
  // one read-time aggregation, reused across every row's edit form.
  const aircraftFacets = await getAircraftFacets()
  const activeAlertCount = alerts.filter((a) => a.status === 'confirmed').length
  const pausedAlertCount = alerts.filter((a) => a.status === 'paused').length
  // Every row an owner requests a change for is stamped with the same
  // pending_email — any one of them is enough to show the banner.
  const pendingEmailChange = alerts.find((a) => a.pending_email)?.pending_email ?? null

  // Real, server-computed "how many listings match this alert right now" per
  // row (GOAL.md: helps a subscriber tell if their alert is well-scoped or
  // dead). Runs in parallel; a row whose source_path isn't a recognized shape
  // gets `null` back and renders no count line — never a fake 0.
  const matchCounts = await Promise.all(alerts.map((a) => getAlertMatchCount(a.source_path)))

  // A "watch this listing" alert (source_path `/aircraft/listing/<id>?watch=price`)
  // gets no match count above (a family count doesn't apply to it) — resolve what
  // it's actually watching instead. `null` for every other alert shape.
  const watchStatuses = await Promise.all(alerts.map((a) => getWatchedListingStatus(a.source_path)))

  // Computed once, reused by both the Edit form below and the overlap check
  // (a confirmed alert whose criteria are a strict, exact subset of another
  // confirmed alert's — GOAL.md: a combined digest repeating the same
  // listings across two sections reads as spam). Any alert with a hidden
  // (non-form-exposed) criterion is excluded from the overlap comparison
  // entirely — see alertOverlap.ts's header comment.
  const editTargets = alerts.map((a) => parseEditableAlertTarget(a.source_path))
  const overlaps = detectOverlappingAlerts(
    alerts.map((a, i) => ({
      id: a.id,
      status: a.status,
      context: a.context,
      target: editTargets[i],
      hasHiddenCriteria: editTargets[i] ? getHiddenCriteria(editTargets[i]!.type, a.source_path).length > 0 : true,
    }))
  )

  // A confirmed, editable alert matching 0 live listings right now is silently
  // dead (GOAL.md: "widen it" nudge). Pick the single least-destructive
  // loosening (drop model → make-wide, else clear state/airport) and
  // RE-VERIFY it against a real count before ever suggesting it — never a
  // fabricated "this will help" (honesty gate). `null` renders the honest
  // "nothing close yet" fallback instead of a fake fix.
  const widenSuggestions: (WidenSuggestion | null)[] = await Promise.all(
    alerts.map(async (a, i): Promise<WidenSuggestion | null> => {
      if (a.status !== 'confirmed') return null
      const match = matchCounts[i]
      if (!match || match.count > 0) return null
      const target = parseEditableAlertTarget(a.source_path)
      if (!target) return null
      const candidate = computeWidenCandidate(target)
      if (!candidate) return null
      const { sourcePath: widenedPath } = buildAlertCriteriaUpdate(target.type, a.source_path, candidate.fields)
      const widenedMatch = await getAlertMatchCount(widenedPath)
      if (!widenedMatch || widenedMatch.count <= 0) return null
      return { fields: candidate.fields, description: candidate.description, count: widenedMatch.count, noun: widenedMatch.noun }
    })
  )

  // The honest inverse: a confirmed alert already matching a LOT of live
  // listings right now (GOAL.md: never-spam cuts both ways — a make-only or
  // nationwide alert's digest reads as spam just as much as a dead alert's
  // silence does). `getNarrowSuggestions` short-circuits to `[]` below its
  // own volume threshold, so this is cheap for the common (non-high-volume)
  // row on this marketplace's current inventory.
  const narrowSuggestions = await Promise.all(
    alerts.map((a, i) => {
      if (a.status !== 'confirmed') return Promise.resolve([])
      const match = matchCounts[i]
      if (!match) return Promise.resolve([])
      return getNarrowSuggestions(a.source_path, match.count)
    })
  )

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
          <UpdateAlertEmailForm token={scopeToken} pendingEmail={pendingEmailChange} />
        </div>

        <section className="ch-panel p-6">
          <NewAlertForm token={scopeToken} />
          {alerts.length >= 2 ? (
            <VacationModeControl
              token={scopeToken}
              activeCount={activeAlertCount}
              pausedCount={pausedAlertCount}
            />
          ) : null}
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
                const target = editTargets[i]
                const match = matchCounts[i]
                const watch = watchStatuses[i]
                const resumeDate = a.status === 'paused' ? formatResumeDate(a.paused_until ?? null) : null
                // Structural eligibility (not count-dependent) — keeps
                // WidenAlertNudge mounted at a stable tree position across the
                // count going from 0 to >0 after a successful widen, so its
                // local "just widened" confirmation survives the server
                // refresh instead of vanishing the instant the row is no
                // longer dead (see WidenAlertNudge.tsx).
                const widenEligible = a.status === 'confirmed' && !watch && !!target
                const isDead = !!match && match.count === 0
                // Mutually exclusive with the widen nudge — a dead alert gets
                // "widen this," not "remove this" (the more useful action for
                // a 0-match alert is broadening it, not deleting it).
                const overlap = !isDead ? overlaps.get(a.id) : undefined
                return (
                  <li
                    key={a.id}
                    id={`alert-${a.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 scroll-mt-24"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">
                          {a.context || 'New listings'}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.status === 'bounced'
                              ? 'bg-red-50 text-red-700'
                              : a.status === 'paused'
                                ? 'bg-slate-100 text-slate-600'
                                : a.confirmed_at
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {a.status === 'bounced'
                            ? 'Bounced'
                            : a.status === 'paused'
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
                          <AlertModeToggle
                            id={a.id}
                            priceDropOptIn={a.price_drop_opt_in ?? true}
                            newListingOptOut={a.new_listing_opt_out ?? false}
                            token={scopeToken}
                          />
                        ) : null}
                        <FrequencyToggle id={a.id} frequency={normalizeFrequency(a.frequency)} token={scopeToken} />
                        <InstantInterestNudge id={a.id} token={scopeToken} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Subscribed {new Date(a.created_at).toLocaleDateString()}
                        {watch ? (
                          <>
                            {' · '}
                            {watch.active ? (
                              <span className="text-slate-500">
                                Watching: {watch.label} — {formatPrice(watch.price)}{' '}
                                {watch.type === 'partnership' ? 'buy-in ' : ''}today
                                {a.target_price ? ` (watching for ≤ ${formatPrice(a.target_price)})` : ''} ·{' '}
                                <Link
                                  href={
                                    watch.type === 'partnership'
                                      ? `/partnerships/${watch.id}`
                                      : `/aircraft/listing/${watch.id}`
                                  }
                                  className="text-sky-600 underline-offset-2 hover:underline"
                                >
                                  View listing
                                </Link>
                              </span>
                            ) : (
                              <span className="text-amber-600">
                                {watch.type === 'partnership'
                                  ? 'No longer available — this watch is done'
                                  : 'No longer for sale — this watch is done'}
                              </span>
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
                      {watch && watch.active ? (
                        <div className="mt-1">
                          <TargetPriceEdit id={a.id} targetPrice={a.target_price} token={scopeToken} />
                        </div>
                      ) : null}
                      {a.status === 'bounced' ? (
                        <p className="mt-0.5 text-xs text-red-600">
                          Your email bounced — resume once it&apos;s fixed.
                        </p>
                      ) : null}
                      {widenEligible ? (
                        <WidenAlertNudge id={a.id} token={scopeToken} dead={isDead} suggestion={widenSuggestions[i]} />
                      ) : null}
                      {!isDead ? (
                        <NarrowAlertNudge id={a.id} token={scopeToken} suggestions={narrowSuggestions[i]} />
                      ) : null}
                      {overlap ? (
                        <OverlapAlertNudge id={a.id} token={scopeToken} broaderContext={overlap.broaderContext} />
                      ) : null}
                      {/* Cron only digests status='confirmed' alerts (see
                          alert-digest/route.ts) — showing a "checks daily/
                          weekly" cadence for a pending or paused row would
                          claim a schedule that isn't actually running. */}
                      {a.status === 'confirmed' ? (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {describeLastDigest(a.last_digest_at, normalizeFrequency(a.frequency))}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <ShareAlertButton sourcePath={a.source_path} />
                      <AlertEditForm
                        id={a.id}
                        status={a.status}
                        sourcePath={a.source_path}
                        target={target}
                        frequency={a.frequency}
                        priceDropOptIn={a.price_drop_opt_in}
                        newListingOptOut={a.new_listing_opt_out}
                        token={scopeToken}
                        autoOpen={!!editId && editId === a.id}
                        facets={aircraftFacets}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {crossSell && <ManageAlertCrossSell token={scopeToken} suggestion={crossSell} />}
          {alerts.length > 0 && (
            <div className="mt-6 flex justify-end">
              <DownloadAlertDataLink token={scopeToken} count={alerts.length} />
            </div>
          )}
          <DeleteAllAlertsControl token={scopeToken} email={email} count={alerts.length} />
        </section>
      </div>
    </div>
  )
}
