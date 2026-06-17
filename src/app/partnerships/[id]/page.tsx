import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, Calendar, ChevronLeft } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership } from '@/lib/types'
import { formatPrice, formatShareType, aircraftLabel } from '@/lib/utils'
import { MOCK_PARTNERSHIPS } from '@/lib/mockData'
import { SITE_URL } from '@/lib/seo'
import ContactBar from '@/components/ContactBar'
import ContactButtons from '@/components/ContactButtons'
import ListingViewTracker from '@/components/ListingViewTracker'
import ReportListing from '@/components/ReportListing'

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const p = await getPartnership(id)
  if (!p) return { title: 'Listing not found' }

  const aircraft = aircraftLabel(p.make, p.model, p.year)
  const location = [p.home_airport, p.city, p.state].filter(Boolean).join(', ')
  const title = `${aircraft} ${formatShareType(p.share_type)} at ${p.home_airport}`
  const description =
    p.description?.slice(0, 155) ??
    `${aircraft} aircraft partnership at ${location}.${p.buy_in_price ? ` Buy-in ${formatPrice(p.buy_in_price)}.` : ''}`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/partnerships/${p.id}` },
    openGraph: {
      title,
      description,
      images: p.images?.[0] ? [p.images[0]] : undefined,
    },
  }
}

function listingJsonLd(p: Partnership) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.description ?? undefined,
    image: p.images?.[0] ?? undefined,
    offers: p.buy_in_price
      ? {
          '@type': 'Offer',
          price: p.buy_in_price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          areaServed: [p.city, p.state].filter(Boolean).join(', ') || undefined,
        }
      : undefined,
  }
}

export default async function PartnershipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getPartnership(id)
  if (!p) notFound()

  const aircraft = aircraftLabel(p.make, p.model, p.year)
  const postedLabel = (p.posted_at ? new Date(`${p.posted_at}T00:00:00`) : new Date(p.created_at))
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <>
      {/* Extra bottom padding on mobile so sticky bar doesn't overlap content */}
      <div className="mx-auto max-w-4xl px-4 py-10 pb-24 sm:px-6 lg:px-8 lg:pb-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd(p)) }}
        />
        <ListingViewTracker
          listingId={p.id}
          airport={p.home_airport}
          make={p.make}
          shareType={p.share_type}
        />
        <Link
          href="/partnerships"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Partnerships
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2 lg:order-first">
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
                  <Link
                    href={`/airports/${p.home_airport.toLowerCase()}`}
                    className="font-semibold text-slate-700 hover:text-sky-700"
                  >
                    {p.home_airport}
                  </Link>
                  {p.city && ` · ${p.city}, ${p.state}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Posted {postedLabel}
                </span>
              </div>

              {p.description && (
                <div className="mt-6">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">About this listing</h2>
                  <p className="whitespace-pre-line leading-relaxed text-slate-600">{p.description}</p>
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

          {/* Sidebar — costs shown first on mobile, beside content on desktop */}
          <div className="space-y-4 order-first lg:order-last">
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
                    <dd className="text-lg font-semibold text-slate-800">
                      {formatPrice(p.monthly_fixed)}<span className="text-sm font-normal text-slate-400">/mo</span>
                    </dd>
                  </div>
                )}
                {p.hourly_wet && (
                  <div>
                    <dt className="text-xs text-slate-400">Wet Rate</dt>
                    <dd className="text-lg font-semibold text-slate-800">
                      {formatPrice(p.hourly_wet)}<span className="text-sm font-normal text-slate-400">/hr</span>
                    </dd>
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

            {/* Contact card — desktop only (mobile uses sticky bar) */}
            <div className="hidden rounded-xl border border-sky-200 bg-sky-50 p-5 lg:block">
              <h2 className="mb-1 text-sm font-semibold text-sky-800">Interested?</h2>
              {p.contact_name && (
                <p className="mb-3 text-sm text-sky-700">Contact {p.contact_name}</p>
              )}
              <ContactButtons
                listingId={p.id}
                title={p.title}
                contactEmail={p.contact_email}
                contactPhone={p.contact_phone}
                contactMethod={p.contact_method}
              />
            </div>

            <div className="text-center">
              <ReportListing listingId={p.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile contact bar */}
      <ContactBar
        listingId={p.id}
        posterId={p.poster_id}
        title={p.title}
        contactEmail={p.contact_email}
        contactPhone={p.contact_phone}
        contactMethod={p.contact_method}
        contactName={p.contact_name}
      />
    </>
  )
}
