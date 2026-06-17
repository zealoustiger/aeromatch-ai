import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Bookmark, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import DeleteSearchButton from '@/components/DeleteSearchButton'
import type { SavedSearch } from '@/lib/types'

function describeSearch(params: string): string {
  const p = new URLSearchParams(params)
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
            Head to the{' '}
            <Link href="/partnerships" className="text-sky-600 hover:underline underline-offset-2">
              partnerships page
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
                <p className="font-semibold text-slate-900">{s.name}</p>
                <p className="mt-0.5 truncate text-sm text-slate-500">{describeSearch(s.search_params)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Saved {new Date(s.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-1 sm:flex-row sm:items-center">
                <Link
                  href={`/partnerships?${s.search_params}`}
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
