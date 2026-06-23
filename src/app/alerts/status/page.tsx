import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, BellOff, AlertCircle } from 'lucide-react'

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
  invalid: {
    icon: AlertCircle,
    tint: 'text-amber-600',
    ring: 'bg-amber-50',
    title: 'This link is no longer valid',
    body: "That confirmation or unsubscribe link has expired or was already used. If you meant to manage alerts, you can sign up again from any aircraft page.",
  },
} as const

type StateKey = keyof typeof STATES

function resolveState(raw: string | string[] | undefined): StateKey {
  const v = Array.isArray(raw) ? raw[0] : raw
  return v === 'confirmed' || v === 'unsubscribed' ? v : 'invalid'
}

export default async function AlertStatusPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const key = resolveState(params.state)
  const { icon: Icon, tint, ring, title, body } = STATES[key]

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${ring}`}>
        <Icon className={`h-8 w-8 ${tint}`} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">{body}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
    </main>
  )
}
