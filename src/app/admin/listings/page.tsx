import Link from 'next/link'
import { ExternalLink, EyeOff, Eye } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
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

  const [{ data: partnerships }, { data: aircraft }] = await Promise.all([
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
  ])

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
