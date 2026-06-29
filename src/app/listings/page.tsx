import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plane, Handshake, PlusCircle, ExternalLink, UserSearch } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatPrice, formatShareType } from '@/lib/utils'
import type { AircraftForSale, Partnership } from '@/lib/types'

type SeekerRow = {
  id: string
  title: string | null
  home_airport: string | null
  status: string
  created_at: string
  preferred_makes: string[] | null
}

export const metadata: Metadata = {
  title: 'My Listings — ClubHanger',
  description: 'View and manage your posted aircraft, partnership, and seeking listings.',
  robots: { index: false, follow: false },
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-amber-50 text-amber-700 ring-amber-200'
      }`}
    >
      {isActive ? 'Active' : 'Pending'}
    </span>
  )
}

export default async function MyListingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth?next=/listings')

  // Fetch aircraft posted by this user.
  const { data: aircraftRows } = await supabase
    .from('aircraft_for_sale')
    .select('id, title, make, model, year, asking_price, price_text, status, created_at, first_seen_at, source')
    .eq('poster_id', user.id)
    .in('status', ['active', 'pending'])
    .order('created_at', { ascending: false })

  // Fetch partnerships posted by this user.
  const { data: partnershipRows } = await supabase
    .from('partnerships')
    .select('id, title, make, model, year, buy_in_price, share_type, status, created_at, posted_at')
    .eq('poster_id', user.id)
    .in('status', ['active', 'pending'])
    .order('created_at', { ascending: false })

  // Fetch seeking listings posted by this user.
  const { data: seekerRows } = await supabase
    .from('partnership_seekers')
    .select('id, title, home_airport, status, created_at, preferred_makes')
    .eq('poster_id', user.id)
    .in('status', ['active', 'pending'])
    .order('created_at', { ascending: false })

  const aircraft: AircraftForSale[] = (aircraftRows ?? []) as AircraftForSale[]
  const partnerships: Partnership[] = (partnershipRows ?? []) as Partnership[]
  const seekers: SeekerRow[] = (seekerRows ?? []) as SeekerRow[]

  const hasAny = aircraft.length > 0 || partnerships.length > 0 || seekers.length > 0

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Plane className="h-6 w-6 text-sky-600" />
            My Listings
          </h1>
          <p className="mt-1 text-slate-500">
            Aircraft, partnerships, and seeking listings you&apos;ve posted on ClubHanger.
          </p>
        </div>

        {!hasAny && (
          <div className="ch-panel flex flex-col items-center py-14 text-center">
            <PlusCircle className="mb-4 h-10 w-10 text-slate-300" />
            <p className="mb-1 font-semibold text-slate-700">No listings yet</p>
            <p className="mb-6 text-sm text-slate-500">
              Post an aircraft for sale, a co-ownership partnership, or a seeking listing to see it here.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/aircraft/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
              >
                <Plane className="h-4 w-4" /> Sell an aircraft
              </Link>
              <Link
                href="/partnerships/new"
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100"
              >
                <Handshake className="h-4 w-4" /> Post a partnership
              </Link>
              <Link
                href="/partnerships/seeking/new"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Seeking a partnership
              </Link>
            </div>
          </div>
        )}

        {aircraft.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <Plane className="h-4 w-4" /> Aircraft for sale ({aircraft.length})
            </h2>
            <ul className="space-y-3">
              {aircraft.map((p) => (
                <li key={p.id} className="ch-panel flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span className="truncate text-sm font-semibold text-slate-800">{p.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {p.asking_price ? formatPrice(p.asking_price) : p.price_text ?? 'Contact for price'}
                      {' · '}
                      {formatDate(p.first_seen_at ?? p.created_at)}
                    </p>
                  </div>
                  <Link
                    href={`/aircraft/listing/${p.id}`}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
                  >
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {partnerships.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <Handshake className="h-4 w-4" /> Partnerships ({partnerships.length})
            </h2>
            <ul className="space-y-3">
              {partnerships.map((p) => (
                <li key={p.id} className="ch-panel flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span className="truncate text-sm font-semibold text-slate-800">{p.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {p.buy_in_price ? `${formatPrice(p.buy_in_price)} buy-in` : 'Contact for cost'}
                      {' · '}
                      {formatShareType(p.share_type)}
                      {' · '}
                      {formatDate(p.posted_at ?? p.created_at)}
                    </p>
                  </div>
                  <Link
                    href={`/partnerships/${p.id}`}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
                  >
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {seekers.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <UserSearch className="h-4 w-4" /> Pilots seeking ({seekers.length})
            </h2>
            <ul className="space-y-3">
              {seekers.map((s) => {
                const makeLabel = s.preferred_makes?.length
                  ? s.preferred_makes.slice(0, 2).join(', ') + (s.preferred_makes.length > 2 ? '…' : '')
                  : null
                return (
                  <li key={s.id} className="ch-panel flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={s.status} />
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {s.title ?? `Pilot seeking partnership${s.home_airport ? ` near ${s.home_airport}` : ''}`}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {s.home_airport ?? 'Any airport'}
                        {makeLabel ? ` · ${makeLabel}` : ''}
                        {' · '}
                        {formatDate(s.created_at)}
                      </p>
                    </div>
                    <Link
                      href={`/partnerships/seeking/${s.id}`}
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
                    >
                      View <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {hasAny && (
          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
            <Link
              href="/aircraft/new"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <PlusCircle className="h-4 w-4 text-sky-600" /> Post another listing
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
