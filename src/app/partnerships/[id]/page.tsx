import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, DollarSign, Clock, Users, Calendar, ChevronLeft, Mail, Phone } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership } from '@/lib/types'
import { formatPrice, formatShareType, aircraftLabel } from '@/lib/utils'
import { MOCK_PARTNERSHIPS } from '@/lib/mockData'

async function getPartnership(id: string): Promise<Partnership | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) {
    return MOCK_PARTNERSHIPS.find((p) => p.id === id) ?? null
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('partnerships').select('*').eq('id', id).single()
  return data
}

export default async function PartnershipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getPartnership(id)
  if (!p) notFound()

  const aircraft = aircraftLabel(p.make, p.model, p.year)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/partnerships"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Partnerships
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Badges */}
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                {formatShareType(p.share_type)}
              </span>
              {p.registration && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono font-medium text-slate-600 ring-1 ring-slate-200">
                  {p.registration}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
            <p className="mt-1 text-lg font-medium text-slate-500">{aircraft}</p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                <strong className="font-semibold text-slate-700">{p.home_airport}</strong>
                {p.city && ` · ${p.city}, ${p.state}`}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                Listed {new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {p.description && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">About this listing</h2>
                <p className="whitespace-pre-line text-slate-600 leading-relaxed">{p.description}</p>
              </div>
            )}
          </div>

          {/* Requirements */}
          {(p.min_hours || (p.ratings_required && p.ratings_required.length > 0)) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Pilot Requirements</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                {p.min_hours && (
                  <div>
                    <dt className="text-xs text-slate-400">Minimum Hours</dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-800">
                      <Clock className="h-4 w-4 text-slate-400" /> {p.min_hours} hours
                    </dd>
                  </div>
                )}
                {p.ratings_required && p.ratings_required.length > 0 && (
                  <div>
                    <dt className="text-xs text-slate-400">Required Ratings</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {p.ratings_required.map((r) => (
                        <span key={r} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {r}
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
          {/* Cost card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Costs</h2>
            <dl className="space-y-3">
              {p.buy_in_price && (
                <div>
                  <dt className="text-xs text-slate-400">Buy-In</dt>
                  <dd className="text-2xl font-bold text-slate-900">{formatPrice(p.buy_in_price)}</dd>
                </div>
              )}
              {p.monthly_fixed && (
                <div>
                  <dt className="text-xs text-slate-400">Monthly Fixed</dt>
                  <dd className="text-lg font-semibold text-slate-800">{formatPrice(p.monthly_fixed)}<span className="text-sm font-normal text-slate-400">/mo</span></dd>
                </div>
              )}
              {p.hourly_wet && (
                <div>
                  <dt className="text-xs text-slate-400">Wet Rate</dt>
                  <dd className="text-lg font-semibold text-slate-800">{formatPrice(p.hourly_wet)}<span className="text-sm font-normal text-slate-400">/hr</span></dd>
                </div>
              )}
              {!p.buy_in_price && !p.monthly_fixed && (
                <dd className="text-sm text-slate-400">Contact for pricing details</dd>
              )}
            </dl>
          </div>

          {/* Structure card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Structure</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Share type</dt>
                <dd className="font-medium text-slate-700">{formatShareType(p.share_type)}</dd>
              </div>
              {p.total_shares && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Total partners</dt>
                  <dd className="font-medium text-slate-700">{p.total_shares}</dd>
                </div>
              )}
              {p.shares_available && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Shares available</dt>
                  <dd className="font-medium text-slate-700">{p.shares_available}</dd>
                </div>
              )}
              {p.scheduling_system && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Scheduling</dt>
                  <dd className="font-medium text-slate-700">{p.scheduling_system}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Contact card */}
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
            <h2 className="mb-1 text-sm font-semibold text-sky-800">Interested?</h2>
            {p.contact_name && (
              <p className="mb-3 text-sm text-sky-700">Contact {p.contact_name}</p>
            )}
            <div className="space-y-2">
              {(p.contact_method === 'email' || p.contact_method === 'both') && (
                <a
                  href={`mailto:${p.contact_email}?subject=Re: ${encodeURIComponent(p.title)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
                >
                  <Mail className="h-4 w-4" /> Send Email
                </a>
              )}
              {(p.contact_method === 'phone' || p.contact_method === 'both') && p.contact_phone && (
                <a
                  href={`tel:${p.contact_phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-white py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50"
                >
                  <Phone className="h-4 w-4" /> {p.contact_phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
