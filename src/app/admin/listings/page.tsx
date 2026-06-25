import Link from 'next/link'
import { ExternalLink, EyeOff, Eye, Sparkles, Activity, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import { getScraperHealth, getRealListings } from '@/lib/adminScrapers'
import { moderateListing } from './actions'

export const metadata = { title: 'Review Listings', robots: { index: false } }
export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | undefined>

function StatusBadge({ status }: { status: string }) {
  const hidden = status === 'closed'
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
        hidden
          ? 'bg-rose-50 text-rose-600 ring-rose-200'
          : 'bg-emerald-50 text-emerald-600 ring-emerald-200'
      }`}
    >
      {hidden ? 'Hidden' : status}
    </span>
  )
}

function ActionButton({
  kind,
  id,
  hidden,
}: {
  kind: 'partnership' | 'aircraft'
  id: string
  hidden: boolean
}) {
  return (
    <form action={moderateListing}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={hidden ? 'restore' : 'hide'} />
      <button
        type="submit"
        className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 transition-colors ${
          hidden
            ? 'text-emerald-700 ring-emerald-200 hover:bg-emerald-50'
            : 'text-rose-600 ring-rose-200 hover:bg-rose-50'
        }`}
      >
        {hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        {hidden ? 'Restore' : 'Hide'}
      </button>
    </form>
  )
}

export default async function ReviewListingsTab({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { show } = await searchParams
  const viewingHidden = show === 'hidden'
  const status = viewingHidden ? 'closed' : 'active'
  const admin = createAdminClient()

  const [{ data: partnerships }, { data: aircraft }, health, realListings] = await Promise.all([
    admin
      .from('partnerships')
      .select('id, title, make, model, year, home_airport, city, state, source_url, status, created_at')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('aircraft_for_sale')
      .select('id, title, make, model, year, source, source_url, price_text, asking_price, location, state, status, created_at')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(50),
    // Monitoring sections only on the live view (not when reviewing hidden items).
    viewingHidden ? Promise.resolve(null) : getScraperHealth(admin),
    viewingHidden ? Promise.resolve(null) : getRealListings(admin),
  ])

  // "Last new" is stale (scraper likely not running) if older than yesterday.
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {viewingHidden
            ? 'Hidden listings — restore to put them back live.'
            : 'Live listings — hide anything that’s junk, spam, or not a real listing.'}
        </p>
        <Link
          href={viewingHidden ? '/admin/listings' : '/admin/listings?show=hidden'}
          className="text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          {viewingHidden ? '← Back to live' : 'View hidden →'}
        </Link>
      </div>

      {/* Real on-platform listings — highlighted at the top (the gold signal). */}
      {realListings && (
        <div className="mb-8 rounded-xl border-2 border-amber-200 bg-amber-50/60 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-700">
            <Sparkles className="h-4 w-4" /> Real on-platform listings ({realListings.length})
          </h3>
          <p className="mb-3 mt-0.5 text-xs text-amber-700/80">
            Posted by actual people (not scraped) — the signal that matters most.
          </p>
          {realListings.length === 0 ? (
            <p className="rounded-lg bg-white p-3 text-sm text-slate-400">
              No user-submitted listings yet — they’ll appear here the moment a real pilot posts one.
            </p>
          ) : (
            <div className="divide-y divide-amber-100 rounded-lg bg-white">
              {realListings.map((r) => (
                <div key={`${r.kind}-${r.id}`} className="flex items-center gap-3 p-3 text-sm">
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-amber-700">
                    {r.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{r.title}</p>
                    <p className="truncate text-xs text-slate-400">{r.subtitle}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-400 hover:text-sky-600" title="View">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scraper health — new listings per source per day (by first_seen_at). */}
      {health && (
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <Activity className="h-4 w-4" /> Scraper health — new listings per day
          </h3>
          <p
            className={`mb-3 mt-0.5 flex items-center gap-1.5 text-sm font-medium ${
              health.todayTotal > 0 ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {health.todayTotal > 0 ? (
              <><CheckCircle2 className="h-4 w-4" /> {health.todayTotal.toLocaleString()} new today across {health.sources.filter((s) => (s.perDay[health.today] || 0) > 0).length} source(s).</>
            ) : (
              <><AlertTriangle className="h-4 w-4" /> No new listings yet today — a scraper may not have run.</>
            )}
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="px-3 py-2 text-left font-semibold">Source</th>
                  {health.days.map((d) => (
                    <th key={d} className="px-2 py-2 text-center font-medium tabular-nums">{d.slice(5)}</th>
                  ))}
                  <th className="px-3 py-2 text-left font-semibold">Last new</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {health.sources.map((s) => {
                  const stale = !s.lastNew || s.lastNew < yesterday
                  return (
                    <tr key={s.source}>
                      <td className="px-3 py-2 font-medium text-slate-700">{s.source}</td>
                      {health.days.map((d) => {
                        const n = s.perDay[d] || 0
                        return (
                          <td
                            key={d}
                            className={`px-2 py-2 text-center tabular-nums ${
                              n > 0 ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-slate-300'
                            }`}
                          >
                            {n > 0 ? n : '·'}
                          </td>
                        )
                      })}
                      <td className={`px-3 py-2 ${stale ? 'font-medium text-amber-600' : 'text-slate-500'}`}>
                        {s.lastNew ? (stale ? `${s.lastNew} ⚠` : s.lastNew) : 'never'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Green = new listings first seen that day. An all-grey row (or a stale “Last new”) means that scraper hasn’t added anything recently.
          </p>
        </div>
      )}

      {/* Partnerships */}
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Partnerships ({partnerships?.length ?? 0})
      </h3>
      <div className="mb-8 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {!partnerships?.length && <p className="p-4 text-sm text-slate-400">None.</p>}
        {partnerships?.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <Link href={`/partnerships/${p.id}`} className="font-medium text-slate-800 hover:text-sky-700">
                {p.title}
              </Link>
              <p className="truncate text-xs text-slate-400">
                {[p.year, p.make, p.model].filter(Boolean).join(' ')} · {p.home_airport}
                {p.city ? ` · ${p.city}, ${p.state}` : ''}
              </p>
            </div>
            <StatusBadge status={p.status} />
            <Link href={`/partnerships/${p.id}`} className="text-slate-400 hover:text-sky-600" title="View">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <ActionButton kind="partnership" id={p.id} hidden={viewingHidden} />
          </div>
        ))}
      </div>

      {/* Planes for sale */}
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Planes for Sale ({aircraft?.length ?? 0})
      </h3>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {!aircraft?.length && <p className="p-4 text-sm text-slate-400">None.</p>}
        {aircraft?.map((a) => (
          <div key={a.id} className="flex items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <span className="font-medium text-slate-800">{a.title}</span>
              <p className="truncate text-xs text-slate-400">
                {[a.year, a.make, a.model].filter(Boolean).join(' ')} · {a.source}
                {a.location ? ` · ${a.location}` : ''} · {a.price_text ?? (a.asking_price ? `$${a.asking_price.toLocaleString()}` : '—')}
              </p>
            </div>
            <StatusBadge status={a.status} />
            {a.source_url && (
              <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-sky-600" title="Original listing">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <ActionButton kind="aircraft" id={a.id} hidden={viewingHidden} />
          </div>
        ))}
      </div>
    </section>
  )
}
