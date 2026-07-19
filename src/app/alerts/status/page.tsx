import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, BellOff, AlertCircle, MailOpen, Moon, ThumbsUp, ThumbsDown } from 'lucide-react'
import UnsubscribeRecover from '@/components/UnsubscribeRecover'
import AlertCrossSell from '@/components/AlertCrossSell'
import AlertStatusTracker from '@/components/AlertStatusTracker'
import SnoozeUndo from '@/components/SnoozeUndo'
import { getCrossSellSuggestion } from '@/lib/alertCrossSell'
import { createAdminClient } from '@/lib/supabase-admin'
import { normalizeFrequency, type AlertFrequency } from '@/lib/alertFrequency'
import { formatResumeDate } from '@/lib/alertSnooze'
import { getAlertMatchCount } from '@/lib/alertMatchCounts'
import { isListingWatchPath } from '@/lib/alertWatchStatus'
import { parseAlertTokens } from '@/lib/alertTokenList'

// Landing page for the double-opt-in confirm / unsubscribe routes. Utility page,
// NOT an SEO surface — keep it out of the index and the sitemap.
export const metadata: Metadata = {
  title: 'Alert preferences',
  description: 'Manage your ClubHanger new-listing alert preferences.',
  robots: { index: false, follow: false },
}

type SearchParams = Record<string, string | string[] | undefined>

const STATES = {
  confirmed: {
    icon: CheckCircle2,
    tint: 'text-emerald-600',
    ring: 'bg-emerald-50',
    title: "You're all set",
    body: "Your email is confirmed. We'll send you an alert whenever a new aircraft that matches lands on ClubHanger — and nothing else.",
  },
  unsubscribed: {
    icon: BellOff,
    tint: 'text-slate-500',
    ring: 'bg-slate-100',
    title: 'You have been unsubscribed',
    body: "You won't receive any more alert emails for this subscription. You can sign up again anytime from any aircraft page.",
  },
  weekly: {
    icon: MailOpen,
    tint: 'text-emerald-600',
    ring: 'bg-emerald-50',
    title: "You're on weekly emails now",
    body: "This alert will email you at most once a week instead of daily — same matches, fewer emails. You're still subscribed, nothing else changed.",
  },
  daily: {
    icon: MailOpen,
    tint: 'text-emerald-600',
    ring: 'bg-emerald-50',
    title: "You're on daily emails now",
    body: "This alert will check for new matches once a day instead of once a week — same alert, sooner. You're still subscribed, nothing else changed.",
  },
  monthly: {
    icon: MailOpen,
    tint: 'text-emerald-600',
    ring: 'bg-emerald-50',
    title: "You're on monthly emails now",
    body: "This alert will email you at most once a month instead of weekly — far less often, same matches. You're still subscribed, nothing else changed.",
  },
  fewer: {
    icon: MailOpen,
    tint: 'text-emerald-600',
    ring: 'bg-emerald-50',
    title: "You're on fewer emails now",
    body: "Every alert covered by this link just stepped down to a lighter cadence — same matches, less often. You're still subscribed, nothing else changed.",
  },
  snoozed: {
    icon: Moon,
    tint: 'text-emerald-600',
    ring: 'bg-emerald-50',
    title: "You're snoozed for 30 days",
    body: "This alert is paused for 30 days — we'll pick back up automatically, no need to come back and resume it yourself.",
  },
  invalid: {
    icon: AlertCircle,
    tint: 'text-amber-600',
    ring: 'bg-amber-50',
    title: 'This link is no longer valid',
    body: "That confirmation or unsubscribe link has expired or was already used. If you meant to manage alerts, you can sign up again from any aircraft page.",
  },
  cross_sell_added: {
    icon: CheckCircle2,
    tint: 'text-emerald-600',
    ring: 'bg-emerald-50',
    title: "You're all set",
    body: "You're now also getting alerts for that too — no extra sign-up needed.",
  },
  email_changed: {
    icon: CheckCircle2,
    tint: 'text-emerald-600',
    ring: 'bg-emerald-50',
    title: 'Your alerts email is updated',
    body: 'All of your ClubHanger alerts now go to the new address.',
  },
  digest_feedback_up: {
    icon: ThumbsUp,
    tint: 'text-emerald-600',
    ring: 'bg-emerald-50',
    title: 'Thanks for the feedback!',
    body: "Glad that digest was useful — we'll keep sending real matches, nothing else.",
  },
  digest_feedback_down: {
    icon: ThumbsDown,
    tint: 'text-amber-600',
    ring: 'bg-amber-50',
    title: "Thanks — we'll do better",
    body: 'Sorry that digest missed the mark. You can switch to fewer emails, pause, or fine-tune exactly what you get anytime.',
  },
  digest_listing_feedback: {
    icon: ThumbsDown,
    tint: 'text-amber-600',
    ring: 'bg-amber-50',
    title: 'Thanks — noted!',
    body: "We'll factor that into what shows up in your future alert emails.",
  },
} as const

