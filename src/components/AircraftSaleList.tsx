import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AircraftForSale } from '@/lib/types'
import { minScoreForGrade, type Grade } from '@/lib/listingQuality'
import AircraftSaleCard from './AircraftSaleCard'

interface Filters {
  q?: string
  make?: string
  model?: string
  /** family-level model match (ilike); used by the make+model SEO pages where
   *  the exact `model` strings are too messy/inconsistent for `.eq`. */
  modelPattern?: string
  /** optional ilike pattern to exclude (e.g. keep SR22 distinct from SR22T). */
  notModelPattern?: string
  state?: string
  max_price?: string
  min_year?: string
  max_tt?: string
  min_grade?: string
  sort?: string
  drops?: string
  page?: string
  /** route the pager links live under (default /aircraft). Used by the
   *  make+model SEO pages so paging stays on `/aircraft/[make]/[model]`. */
  basePath?: string
}

const PAGE_SIZE = 60

// Site-wide quality floor: the lowest grade the public site will ever show,
// regardless of the user's filter. Set LISTING_GRADE_FLOOR=B (or A) to hide
// weaker listings everywhere. Defaults to 'C' (show everything).
const FLOOR_GRADE = ((process.env.LISTING_GRADE_FLOOR ?? 'C').toUpperCase().charAt(0) || 'C') as Grade

// Effective minimum score = the stricter of the site floor and the user's pick.
function effectiveMinScore(userGrade: string | undefined): number {
  const floor = minScoreForGrade(['A', 'B', 'C'].includes(FLOOR_GRADE) ? FLOOR_GRADE : 'C')
  const user =
    userGrade === 'A' || userGrade === 'B' ? minScoreForGrade(userGrade as Grade) : 0
  return Math.max(floor, user)
}

// Parse ?page into a 1-based page number, clamped to >= 1. Anything missing or
// junk falls back to page 1.
function parsePage(raw: string | undefined): number {
  const n = parseInt(raw ?? '1', 10)
  return Number.isFinite(n) && n > 1 ? n : 1
}

// Filter keys that are internal query shaping, not user-facing URL params —
// they must never leak into pager hrefs.
const NON_URL_FILTER_KEYS = new Set(['page', 'modelPattern', 'notModelPattern', 'basePath'])

// Build a paginated href for a target page that preserves the active filters.
// page 1 drops the param to keep the canonical URL clean. `basePath` lets the
// make+model SEO pages page within their own route instead of /aircraft.
function pageHref(filters: Filters, targetPage: number): string {
  const base = filters.basePath ?? '/aircraft'
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (NON_URL_FILTER_KEYS.has(key) || !value) continue
    params.set(key, value)
  }
  if (targetPage > 1) params.set('page', String(targetPage))
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

// Compact, windowed list of page numbers to show in the pager. Always includes
// page 1, the last page, and the current page with its immediate neighbors;
// gaps collapse into a 'gap' ellipsis marker. e.g. (7, 31) -> [1,'gap',6,7,8,'gap',31].
// For small totals (<= 7 pages) this just lists every page with no gaps.
function pageWindow(current: number, total: number): (number | 'gap')[] {
  const shown = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = [...shown].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  let prev = 0
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push('gap')
    out.push(n)
    prev = n
  }
  return out
}

// Live count of active listings for a make + model family. Used by the
// `/aircraft/[make]/[model]` SEO pages so the title/H1 N is always accurate.
// Returns 0 on any failure (the page treats 0 as a 404-worthy thin combo).
export async function countMakeModel(
  make: string,
  modelPattern: string,
  notModelPattern?: string
): Promise<number> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return 0
  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('aircraft_for_sale')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .ilike('make', `%${make}%`)
      .ilike('model', modelPattern)
    if (notModelPattern) query = query.not('model', 'ilike', notModelPattern)
    const { count, error } = await query
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

