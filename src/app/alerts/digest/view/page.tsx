import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, ExternalLink } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAlertDigestPreview } from '@/lib/alertMatchCounts'
import { SITE_NAME } from '@/lib/seo'
import { formatPrice } from '@/lib/utils'

// Private, per-alert utility page reached from a digest email's "View in
// browser" link — no SEO value, same convention as /alerts/manage.
export const metadata: Metadata = {
  title: { absolute: `Live alert view | ${SITE_NAME}` },
  description: 'See what currently matches your ClubHanger alert.',
  robots: { index: false, follow: false },
}

type SearchParams = Record<string, string | string[] | undefined>

const PREVIEW_LIMIT = 9

export default async function DigestViewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const rawToken = params.token
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken

  type ViewAlert = { context: string | null; source_path: string | null; unsubscribe_token: string }
  let alert: ViewAlert | null = null
  if (token) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('alerts')
      .select('context, source_path, unsubscribe_token')
      .eq('unsubscribe_token', token)
      .maybeSingle()
    if (data?.unsubscribe_token) alert = data as ViewAlert
  }

  if (!alert) {
    return (
      <div className="ch-surface min-h-screen">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <Bell className="h-7 w-7 text-sky-600" />
              Live alert view
            </h1>
            <p className="mt-1 text-slate-600">This link is no longer valid.</p>
          </div>
          <div className="ch-panel p-6">
            <p className="text-sm leading-relaxed text-slate-600">
              This alert may have been deleted, or the link is incomplete. You can set up a
              new alert anytime — no account needed.
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

  const preview = await getAlertDigestPreview(alert.source_path, PREVIEW_LIMIT)
  const context = alert.context?.trim() || 'New listings'
  const manageUrl = `/alerts/manage?token=${alert.unsubscribe_token}`
  const browseUrl = alert.source_path || '/aircraft'

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Live view</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <Bell className="h-7 w-7 text-sky-600" />
            {context}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Updated since your email was sent — this shows what&apos;s live on ClubHanger
            right now, not a copy of the email itself.
          </p>
        </div>

        <section className="ch-panel p-6">
          {!preview || preview.samples.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 px-5 py-8 text-center">
              <Bell className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="font-medium text-slate-600">No live matches right now</p>
              <p className="mt-1 text-sm text-slate-400">
                Nothing currently matches this alert. Try{' '}
                <Link href={manageUrl} className="text-sky-600 underline-offset-2 hover:underline">
                  widening it
                </Link>
                , or check back soon.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">
                {preview.count} {preview.noun}
                {preview.count === 1 ? '' : 's'} match{preview.count === 1 ? 'es' : ''} right now
                {preview.samples.length < preview.count ? ` (showing ${preview.samples.length})` : ''}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {preview.samples.map((s) => (
                  <Link
                    key={s.url}
                    href={s.url}
                    className="ch-card flex items-center gap-3 bg-white p-2 transition-shadow hover:shadow-md sm:flex-col sm:items-stretch sm:p-3"
                  >
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-full">
                      {s.photoUrl && (
                        <Image src={s.photoUrl} alt={s.title} fill sizes="200px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{s.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {[s.lookingFor ?? s.shareType, s.location].filter(Boolean).join(' · ')}
                      </p>
                      {s.price != null && <p className="text-sm font-semibold text-sky-700">{formatPrice(s.price)}</p>}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-5">
                <Link
                  href={browseUrl}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:underline"
                >
                  See all matches <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </>
          )}

          <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
            <Link href={manageUrl} className="text-sky-600 underline-offset-2 hover:underline">
              Manage this alert
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}
