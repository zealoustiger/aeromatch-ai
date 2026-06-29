import { MapPin, Plane, Mail } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import OutreachStatusSelect from '@/components/OutreachStatusSelect'

export const metadata = { title: 'Outreach', robots: { index: false } }
export const dynamic = 'force-dynamic'

type Target = {
  id: string
  n_number: string
  owner: string | null
  make: string | null
  model: string | null
  year: number | null
  airport: string | null
  city: string | null
  street: string | null
  zip: string | null
  mode_s_hex: string | null
  registrant_type: string | null
  based_confidence: string | null
  status: string
  channel: string | null
  notes: string | null
  contacted_at: string | null
  confirmed_base: string | null
  adsb_summary: string | null
  base_checked_at: string | null
}

const STATUS_LABEL: Record<string, string> = {
  not_contacted: 'Not contacted',
  contacted: 'Contacted',
  replied: 'Replied',
  meeting: 'Meeting',
  joined: 'Joined',
  dead: 'Dead',
}
const FUNNEL = ['not_contacted', 'contacted', 'replied', 'meeting', 'joined'] as const

function confidenceLabel(c: string | null): { text: string; cls: string } {
  switch (c) {
    case 'adsb-confirmed':
      return { text: 'ADS-B confirmed', cls: 'text-emerald-600' }
    case 'address-hangar':
      return { text: 'Hangar address', cls: 'text-sky-600' }
    case 'address-residential':
      return { text: 'Home address', cls: 'text-amber-600' }
    case 'no-adsb-data':
      return { text: 'No ADS-B data', cls: 'text-slate-400' }
    default:
      return { text: 'Unconfirmed', cls: 'text-slate-400' }
  }
}

export default async function OutreachTab() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('outreach_targets')
    .select('*')
    .order('airport', { ascending: true })
    .order('year', { ascending: false })

  const targets = (data ?? []) as Target[]

  // Funnel + per-airport counts.
  const counts: Record<string, number> = {}
  for (const t of targets) counts[t.status] = (counts[t.status] ?? 0) + 1
  const byAirport: Record<string, number> = {}
  for (const t of targets) if (t.airport) byAirport[t.airport] = (byAirport[t.airport] ?? 0) + 1
  const contacted = targets.filter((t) => t.status !== 'not_contacted').length

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Plane className="h-5 w-5 text-sky-500" /> GTM Outreach
        </h2>
        <p className="text-xs text-slate-400">
          {targets.length} targets · {contacted} contacted ·{' '}
          {Object.entries(byAirport)
            .map(([a, n]) => `${a} ${n}`)
            .join(' · ')}
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-rose-600">Couldn&apos;t load targets: {error.message}</p>
      )}

      {/* Funnel summary */}
      <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {FUNNEL.map((s) => (
          <div key={s} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center">
            <p className="text-xl font-bold text-slate-900">{counts[s] ?? 0}</p>
            <p className="text-[11px] font-medium text-slate-500">{STATUS_LABEL[s]}</p>
          </div>
        ))}
        <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-rose-700">{counts.dead ?? 0}</p>
          <p className="text-[11px] font-medium text-rose-500">Dead</p>
        </div>
      </div>

      {/* Targets table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
              <th className="py-2 pr-3 font-medium">Field</th>
              <th className="py-2 pr-3 font-medium">Aircraft</th>
              <th className="py-2 pr-3 font-medium">Owner</th>
              <th className="py-2 pr-3 font-medium">Location</th>
              <th className="py-2 pr-3 font-medium">Based</th>
              <th className="py-2 pr-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((t) => {
              const conf = confidenceLabel(t.based_confidence)
              return (
                <tr key={t.id} className="border-b border-slate-50 align-top last:border-0">
                  <td className="py-2.5 pr-3">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-600">
                      {t.airport}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="font-mono text-xs font-semibold text-slate-900">{t.n_number}</div>
                    <div className="text-xs text-slate-500">
                      {[t.year, t.make, t.model].filter(Boolean).join(' ')}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="text-slate-800">{t.owner}</div>
                    {t.registrant_type && (
                      <div className="text-[11px] text-slate-400">{t.registrant_type}</div>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      {t.city}
                      {t.zip ? `, ${t.zip}` : ''}
                    </div>
                    {t.street && <div className="text-[11px] text-slate-400">{t.street}</div>}
                  </td>
                  <td className="py-2.5 pr-3">
                    {t.confirmed_base ? (
                      <>
                        <span
                          className={`text-xs font-semibold ${
                            t.airport && t.confirmed_base.toUpperCase() === t.airport.toUpperCase()
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                          title={t.adsb_summary ?? undefined}
                        >
                          ADS-B: {t.confirmed_base}
                          {t.airport && t.confirmed_base.toUpperCase() !== t.airport.toUpperCase()
                            ? ` (not ${t.airport})`
                            : ''}
                        </span>
                        {t.adsb_summary && (
                          <div className="text-[11px] text-slate-400">{t.adsb_summary}</div>
                        )}
                      </>
                    ) : (
                      <span className={`text-xs font-medium ${conf.cls}`}>{conf.text}</span>
                    )}
                    {t.mode_s_hex && (
                      <div className="font-mono text-[11px] text-slate-400">{t.mode_s_hex}</div>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    <OutreachStatusSelect id={t.id} status={t.status} />
                    {t.contacted_at && (
                      <div className="mt-1 text-[11px] text-slate-400">
                        {new Date(t.contacted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {targets.length === 0 && !error && (
        <p className="py-6 text-center text-sm text-slate-400">No outreach targets yet.</p>
      )}

      <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-400">
        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Seeded from the FAA registry (KHWD East Bay pull + KOAK/KCCR Cirrus). “Based” reflects the
        registration address only — ADS-B flight-history confirmation is the next step to verify a
        plane is truly hangared at the field.
      </p>
    </section>
  )
}
