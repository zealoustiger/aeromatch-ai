import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Bookmark, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import DeleteSearchButton from '@/components/DeleteSearchButton'
import RenameSavedSearch from '@/components/RenameSavedSearch'
import type { SavedSearch } from '@/lib/types'

// Which marketplace a saved search belongs to. Defaults to partnerships for older rows.
function marketplaceLabel(path: string): string {
  if (path === '/aircraft') return 'Planes for Sale'
  if (path === '/partnerships/seeking') return 'Pilot Seekers'
  return 'Partnerships'
}

function describeAircraftSearch(p: URLSearchParams): string {
  const parts: string[] = []
  const make = p.get('make')
  const model = p.get('model')
  const state = p.get('state')
  const minYear = p.get('min_year')
  const maxPrice = p.get('max_price')
  const maxTt = p.get('max_tt')
  const q = p.get('q')

  if (make) parts.push(`Make: ${make}`)
  if (model) parts.push(`Model: ${model}`)
  if (state) parts.push(`State: ${state}`)
  if (minYear) parts.push(`Year ≥ ${minYear}`)
  if (maxPrice) parts.push(`≤$${Number(maxPrice).toLocaleString()}`)
  if (maxTt) parts.push(`≤ ${Number(maxTt).toLocaleString()} hrs total`)
  if (p.get('drops') === '1') parts.push('Price drops')
  if (q) parts.push(`“${q}”`)

  return parts.length > 0 ? parts.join(' · ') : 'All aircraft for sale'
}

function describePartnershipSearch(p: URLSearchParams): string {
  const parts: string[] = []
  const airports = p.get('airports')
  const airport = p.get('airport')
  const radius = p.get('radius')
  const state = p.get('state')
  const make = p.get('make')
  const shareType = p.get('share_type')
  const maxMonthly = p.get('max_monthly')
  const maxBuyIn = p.get('max_buyin')

  if (airports) parts.push(`Airports: ${airports}`)
  if (airport && radius) parts.push(`Within ${radius}mi of ${airport}`)
  else if (airport) parts.push(`Airport: ${airport}`)
  if (state) parts.push(`State: ${state}`)
  if (make) parts.push(`Make: ${make}`)
  if (shareType) parts.push(`Type: ${shareType}`)
  if (maxMonthly) parts.push(`≤$${Number(maxMonthly).toLocaleString()}/mo`)
  if (maxBuyIn) parts.push(`Buy-in ≤$${Number(maxBuyIn).toLocaleString()}`)

  return parts.length > 0 ? parts.join(' · ') : 'All partnerships'
}

function describeSeekerSearch(p: URLSearchParams): string {
  const parts: string[] = []
  const airports = p.get('airports')
  const airport = p.get('airport')
  const make = p.get('make')
  const rating = p.get('rating')
  const minHours = p.get('min_hours')
  const shareType = p.get('share_type')

  if (make) parts.push(`${make} seekers`)
  if (airports) parts.push(`near ${airports.toUpperCase()}`)
  else if (airport) parts.push(`near ${airport.toUpperCase()}`)
  if (rating) parts.push(rating.toUpperCase())
  if (minHours && Number.isFinite(Number(minHours))) parts.push(`${Number(minHours).toLocaleString()}+ hrs`)
  if (shareType) parts.push(shareType)

  return parts.length > 0 ? parts.join(' · ') : 'All seeker listings'
}

function describeSearch(params: string, path: string): string {
  const p = new URLSearchParams(params)
  if (path === '/aircraft') return describeAircraftSearch(p)
  if (path === '/partnerships/seeking') return describeSeekerSearch(p)
  return describePartnershipSearch(p)
}

export default async function SearchesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth?next=/searches')

  const { data: searches } = await supabase
    .from('saved_searches')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Bookmark className="h-6 w-6 text-sky-600" />
          My Saved Searches
        </h1>
        <p className="mt-1 text-slate-500">
          We'll notify you when new listings match your criteria.
        </p>
      </div>

      {!searches?.length ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-600">No saved searches yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Head to{' '}
            <Link href="/partnerships" className="text-sky-600 hover:underline underline-offset-2">
              partnerships
            </Link>{' '}
            or{' '}
            <Link href="/aircraft" className="text-sky-600 hover:underline underline-offset-2">
              planes for sale
            </Link>
            , set your filters, and click{' '}
            <strong className="text-slate-600">Save this search</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(searches as SavedSearch[]).map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <RenameSavedSearch id={s.id} name={s.name} />
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                    {marketplaceLabel(s.path)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500">{describeSearch(s.search_params, s.path)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Saved {new Date(s.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-1 sm:flex-row sm:items-center">
                <Link
                  href={`${s.path || '/partnerships'}?${s.search_params}`}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Link>
                <DeleteSearchButton id={s.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