// Live count of active for-sale listings located in a given state (USPS code).
// Used by the `/aircraft/for-sale/[state]` SEO pages for an accurate title/H1 N
// and by the sitemap as the single source of truth for the count>0 gate.
// Returns 0 on any failure (the page treats 0 as a 404-worthy thin state).
export async function countForSaleState(code: string): Promise<number> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return 0
  try {
    const supabase = await createServerSupabaseClient()
    const { count, error } = await supabase
      .from('aircraft_for_sale')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('state', code)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

/** Result of one page-fetch of for-sale listings for the active filters. */
export interface AircraftPage {
  /** The listings shown on this page (already filtered/sorted/narrowed). */
  listings: AircraftForSale[]
  /** Exact total matching the filters when known; null when not computable. */
  totalCount: number | null
  /** 1-based page number that was fetched. */
  page: number
  /** True when the underlying query errored on page 1 (genuine failure). */
  error: boolean
}

/**
 * Fetch one page of active for-sale listings for the given filters, applying the
 * exact same query, ordering, quality floor and price-drop narrowing the
 * `AircraftSaleList` component renders. Extracted so other server components
 * (e.g. the SEO pages' JSON-LD) can mark up *exactly* the listings the user sees
 * without duplicating the query. The component itself now calls this — single
 * source of truth, no behavior change.
 */
export async function fetchAircraftPage(filters: Filters): Promise<AircraftPage> {
  let listings: AircraftForSale[] = []
  // Total number of listings matching the active filters (may exceed the rows
  // shown). null = unknown/not applicable, fall back to the displayed length.
  let totalCount: number | null = null
  let error = false

  const page = parsePage(filters.page)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) {
    return { listings: [], totalCount: null, page, error: false }
  }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('aircraft_for_sale')
      .select('*', { count: 'exact' })
      .eq('status', 'active')

    if (filters.make) query = query.ilike('make', `%${filters.make}%`)
    if (filters.model) query = query.eq('model', filters.model)
    if (filters.modelPattern) query = query.ilike('model', filters.modelPattern)
    if (filters.notModelPattern) query = query.not('model', 'ilike', filters.notModelPattern)
    if (filters.state) query = query.eq('state', filters.state)
    if (filters.max_price) query = query.lte('asking_price', parseInt(filters.max_price))
    if (filters.min_year) query = query.gte('year', parseInt(filters.min_year))
    if (filters.max_tt) query = query.lte('ttaf', parseInt(filters.max_tt))
    const minScore = effectiveMinScore(filters.min_grade)
    if (minScore > 0) query = query.gte('quality_score', minScore)
    if (filters.q) {
      const term = filters.q.replace(/[%,()]/g, ' ').trim()
      if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    }
    // "Price drops only" — narrowed precisely in JS below (column-to-column
    // comparison isn't expressible in PostgREST).
    if (filters.drops) query = query.not('price_changed_at', 'is', null)

    switch (filters.sort) {
      case 'price_asc':
        query = query.order('asking_price', { ascending: true, nullsFirst: false })
        break
      case 'price_desc':
        query = query.order('asking_price', { ascending: false, nullsFirst: false })
        break
      case 'reduced':
        query = query.order('price_changed_at', { ascending: false, nullsFirst: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data, error: err, count } = await query.range(from, to)
    if (err) {
      error = true
    } else {
      listings = data ?? []
      // Keep only genuine drops (asking < previous), not price rises.
      if (filters.drops) {
        listings = listings.filter(
          (p) => p.previous_price != null && p.asking_price != null && p.asking_price < p.previous_price
        )
        // The genuine-drops narrowing is column-to-column and can't be expressed
        // in the count query, so fall back to the JS-narrowed length below.
        totalCount = null
      } else {
        totalCount = count ?? null
      }
    }
  } catch {
    error = true
  }

  return { listings, totalCount, page, error }
}

export default async function AircraftSaleList({ filters }: { filters: Filters }) {
  const { listings, totalCount, page, error } = await fetchAircraftPage(filters)

  // An offset past the end of the result set makes PostgREST return a
  // "range not satisfiable" error. Page 1 (offset 0) is always satisfiable,
  // so an error there is genuine; an error on page > 1 just means the page is
  // out of range — render the graceful last-page state instead of an error box.
  if (error && page === 1) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center text-sm text-red-600">
        Failed to load listings. Please try again.
      </div>
    )
  }

  return renderList(listings, filters, totalCount, page)
}

