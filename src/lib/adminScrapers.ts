import type { SupabaseClient } from '@supabase/supabase-js'

// Sources we expect a scraper to refresh. Extend as new scrapers come online.
export const SCRAPER_SOURCES = ['barnstormers', 'hangar67', 'aircraftforsale']

const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : null)

export type SourceHealth = {
  source: string
  perDay: Record<string, number> // YYYY-MM-DD → new listings first-seen that day
  recentTotal: number
  lastNew: string | null // most recent day with a new listing
}

export type ScraperHealth = {
  days: string[] // last N calendar days, newest first
  today: string
  sources: SourceHealth[]
  todayTotal: number
}

/** Per-source × per-day count of NEW listings (by first_seen_at) over the last N
 *  days — so the admin can see at a glance whether each scraper ran and brought in
 *  fresh inventory. A column of zeros = that scraper didn't run (or found nothing). */
export async function getScraperHealth(admin: SupabaseClient, daysBack = 10): Promise<ScraperHealth> {
  const cutoff = new Date(Date.now() - (daysBack + 2) * 864e5).toISOString()
  const { data } = await admin
    .from('aircraft_for_sale')
    .select('source, first_seen_at, created_at')
    .gte('first_seen_at', cutoff)
    .limit(50000)

  const days: string[] = []
  for (let i = 0; i < daysBack; i++) days.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10))
  const today = days[0]

  const map = new Map<string, SourceHealth>()
  const ensure = (s: string) => map.get(s) ?? map.set(s, { source: s, perDay: {}, recentTotal: 0, lastNew: null }).get(s)!
  for (const s of SCRAPER_SOURCES) ensure(s) // always show known scrapers, even if silent
  for (const r of data ?? []) {
    const s = (r.source as string) || '(unknown)'
    const d = day(r.first_seen_at as string) || day(r.created_at as string)
    if (!d) continue
    const e = ensure(s)
    e.perDay[d] = (e.perDay[d] || 0) + 1
    e.recentTotal++
    if (!e.lastNew || d > e.lastNew) e.lastNew = d
  }

  const sources = [...map.values()].sort((a, b) => b.recentTotal - a.recentTotal)
  const todayTotal = sources.reduce((n, s) => n + (s.perDay[today] || 0), 0)
  return { days, today, sources, todayTotal }
}

export type SourceFreshness = {
  source: string
  activeTotal: number
  reseenLastRun: number // active listings touched in the latest scrape window
  staleActive: number // active but not seen in >2 days (lingering — maybe sold)
  sold: number
  lastScrape: string | null
  reseenRate: number // reseenLastRun / activeTotal (0..1)
}

/** Per-source freshness: how much of each source's active inventory the latest
 *  scrape actually re-saw (coverage), how many active listings are going stale
 *  (not seen recently), and how many have been auto-marked sold. A low re-seen
 *  rate means the scrape isn't comprehensive (so "not seen" ≠ "gone"). */
export async function getListingFreshness(admin: SupabaseClient): Promise<SourceFreshness[]> {
  const count = async (build: (q: any) => any): Promise<number> => {
    const { count } = await build(admin.from('aircraft_for_sale').select('id', { count: 'exact', head: true }))
    return count ?? 0
  }
  const out: SourceFreshness[] = []
  for (const source of SCRAPER_SOURCES) {
    const { data: latest } = await admin
      .from('aircraft_for_sale').select('last_seen_at').eq('source', source)
      .not('last_seen_at', 'is', null).order('last_seen_at', { ascending: false }).limit(1)
    const lastScrape = latest?.[0]?.last_seen_at ?? null
    const reseenWindow = lastScrape ? new Date(Date.parse(lastScrape) - 6 * 3600e3).toISOString() : null
    const staleCut = new Date(Date.now() - 2 * 864e5).toISOString()

    const [activeTotal, reseenLastRun, staleActive, sold] = await Promise.all([
      count((q) => q.eq('source', source).eq('status', 'active')),
      reseenWindow ? count((q) => q.eq('source', source).eq('status', 'active').gte('last_seen_at', reseenWindow)) : Promise.resolve(0),
      count((q) => q.eq('source', source).eq('status', 'active').lt('last_seen_at', staleCut)),
      count((q) => q.eq('source', source).eq('status', 'sold')),
    ])
    out.push({
      source, activeTotal, reseenLastRun, staleActive, sold, lastScrape,
      reseenRate: activeTotal > 0 ? reseenLastRun / activeTotal : 0,
    })
  }
  return out.sort((a, b) => b.activeTotal - a.activeTotal)
}

export type RealListing = {
  id: string
  kind: 'aircraft' | 'partnership' | 'seeker'
  title: string
  subtitle: string
  created_at: string
  href: string
}

/** Listings a REAL human posted on-platform (poster_id set) — the gold signal vs
 *  scraped inventory. Aircraft-for-sale, partnerships, and pilot-seeking, newest
 *  first. (Seed/fake rows have a null poster_id, so they're excluded.) */
export async function getRealListings(admin: SupabaseClient, limit = 25): Promise<RealListing[]> {
  const [ac, pa, se] = await Promise.all([
    admin.from('aircraft_for_sale').select('id, title, make, model, year, state, asking_price, source_url, created_at, poster_id')
      .not('poster_id', 'is', null).order('created_at', { ascending: false }).limit(limit),
    admin.from('partnerships').select('id, title, make, model, home_airport, city, state, created_at, poster_id')
      .not('poster_id', 'is', null).order('created_at', { ascending: false }).limit(limit),
    admin.from('partnership_seekers').select('id, title, home_airport, city, state, created_at, poster_id')
      .not('poster_id', 'is', null).order('created_at', { ascending: false }).limit(limit),
  ])

  const items: RealListing[] = []
  for (const a of ac.data ?? []) items.push({
    id: a.id, kind: 'aircraft', title: a.title || [a.year, a.make, a.model].filter(Boolean).join(' ') || 'Aircraft',
    subtitle: [[a.year, a.make, a.model].filter(Boolean).join(' '), a.state, a.asking_price ? `$${a.asking_price.toLocaleString()}` : null].filter(Boolean).join(' · '),
    created_at: a.created_at, href: a.source_url || '#',
  })
  for (const p of pa.data ?? []) items.push({
    id: p.id, kind: 'partnership', title: p.title || [p.make, p.model].filter(Boolean).join(' ') || 'Partnership',
    subtitle: [[p.make, p.model].filter(Boolean).join(' '), p.home_airport, [p.city, p.state].filter(Boolean).join(', ')].filter(Boolean).join(' · '),
    created_at: p.created_at, href: `/partnerships/${p.id}`,
  })
  for (const s of se.data ?? []) items.push({
    id: s.id, kind: 'seeker', title: s.title || 'Pilot seeking a share',
    subtitle: [s.home_airport, [s.city, s.state].filter(Boolean).join(', ')].filter(Boolean).join(' · '),
    created_at: s.created_at, href: `/partnerships/seeking/${s.id}`,
  })

  return items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, limit)
}
