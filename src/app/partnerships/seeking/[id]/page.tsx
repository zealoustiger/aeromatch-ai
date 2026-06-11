import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, Calendar, ChevronLeft, Mail, Phone, Search } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PartnershipSeeker } from '@/lib/types'
import { formatPrice, formatShareType } from '@/lib/utils'
import { MOCK_SEEKERS } from '@/lib/mockData'

const CATEGORY_LABELS: Record<string, string> = {
  sel: 'Single-Engine Land',
  mel: 'Multi-Engine',
  turboprop: 'Turboprop',
  jet: 'Jet',
  any: 'Any Type',
}

const USE_LABELS: Record<string, string> = {
  personal_travel: 'Personal Travel',
  weekend_trips: 'Weekend Trips',
  cross_country: 'Cross Country',
  instrument_currency: 'Instrument Currency',
  training: 'Training / Hours Building',
  other: 'Other',
}

async function getSeeker(id: string): Promise<PartnershipSeeker | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) {
    return MOCK_SEEKERS.find((s) => s.id === id) ?? null
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('partnership_seekers').select('*').eq('id', id).single()
  return data
}

export default async function SeekerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await getSeeker(id)
  if (!s) notFound()

  const aircraftWant = [
    s.preferred_makes?.join(', '),
    s.preferred_models,
  ].filter(Boolean).join(' — ') || 'Open to any aircraft'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/partnerships/seeking"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Seeking Listings
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Badges */}
            <div className="mb-4 flex flex-wrap gap-2">
              {s.total_hours && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {s.total_hours} total hours
                </span>
              )}
              {s.ratings_held && s.ratings_held.map((r) => (
                <span key={r} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  {r}
                </span>
              ))}
            </div>

            <h1 className="text-2xl font-bold text-slate-900">{s.title}</h1>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                <strong className="font-semibold text-slate-700">{s.home_airport}</strong>
                {s.city && ` · ${s.city}, ${s.state}`}
                {s.willing_to_travel_nm && ` (willing to travel ±${s.willing_to_travel_nm} nm)`}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                Posted {new Date(s.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {s.description && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">About me</h2>
                <p className="whitespace-pre-line text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            )}
          </div>

          {/* Aircraft preferences */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Aircraft Preferences</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-400">Looking for</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-800">
                  <Search className="h-4 w-4 text-slate-400" /> {aircraftWant}
                </dd>
              </div>
              {s.aircraft_category && (
                <div>
                  <dt className="text-xs text-slate-400">Category</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{CATEGORY_LABELS[s.aircraft_category] ?? s.aircraft_category}</dd>
                </div>
              )}
              {(s.min_year || s.max_year) && (
                <div>
                  <dt className="text-xs text-slate-400">Year range</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">
                    {s.min_year ?? '—'} – {s.max_year ?? 'present'}
                  </dd>
                </div>
              )}
              {s.preferred_share_types && s.preferred_share_types.length > 0 && (
                <div>
                  <dt className="text-xs text-slate-400">Preferred share types</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {s.preferred_share_types.map((t) => (
                      <span key={t} className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                        {formatShareType(t)}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {s.preferred_scheduling && (
                <div>
                  <dt className="text-xs text-slate-400">Preferred scheduling</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{s.preferred_scheduling}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Flying profile */}
          {(s.hours_per_month || (s.intended_use && s.intended_use.length > 0)) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Flying Profile</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                {s.hours_per_month && (
                  <div>
                    <dt className="text-xs text-slate-400">Expected hours/month</dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-800">
                      <Clock className="h-4 w-4 text-slate-400" /> ~{s.hours_per_month} hours
                    </dd>
                  </div>
                )}
                {s.intended_use && s.intended_use.length > 0 && (
                  <div>
                    <dt className="text-xs text-slate-400">Intended use</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {s.intended_use.map((u) => (
                        <span key={u} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {USE_LABELS[u] ?? u}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Budget card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Budget</h2>
            <dl className="space-y-3">
              {s.max_buy_in && (
                <div>
                  <dt className="text-xs text-slate-400">Max Buy-In</dt>
                  <dd className="text-2xl font-bold text-slate-900">{formatPrice(s.max_buy_in)}</dd>
                </div>
              )}
              {s.max_monthly && (
                <div>
                  <dt className="text-xs text-slate-400">Max Monthly</dt>
                  <dd className="text-lg font-semibold text-slate-800">{formatPrice(s.max_monthly)}<span className="text-sm font-normal text-slate-400">/mo</span></dd>
                </div>
              )}
              {s.max_hourly && (
                <div>
                  <dt className="text-xs text-slate-400">Max Wet Rate</dt>
                  <dd className="text-lg font-semibold text-slate-800">{formatPrice(s.max_hourly)}<span className="text-sm font-normal text-slate-400">/hr</span></dd>
                </div>
              )}
              {!s.max_buy_in && !s.max_monthly && (
                <dd className="text-sm text-slate-400">Flexible — contact to discuss</dd>
              )}
            </dl>
          </div>

          {/* Contact card */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="mb-1 text-sm font-semibold text-emerald-800">Have a plane that fits?</h2>
            {s.contact_name && (
              <p className="mb-3 text-sm text-emerald-700">Reach out to {s.contact_name}</p>
            )}
            <div className="space-y-2">
              {(s.contact_method === 'email' || s.contact_method === 'both') && (
                <a
                  href={`mailto:${s.contact_email}?subject=Re: ${encodeURIComponent(s.title)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  <Mail className="h-4 w-4" /> Send Email
                </a>
              )}
              {(s.contact_method === 'phone' || s.contact_method === 'both') && s.contact_phone && (
                <a
                  href={`tel:${s.contact_phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  <Phone className="h-4 w-4" /> {s.contact_phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
