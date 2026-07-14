import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, BellOff, AlertCircle, MailOpen } from 'lucide-react'
import UnsubscribeRecover from '@/components/UnsubscribeRecover'
import AlertCrossSell from '@/components/AlertCrossSell'
import AlertStatusTracker from '@/components/AlertStatusTracker'
import { getCrossSellSuggestion } from '@/lib/alertCrossSell'
import { createAdminClient } from '@/lib/supabase-admin'
import { normalizeFrequency, type AlertFrequency } from '@/lib/alertFrequency'
import { getAlertMatchCount } from '@/lib/alertMatchCounts'
import { isListingWatchPath } from '@/lib/alertWatchStatus'

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
} as const

type StateKey = keyof typeof STATES

function resolveState(raw: string | string[] | undefined): StateKey {
  const v = Array.isArray(raw) ? raw[0] : raw
  return v === 'confirmed' || v === 'unsubscribed' || v === 'weekly' || v === 'cross_sell_added' || v === 'email_changed'
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
      const cadenceLabel = cadence === 'daily' ? 'a daily digest' : 'a weekly digest'
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

  // The recovery box's "Switch to weekly instead" option only makes sense for an
  // alert that was firing daily — for a weekly (or not-yet-migrated) alert, the
  // resulting cadence would be identical to what it already was, so hide it.
  // `unsubscribe_token` is the same `token` the unsubscribe link forwards here.
  let unsubFrequency: AlertFrequency = 'weekly'
  let unsubSourcePath: string | null = null
  if (key === 'unsubscribed' && token) {
    const admin = createAdminClient()
    let { data, error } = await admin
      .from('alerts')
      .select('frequency, source_path')
      .eq('unsubscribe_token', token)
      .maybeSingle()
    // `frequency` may not be migrated live yet — same graceful-degrade retry
    // precedent as the `confirmed` branch above / `/alerts/manage`'s fetchAlertsForEmail.
    if (error?.message?.includes('frequency')) {
      ;({ data, error } = await admin
        .from('alerts')
        .select('source_path')
        .eq('unsubscribe_token', token)
        .maybeSingle())
    }
    if (!error) {
      const row = data as { frequency?: string; source_path?: string | null } | null
      unsubFrequency = normalizeFrequency(row?.frequency)
      unsubSourcePath = row?.source_path ?? null
    }
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
              source="digest_cross_sell"
            />
          )}
          {key === 'unsubscribed' && token && (
            <UnsubscribeRecover token={token} showWeeklyOption={unsubFrequency === 'daily'} />
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
