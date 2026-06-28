import Link from 'next/link'
import { ExternalLink, EyeOff, Eye, Sparkles, Activity, CheckCircle2, AlertTriangle, ImageOff, Camera, Loader2, Lock } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import { getScraperHealth, getRealListings, getListingFreshness, getPhotoCoverage, getHarvestStatus, getPartnershipScraperHealth, getPartnershipFreshness } from '@/lib/adminScrapers'
import HarvestRefresh from '@/components/HarvestRefresh'
import { moderateListing } from './actions'

export const metadata = { title: 'Review Listings', robots: { index: false } }
export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | undefined>

// Link a coverage cell to the admin listing-sample drill-down.
function sampleHref(source: string, opts: { grade?: string; photo?: 'shown' | 'hidden' } = {}): string {
  const p = new URLSearchParams({ source })
  if (opts.grade) p.set('grade', opts.grade)
  if (opts.photo) p.set('photo', opts.photo)
  return `/admin/listings/sample?${p.toString()}`
}

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
  const freshness = viewingHidden ? null : await getListingFreshness(admin)
  const photoCoverage = viewingHidden ? null : await getPhotoCoverage(admin)
  const harvest = viewingHidden ? null : await getHarvestStatus(admin)
  const partnershipHealth = viewingHidden ? null : await getPartnershipScraperHealth(admin)
  const partnershipFreshness = viewingHidden ? null : await getPartnershipFreshness(admin)

  // "Last new" is stale (scraper likely not running) if older than yesterday.
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' }) : 'never'

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

      {/* Listing freshness & coverage — re-seen rate (is the scrape comprehensive?),
          lingering-stale count, and auto-sold count per source. */}
      {freshness && (
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <Activity className="h-4 w-4" /> Listing freshness &amp; coverage
          </h3>
          <p className="mb-3 mt-0.5 text-xs text-slate-400">
            Re-seen rate = share of active listings the latest scrape actually re-confirmed. High (&gt;85%) = comprehensive
            scrape, so the 7-day auto-sold sweep is reliable. Low = the scrape only covers part of the source.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400">
                  <th className="px-3 py-2 font-semibold">Source</th>
                  <th className="px-3 py-2 text-right font-medium">Active</th>
                  <th className="px-3 py-2 text-right font-medium">Re-seen rate</th>
                  <th className="px-3 py-2 text-right font-medium">Going stale (&gt;2d)</th>
                  <th className="px-3 py-2 text-right font-medium">Auto-sold</th>
                  <th className="px-3 py-2 font-medium">Last scrape</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {freshness.map((f) => {
                  const pct = Math.round(f.reseenRate * 100)
                  const good = pct >= 85
                  const scrapeStale = !f.lastScrape || Date.now() - Date.parse(f.lastScrape) > 36 * 3600e3
                  return (
                    <tr key={f.source}>
                      <td className="px-3 py-2 font-medium text-slate-700">{f.source}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">{f.activeTotal.toLocaleString()}</td>
                      <td className={`px-3 py-2 text-right font-semibold tabular-nums ${good ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {f.activeTotal ? `${pct}%` : '—'}
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums ${f.staleActive > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {f.staleActive.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">{f.sold.toLocaleString()}</td>
                      <td className={`px-3 py-2 ${scrapeStale ? 'font-medium text-amber-600' : 'text-slate-500'}`}>
                        {fmtDate(f.lastScrape)}{scrapeStale ? ' ⚠' : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin-only sources (Controller, Bay Area dedup-first) — never public. */}
      {freshness && (() => {
        const ctrl = freshness.find((f) => f.source === 'controller')
        return (
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <Lock className="h-4 w-4" /> Admin-only inventory
            </h3>
            <Link
              href="/admin/listings/sample?source=controller&status=admin"
              className="mt-2 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm transition-colors hover:bg-amber-50"
            >
              <span className="text-slate-700">
                <span className="font-semibold">Controller — Bay Area</span>{' '}
                <span className="text-slate-500">(dedup-first; not shown publicly; links to source)</span>
              </span>
              <span className="flex items-center gap-2 font-semibold text-amber-700">
                {(ctrl?.activeTotal ?? 0).toLocaleString()} listings <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        )
      })()}

      {/* Hangar67 photo harvest — live status of the residential harvester. */}
      {harvest && (() => {
        const r = harvest.run
        const agoSec = r ? Math.round((Date.now() - Date.parse(r.updated_at)) / 1000) : 0
        const ago = agoSec < 90 ? `${agoSec}s ago` : agoSec < 5400 ? `${Math.round(agoSec / 60)}m ago` : `${Math.round(agoSec / 3600)}h ago`
        const stalled = !!r && r.status === 'running' && !harvest.live
        const badge = harvest.live
          ? { t: 'Running', c: 'bg-sky-50 text-sky-700 ring-sky-200' }
          : stalled
            ? { t: 'Stalled', c: 'bg-amber-50 text-amber-700 ring-amber-200' }
            : r?.status === 'done'
              ? { t: 'Idle — last run finished', c: 'bg-slate-100 text-slate-600 ring-slate-200' }
              : r?.status === 'stopped'
                ? { t: 'Stopped', c: 'bg-slate-100 text-slate-600 ring-slate-200' }
                : { t: 'Never run', c: 'bg-slate-100 text-slate-500 ring-slate-200' }
        const Stat = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
            <div className={`text-lg font-semibold tabular-nums ${tone}`}>{value.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400">{label}</div>
          </div>
        )
        return (
          <div className="mb-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                <Camera className="h-4 w-4" /> Hangar67 photo harvest
              </h3>
              <HarvestRefresh live={harvest.live} />
            </div>
            <p className="mb-3 mt-0.5 text-xs text-slate-400">
              Runs on a residential machine — the VPS&apos;s datacenter IP is Cloudflare-blocked. Recovers photos for hidden
              hangar67 listings so they can show on the marketplace.
            </p>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.c}`}>
                  {harvest.live && <Loader2 className="h-3 w-3 animate-spin" />}
                  {badge.t}
                </span>
                {r && (
                  <span className="text-slate-500">
                    {r.processed.toLocaleString()}/{r.total.toLocaleString()} processed · {r.with_photos.toLocaleString()} with photos · {r.total_photos.toLocaleString()} images · {r.errors.toLocaleString()} errors
                  </span>
                )}
                {r && (
                  <span className="text-slate-400">
                    {r.grade ? `grade ${r.grade} · ` : ''}heartbeat {ago}{r.host ? ` · ${r.host}` : ''}
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Recovered (have photos)" value={harvest.recovered} tone="text-emerald-600" />
                <Stat label="Remaining (still hidden)" value={harvest.remaining} tone="text-rose-600" />
                <Stat label="Grade A remaining" value={harvest.remainingByGrade.A} tone="text-slate-700" />
                <Stat label="Grade B / C remaining" value={harvest.remainingByGrade.B + harvest.remainingByGrade.C} tone="text-slate-700" />
              </div>
              {stalled && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Marked running but no heartbeat for {ago} — the process likely died. Restart it on the laptop.
                </p>
              )}
              {!harvest.live && harvest.remaining > 0 && (
                <p className="mt-3 text-xs text-slate-400">
                  Not running. Start on the laptop: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">node scraper/harvest-hangar67-photos.mjs --grade=A --concurrency=1 --delay=5000</code>
                </p>
              )}
            </div>
          </div>
        )
      })()}

      {/* Photo coverage × grade — how much active inventory is hidden purely for
          lack of a photo, broken down by listing grade. */}
      {photoCoverage && (
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <ImageOff className="h-4 w-4" /> Photo coverage &amp; grade — what&apos;s hidden
          </h3>
          <p className="mb-3 mt-0.5 text-xs text-slate-400">
            Active listings with an empty photo set are filtered out of every public list (marketplace + SEO). Per source
            and grade (A≥78 / B≥50 / C&lt;50), this shows how many <strong>show</strong> vs are <strong>hidden only for
            lack of a photo</strong>. High-grade hidden rows are the cheapest inventory to recover.{' '}
            <span className="text-slate-500">Click any number to see a sample of those listings.</span>
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[680px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400">
                  <th className="px-3 py-2 font-semibold">Source</th>
                  <th className="px-3 py-2 text-right font-medium">Active</th>
                  <th className="px-3 py-2 text-right font-medium">Shown</th>
                  <th className="px-3 py-2 text-right font-medium">Hidden — no photo</th>
                  <th className="px-3 py-2 text-right font-medium">Grade A</th>
                  <th className="px-3 py-2 text-right font-medium">Grade B</th>
                  <th className="px-3 py-2 text-right font-medium">Grade C</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {photoCoverage.map((c) => {
                  const byGrade = Object.fromEntries(c.grades.map((g) => [g.grade, g])) as Record<
                    'A' | 'B' | 'C',
                    (typeof c.grades)[number]
                  >
                  const pct = Math.round(c.hiddenPct * 100)
                  return (
                    <tr key={c.source}>
                      <td className="px-3 py-2 font-medium">
                        <Link href={sampleHref(c.source)} className="text-slate-700 hover:text-sky-700 hover:underline">{c.source}</Link>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <Link href={sampleHref(c.source)} className="text-slate-600 hover:text-sky-700 hover:underline">{c.active.toLocaleString()}</Link>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <Link href={sampleHref(c.source, { photo: 'shown' })} className="text-emerald-600 hover:underline">{c.shown.toLocaleString()}</Link>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        <Link href={sampleHref(c.source, { photo: 'hidden' })} className={`hover:underline ${c.hidden > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {c.hidden.toLocaleString()}{c.active ? ` (${pct}%)` : ''}
                        </Link>
                      </td>
                      {(['A', 'B', 'C'] as const).map((g) => {
                        const gd = byGrade[g]
                        return (
                          <td key={g} className="px-3 py-2 text-right tabular-nums">
                            <Link href={sampleHref(c.source, { grade: g })} className="text-slate-500 hover:text-sky-700 hover:underline">{gd.active.toLocaleString()}</Link>
                            {gd.hidden > 0 && (
                              <Link href={sampleHref(c.source, { grade: g, photo: 'hidden' })} className="ml-1 text-rose-500 hover:underline">({gd.hidden.toLocaleString()} hidden)</Link>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Grade cells show the active count, with hidden-for-no-photo in red. Adding photos to high-grade hidden rows
            is the fastest way to grow visible inventory.
          </p>
        </div>
      )}

      {/* Partnership scrapers — separate pipeline from aircraft for sale.
          All partnership scraper rows are status='admin' (free-text classifieds
          need extraction before they're trustworthy enough to show publicly). */}
      {partnershipHealth && (
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <Activity className="h-4 w-4" /> Partnership scrapers — new per day
          </h3>
          <p
            className={`mb-3 mt-0.5 flex items-center gap-1.5 text-sm font-medium ${
              partnershipHealth.todayTotal > 0 ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {partnershipHealth.todayTotal > 0 ? (
              <><CheckCircle2 className="h-4 w-4" /> {partnershipHealth.todayTotal.toLocaleString()} new partnership listings today.</>
            ) : (
              <><AlertTriangle className="h-4 w-4" /> No new partnership listings today — scrapers may not have run.</>
            )}
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="px-3 py-2 text-left font-semibold">Source</th>
                  {partnershipHealth.days.map((d) => (
                    <th key={d} className="px-2 py-2 text-center font-medium tabular-nums">{d.slice(5)}</th>
                  ))}
                  <th className="px-3 py-2 text-left font-semibold">Last new</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {partnershipHealth.sources.map((s) => {
                  const stale = !s.lastNew || s.lastNew < yesterday
                  return (
                    <tr key={s.source}>
                      <td className="px-3 py-2 font-medium text-slate-700">{s.source}</td>
                      {partnershipHealth.days.map((d) => {
                        const n = s.perDay[d] || 0
                        return (
                          <td key={d} className={`px-2 py-2 text-center tabular-nums ${n > 0 ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-slate-300'}`}>
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
        </div>
      )}

      {/* Partnership freshness — totals + last-scrape time per source. */}
      {partnershipFreshness && (
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <Lock className="h-4 w-4" /> Partnership inventory (admin-only)
          </h3>
          <p className="mb-3 mt-0.5 text-xs text-slate-400">
            All partnership-scraper rows are <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">status=&apos;admin&apos;</code> —
            hidden from the public marketplace until free-text extraction (buy-in, monthly, hourly) is trusted.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400">
                  <th className="px-3 py-2 font-semibold">Source</th>
                  <th className="px-3 py-2 text-right font-medium">Active (admin)</th>
                  <th className="px-3 py-2 text-right font-medium">Re-seen rate</th>
                  <th className="px-3 py-2 text-right font-medium">Stale (&gt;2d)</th>
                  <th className="px-3 py-2 font-medium">Last scrape</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {partnershipFreshness.map((f) => {
                  const pct = Math.round(f.reseenRate * 100)
                  const good = pct >= 85
                  const scrapeStale = !f.lastScrape || Date.now() - Date.parse(f.lastScrape) > 36 * 3600e3
                  return (
                    <tr key={f.source}>
                      <td className="px-3 py-2 font-medium text-slate-700">{f.source}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">{f.activeTotal.toLocaleString()}</td>
                      <td className={`px-3 py-2 text-right font-semibold tabular-nums ${good ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {f.activeTotal ? `${pct}%` : '—'}
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums ${f.staleActive > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {f.staleActive.toLocaleString()}
                      </td>
                      <td className={`px-3 py-2 ${scrapeStale ? 'font-medium text-amber-600' : 'text-slate-500'}`}>
                        {fmtDate(f.lastScrape)}{scrapeStale ? ' ⚠' : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Run with <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">node scraper/ingest-partnerships.mjs</code>
            {' '}(add <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">--source=barnstormers</code> to target one).
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