type StateKey = keyof typeof STATES

function resolveState(raw: string | string[] | undefined): StateKey {
  const v = Array.isArray(raw) ? raw[0] : raw
  return v === 'confirmed' ||
    v === 'unsubscribed' ||
    v === 'weekly' ||
    v === 'daily' ||
    v === 'monthly' ||
    v === 'fewer' ||
    v === 'snoozed' ||
    v === 'cross_sell_added' ||
    v === 'email_changed' ||
    v === 'digest_feedback_up' ||
    v === 'digest_feedback_down' ||
    v === 'digest_listing_feedback'
    ? v
    : 'invalid'
}

export default async function AlertStatusPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const key = resolveState(params.state)
  const { icon: Icon, tint, ring, title, body } = STATES[key]
  const rawToken = params.token
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken
  const rawContext = params.context
  const crossSellContext = Array.isArray(rawContext) ? rawContext[0] : rawContext
  const rawCrossSellSource = params.source
  const crossSellSource = Array.isArray(rawCrossSellSource) ? rawCrossSellSource[0] : rawCrossSellSource
  const rawNewEmail = params.newEmail
  const emailChangedTo = Array.isArray(rawNewEmail) ? rawNewEmail[0] : rawNewEmail

  // Post-confirmation cross-sell: look up the just-confirmed alert's source_path
  // (admin client — anon has no SELECT on `alerts`, it holds PII) and offer a
  // one-click counterpart suggestion (aircraft ↔ partnerships for the same make).
  // Never shown outside the confirmed state; null when no suggestion applies.
  // Also grabs unsubscribe_token here — that's the token `/alerts/manage`
  // authenticates with, distinct from the `confirm_token` this page's own
  // `token` param carries.
  let crossSell = null as Awaited<ReturnType<typeof getCrossSellSuggestion>>
  let manageToken: string | null = null
  let confirmedBody: string | null = null
  let confirmedSourcePath: string | null = null
  let confirmedMatchCount: Awaited<ReturnType<typeof getAlertMatchCount>> = null
  if (key === 'confirmed' && token) {
    const admin = createAdminClient()
    let cols = ['source_path', 'unsubscribe_token', 'frequency']
    let { data, error } = (await admin
      .from('alerts')
      .select(cols.join(', '))
      .eq('confirm_token', token)
      .eq('status', 'confirmed')
      .maybeSingle()) as unknown as {
      data: { source_path: string | null; unsubscribe_token: string | null; frequency?: string } | null
      error: { message: string } | null
    }
    // `frequency` may not be migrated live yet — same graceful-degrade retry
    // precedent as `/alerts/manage`'s fetchAlertsForEmail.
    if (error?.message?.includes('frequency')) {
      cols = cols.filter((c) => c !== 'frequency')
      ;({ data, error } = (await admin
        .from('alerts')
        .select(cols.join(', '))
        .eq('confirm_token', token)
        .eq('status', 'confirmed')
        .maybeSingle()) as unknown as {
        data: { source_path: string | null; unsubscribe_token: string | null } | null
        error: { message: string } | null
      })
    }
    crossSell = await getCrossSellSuggestion(data?.source_path ?? null)
    manageToken = data?.unsubscribe_token ?? null
    confirmedSourcePath = data?.source_path ?? null

    // "What happens next": name the alert's real cadence + live match count
    // instead of the generic static copy, when the data's genuinely available.
    if (data?.source_path) {
      const cadence = normalizeFrequency((data as { frequency?: string }).frequency)
      const match = await getAlertMatchCount(data.source_path)
      confirmedMatchCount = match
      const cadenceLabel = cadence === 'daily' ? 'a daily digest' : cadence === 'monthly' ? 'a monthly digest' : 'a weekly digest'
      let sentence = `You're confirmed — we'll send ${cadenceLabel} whenever there's a new match, and nothing else.`
      if (match) {
        const nounLabel = match.noun === 'pilot' ? (match.count === 1 ? 'pilot matches' : 'pilots match') : (match.count === 1 ? 'listing matches' : 'listings match')
        sentence += match.count > 0
          ? ` ${match.count} ${nounLabel} right now — you'll hear about the next one too.`
          : ` None match right now — you'll be first to know when one does.`
      }
      confirmedBody = sentence
    }
  }

  // The recovery box's "Switch to weekly instead" option only makes sense if AT
  // LEAST ONE covered alert was firing daily — for a weekly (or not-yet-migrated)
  // alert, the resulting cadence would be identical to what it already was.
  // Same logic for "Switch to monthly instead": only offered if at least one
  // covered alert isn't already monthly. `token` is the same value the
  // unsubscribe link forwards here — usually one alert's `unsubscribe_token`,
  // but a combined-digest unsubscribe forwards every covered alert's token
  // comma-separated, so this looks up ALL of them (not just one) to compute an
  // honest recovery-box count + cadence.
  let unsubFrequency: AlertFrequency = 'weekly'
  let unsubHasNonMonthly = false
  let unsubSourcePath: string | null = null
  let unsubCount = 0
  if (key === 'unsubscribed' && token) {
    const tokens = parseAlertTokens(token)
    const admin = createAdminClient()
    let cols = ['frequency', 'source_path']
    let { data, error } = (await admin
      .from('alerts')
      .select(cols.join(', '))
      .in('unsubscribe_token', tokens)) as unknown as {
      data: { frequency?: string; source_path: string | null }[] | null
      error: { message: string } | null
    }
    // `frequency` may not be migrated live yet — same graceful-degrade retry
    // precedent as the `confirmed` branch above / `/alerts/manage`'s fetchAlertsForEmail.
    if (error?.message?.includes('frequency')) {
      cols = cols.filter((c) => c !== 'frequency')
      ;({ data, error } = (await admin
        .from('alerts')
        .select(cols.join(', '))
        .in('unsubscribe_token', tokens)) as unknown as {
        data: { frequency?: string; source_path: string | null }[] | null
        error: { message: string } | null
      })
    }
    if (!error && data) {
      unsubCount = data.length
      unsubFrequency = data.some((row) => normalizeFrequency(row.frequency) === 'daily') ? 'daily' : 'weekly'
      unsubHasNonMonthly = data.some((row) => normalizeFrequency(row.frequency) !== 'monthly')
      unsubSourcePath = data[0]?.source_path ?? null
    }
  }

  // Real resume date for the "snoozed" landing state — never fabricate one.
  // `token` may cover several alerts (a combined-digest snooze link); they're
  // all snoozed together by the same click, so any one row's `paused_until`
  // is representative. `paused_until` may not be migrated live yet, in which
  // case this stays null and the generic STATES.snoozed copy is used instead.
  let snoozeResumeDate: string | null = null
  if (key === 'snoozed' && token) {
    const tokens = parseAlertTokens(token)
    const admin = createAdminClient()
    const { data, error } = (await admin
      .from('alerts')
      .select('paused_until')
      .in('unsubscribe_token', tokens)
      .limit(1)
      .maybeSingle()) as unknown as { data: { paused_until: string | null } | null; error: { message: string } | null }
    if (!error && data) snoozeResumeDate = formatResumeDate(data.paused_until)
  }

  return (
    <div className="ch-surface min-h-screen">
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="ch-panel w-full px-6 py-10 sm:px-10">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${ring}`}>
            <Icon className={`h-8 w-8 ${tint}`} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            {key === 'cross_sell_added' && crossSellContext
              ? `You're now also getting alerts for ${crossSellContext} — no extra sign-up needed.`
              : key === 'email_changed' && emailChangedTo
                ? `All of your ClubHanger alerts now go to ${emailChangedTo}.`
                : key === 'snoozed' && snoozeResumeDate
                  ? `This alert is paused until ${snoozeResumeDate} — we'll pick back up automatically then, no need to come back and resume it yourself.`
                  : confirmedBody ?? body}
          </p>
          {key === 'confirmed' && confirmedSourcePath && confirmedMatchCount && confirmedMatchCount.count > 0 && (
            <p className="mt-2">
              <Link href={confirmedSourcePath} className="font-medium text-sky-600 hover:text-sky-700">
                See the {confirmedMatchCount.count}{' '}
                {confirmedMatchCount.noun === 'pilot'
                  ? confirmedMatchCount.count === 1 ? 'matching pilot' : 'matching pilots'
                  : confirmedMatchCount.count === 1 ? 'matching listing' : 'matching listings'}{' '}
                →
              </Link>
            </p>
          )}
          {key === 'confirmed' && confirmedSourcePath && !confirmedMatchCount && isListingWatchPath(confirmedSourcePath) && (
            <p className="mt-2">
              <Link href={confirmedSourcePath} className="font-medium text-sky-600 hover:text-sky-700">
                See this listing →
              </Link>
            </p>
          )}
          {key === 'confirmed' && token && (
            <AlertStatusTracker event="alert_confirmed" token={token} sourcePath={confirmedSourcePath} />
          )}
          {key === 'unsubscribed' && token && (
            <AlertStatusTracker event="alert_unsubscribed" token={token} sourcePath={unsubSourcePath} />
          )}
          {key === 'cross_sell_added' && token && (
            <AlertStatusTracker
              event="alert_subscribed"
              token={token}
              context={crossSellContext}
              source={crossSellSource || 'digest_cross_sell'}
            />
          )}
          {key === 'unsubscribed' && token && (
            <UnsubscribeRecover
              token={token}
              showWeeklyOption={unsubFrequency === 'daily'}
              showMonthlyOption={unsubHasNonMonthly}
              alertCount={Math.max(unsubCount, 1)}
              sourcePath={unsubSourcePath}
            />
          )}
          {key === 'confirmed' && token && crossSell && (
            <AlertCrossSell originalToken={token} suggestion={crossSell} />
          )}
          {key === 'confirmed' && manageToken && (
            <p className="mt-4 text-sm text-slate-500">
              <Link href={`/alerts/manage?token=${manageToken}`} className="font-medium text-sky-600 hover:text-sky-700">
                Manage your alerts
              </Link>
            </p>
          )}
          {key === 'weekly' && token && (
            <p className="mt-4 text-sm text-slate-500">
              <Link href={`/alerts/manage?token=${token}`} className="font-medium text-sky-600 hover:text-sky-700">
                Manage your alerts
              </Link>
            </p>
          )}
          {key === 'daily' && token && (
            <p className="mt-4 text-sm text-slate-500">
              <Link href={`/alerts/manage?token=${token}`} className="font-medium text-sky-600 hover:text-sky-700">
                Manage your alerts
              </Link>
            </p>
          )}
          {key === 'monthly' && token && (
            <p className="mt-4 text-sm text-slate-500">
              <Link href={`/alerts/manage?token=${token}`} className="font-medium text-sky-600 hover:text-sky-700">
                Manage your alerts
              </Link>
            </p>
          )}
          {key === 'fewer' && token && (
            <p className="mt-4 text-sm text-slate-500">
              {/* `token` may be a combined digest's comma-joined list — any
                  one alert's token resolves the whole email on /alerts/manage
                  (same precedent as the cron's own `firstToken` manageUrl). */}
              <Link
                href={`/alerts/manage?token=${parseAlertTokens(token)[0] ?? token}`}
                className="font-medium text-sky-600 hover:text-sky-700"
              >
                Manage your alerts
              </Link>
            </p>
          )}
          {key === 'snoozed' && token && <SnoozeUndo token={token} />}
          {key === 'snoozed' && token && (
            <p className="mt-4 text-sm text-slate-500">
              {/* `token` may be a combined digest's comma-joined list — same
                  precedent as the 'fewer' state's manage link above. */}
              <Link
                href={`/alerts/manage?token=${parseAlertTokens(token)[0] ?? token}`}
                className="font-medium text-sky-600 hover:text-sky-700"
              >
                Manage your alerts
              </Link>
            </p>
          )}
          {key === 'cross_sell_added' && token && (
            <p className="mt-4 text-sm text-slate-500">
              <Link href={`/alerts/manage?token=${token}`} className="font-medium text-sky-600 hover:text-sky-700">
                Manage your alerts
              </Link>
            </p>
          )}
          {key === 'email_changed' && token && (
            <p className="mt-4 text-sm text-slate-500">
              <Link href={`/alerts/manage?token=${token}`} className="font-medium text-sky-600 hover:text-sky-700">
                Manage your alerts
              </Link>
            </p>
          )}
          {key === 'digest_feedback_down' && token && (
            <p className="mt-4 text-sm text-slate-500">
              <Link href={`/alerts/manage?token=${token}`} className="font-medium text-sky-600 hover:text-sky-700">
                Get fewer emails, pause, or fine-tune your alerts &rarr;
              </Link>
            </p>
          )}
          {key === 'digest_feedback_up' && token && (
            <p className="mt-4 text-sm text-slate-500">
              <Link href={`/alerts/manage?token=${token}`} className="font-medium text-sky-600 hover:text-sky-700">
                Manage your alerts
              </Link>
            </p>
          )}
          {key === 'digest_listing_feedback' && token && (
            <p className="mt-4 text-sm text-slate-500">
              <Link href={`/alerts/manage?token=${token}`} className="font-medium text-sky-600 hover:text-sky-700">
                Manage your alerts
              </Link>
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/aircraft"
              className="rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              Browse aircraft for sale
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Back to ClubHanger
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
