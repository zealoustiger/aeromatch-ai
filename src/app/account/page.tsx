import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Settings,
  Bell,
  Heart,
  Bookmark,
  MessageCircle,
  LogIn,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Avatar } from '@/components/ProfileMenu'
import AccountSignOutButton from '@/components/AccountSignOutButton'
import { SITE_NAME } from '@/lib/seo'
import type { SavedSearch } from '@/lib/types'

// Private, per-user utility page — keep it out of the index (no SEO value, and it
// shouldn't dilute crawl budget while STAGE=INDEXING).
export const metadata: Metadata = {
  title: `Account & alerts | ${SITE_NAME}`,
  description: 'Manage your ClubHanger account, email alerts, saved searches and saved listings.',
  robots: { index: false, follow: false },
}

// Which marketplace a saved search belongs to (mirrors /searches). Older rows
// default to partnerships.
function marketplaceLabel(path: string): string {
  return path === '/aircraft' ? 'Planes for Sale' : 'Partnerships'
}

// One quick-link tile to an existing activity surface.
function ActivityLink({
  href,
  label,
  hint,
  icon: Icon,
}: {
  href: string
  label: string
  hint: string
  icon: typeof Heart
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className="inline-flex shrink-0 rounded-xl bg-sky-50 p-2.5 text-sky-600">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-slate-900 group-hover:text-sky-700">{label}</span>
        <span className="block truncate text-sm text-slate-500">{hint}</span>
      </span>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-sky-600" />
    </Link>
  )
}

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Logged-out: render a real public explainer with a sign-in CTA (never a bare
  // redirect — mirrors how /saved now greets logged-out visitors).
  if (!user) {
    return (
      <div className="ch-surface min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <Settings className="h-7 w-7 text-sky-600" />
              Your ClubHanger account
            </h1>
            <p className="mt-1 text-slate-600">
              Sign in to manage email alerts, saved searches and saved listings.
            </p>
          </div>

          <div className="ch-panel p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Bell className="h-5 w-5 text-sky-600" />
              Email alerts &amp; saved searches
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A free account lets you save searches and listings across both marketplaces —
              co-ownership partnerships and planes for sale — and get email alerts when new
              listings match what you&apos;re looking for. We only email about searches you
              choose to save, and you can remove any of them anytime.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/auth?next=/account"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
              >
                <LogIn className="h-4 w-4" />
                Sign in or create a free account
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Just browsing? Explore{' '}
            <Link href="/partnerships" className="text-sky-600 underline-offset-2 hover:underline">
              partnerships
            </Link>{' '}
            or{' '}
            <Link href="/aircraft" className="text-sky-600 underline-offset-2 hover:underline">
              planes for sale
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  // Signed-in: the user's saved searches double as their alert subscriptions.
  const { data: searchesData } = await supabase
    .from('saved_searches')
    .select('*')
    .order('created_at', { ascending: false })
  const searches = (searchesData ?? []) as SavedSearch[]

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <Settings className="h-7 w-7 text-sky-600" />
            Account &amp; alerts
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <Avatar user={user} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Signed in as</div>
              <div className="truncate text-sm font-semibold text-slate-900">{user.email}</div>
            </div>
          </div>
        </div>

        {/* Email alerts — saved searches are the alert subscriptions */}
        <section className="ch-panel p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Bell className="h-5 w-5 text-sky-600" />
            Email alerts
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            We&apos;ll email you when new listings match a search you&apos;ve saved — and only
            those searches. Email delivery is rolling out soon; your saved searches below are
            ready and will start sending the moment alerts go live.
          </p>

          {searches.length === 0 ? (
            <div className="mt-5 rounded-xl border-2 border-dashed border-slate-200 px-5 py-8 text-center">
              <Bookmark className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="font-medium text-slate-600">No saved searches yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Set your filters on{' '}
                <Link href="/aircraft" className="text-sky-600 underline-offset-2 hover:underline">
                  planes for sale
                </Link>{' '}
                or{' '}
                <Link href="/partnerships" className="text-sky-600 underline-offset-2 hover:underline">
                  partnerships
                </Link>{' '}
                and tap <strong className="text-slate-600">Save this search</strong> to turn on
                alerts.
              </p>
            </div>
          ) : (
            <>
              <ul className="mt-5 space-y-3">
                {searches.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">{s.name}</p>
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                          {marketplaceLabel(s.path)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Saved {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`${s.path || '/partnerships'}?${s.search_params}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/searches"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
              >
                Manage all saved searches <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </section>

        {/* Your activity */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Your activity
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <ActivityLink href="/saved" label="Saved" hint="Listings you've hearted" icon={Heart} />
            <ActivityLink
              href="/searches"
              label="Saved searches"
              hint="Your alert subscriptions"
              icon={Bookmark}
            />
            <ActivityLink href="/messages" label="Messages" hint="Your conversations" icon={MessageCircle} />
          </div>
        </section>

        {/* Sign out */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <AccountSignOutButton />
        </div>
      </div>
    </div>
  )
}