function renderList(
  listings: AircraftForSale[],
  filters: Filters,
  totalCount: number | null,
  page: number
) {
  if (listings.length === 0) {
    const filtered = Object.values(filters).some((v) => v && v !== '1') || page > 1
    // An out-of-range page (filtered past the end) shouldn't read like "no
    // matches at all" — offer a way back to the first page.
    if (page > 1) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No more aircraft on this page.</p>
          <Link
            href={pageHref(filters, 1)}
            className="mt-3 inline-block text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            ← Back to the first page
          </Link>
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">
          {filtered ? 'No aircraft match these filters.' : 'No aircraft for sale yet.'}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {filtered ? 'Try widening your search.' : 'Check back soon — new listings are added daily.'}
        </p>
      </div>
    )
  }

  // Prefer the exact total when we have it; otherwise fall back to the displayed
  // length with a "+" when it pins to the page size (e.g. the price-drops path).
  const exact = totalCount != null
  const total = exact ? (totalCount as number) : listings.length
  const approx = !exact && listings.length === PAGE_SIZE
  const from = (page - 1) * PAGE_SIZE
  const rangeStart = from + 1
  const rangeEnd = from + listings.length
  // Pagination only makes sense when we know the exact total (the price-drops
  // path narrows column-to-column in JS and reports totalCount = null).
  const totalPages = exact ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1
  const showPager = exact && totalPages > 1
  const hasPrev = page > 1
  const hasNext = exact && page < totalPages

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        {exact ? (
          <>
            Showing <span className="font-medium text-slate-700">{rangeStart.toLocaleString()}</span>–
            <span className="font-medium text-slate-700">{rangeEnd.toLocaleString()}</span> of{' '}
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> aircraft for sale
          </>
        ) : (
          <>
            {total.toLocaleString()} aircraft for sale{approx ? '+' : ''} found
          </>
        )}
      </p>
      <div className="space-y-4">
        {listings.map((p) => (
          <AircraftSaleCard key={p.id} p={p} />
        ))}
      </div>

      {showPager && (
        <nav
          className="mt-8 flex flex-wrap items-center justify-between gap-3"
          aria-label="Pagination"
        >
          {hasPrev ? (
            <Link
              href={pageHref(filters, page - 1)}
              rel="prev"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-600"
            >
              ← Previous
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-300">
              ← Previous
            </span>
          )}

          <span className="sr-only">
            Page {page.toLocaleString()} of {totalPages.toLocaleString()}
          </span>
          <span className="flex flex-wrap items-center justify-center gap-1.5" aria-hidden="false">
            {pageWindow(page, totalPages).map((entry, i) =>
              entry === 'gap' ? (
                <span
                  key={`gap-${i}`}
                  className="px-1 text-sm text-slate-400 select-none"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : entry === page ? (
                <span
                  key={entry}
                  aria-current="page"
                  className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border border-sky-500 bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm"
                >
                  {entry.toLocaleString()}
                </span>
              ) : (
                <Link
                  key={entry}
                  href={pageHref(filters, entry)}
                  aria-label={`Page ${entry}`}
                  className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-600"
                >
                  {entry.toLocaleString()}
                </Link>
              )
            )}
          </span>

          {hasNext ? (
            <Link
              href={pageHref(filters, page + 1)}
              rel="next"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-600"
            >
              Next →
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-300">
              Next →
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
