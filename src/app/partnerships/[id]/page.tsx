import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, Calendar, ChevronLeft } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership } from '@/lib/types'
import { formatPrice, formatShareType, aircraftLabel } from '@/lib/utils'
import { getPartnershipById } from '@/lib/partnerships'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import ContactBar from '@/components/ContactBar'
import ContactButtons from '@/components/ContactButtons'
import MessageOwnerButton from '@/components/MessageOwnerButton'
import AviatorAvatar from '@/components/AviatorAvatar'
import { isSeedProfile, personaFromPartnership } from '@/lib/seedProfiles'
import ListingViewTracker from '@/components/ListingViewTracker'
import ReportListing from '@/components/ReportListing'
import SaveListingButton from '@/components/SaveListingButton'
import SavedListingNote from '@/components/SavedListingNote'
import TrustBadge from '@/components/TrustBadge'
import ListingOwnerNudge from '@/components/ListingOwnerNudge'
import PhotoGallery from '@/components/PhotoGallery'
import SimilarListings from '@/components/SimilarListings'
import CostCalculator from '@/components/CostCalculator'
import ShareListingButton from '@/components/ShareListingButton'
import { shareFractionFromType } from '@/lib/calculators'

// Single-listing fetch reuses the shared `getPartnershipById` helper (the
// `/compare` view uses the same source of truth — no duplicated query).
const getPartnership = getPartnershipById

/**
 * Whether the signed-in viewer is this listing's owner.
 *
 * Owner = the member whose id matches the listing's `poster_id` (set to the
 * poster's `user.id` at create time). Returns false for logged-out visitors,
 * non-owners, and scraped listings (poster_id null). Read-only use of the frozen
 * supabase-server client. Gates the owner-only "Improve your listing" nudge.
 */
async function isListingOwner(posterId: string | null): Promise<boolean> {
  if (!posterId) return false
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return false

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && user.id === posterId
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

  const url = `${SITE_URL}/partnerships/${p.id}`
  // Use the listing's REAL photo when it has one (not the generic make
  // placeholder); otherwise fall back to the site default OG image so a shared
  // link always unfurls into a real card, never a broken/empty image.
  const hasRealPhoto = !!p.images?.[0] && p.image_is_placeholder !== true
  const ogImage = hasRealPhoto ? p.images![0] : DEFAULT_OG_IMAGE

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: ogImage, alt: `${aircraft} at ${p.home_airport}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
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

  const isOwner = await isListingOwner(p.poster_id)

  // Seed/demo persona (e.g. "Marcus T.") — owned by the concierge house account,
  // so it gets the on-site "Message {name}" flow + a member profile link instead
  // of a dead mailto. `persona` shapes the public-facing member identity.
  const seed = isSeedProfile(p)
  const persona = seed ? personaFromPartnership(p) : null

  // Scrub the synthetic demo contact so it never reaches the page payload / client
  // props (seed personas are contacted on-site only). Keeps the "real member"
  // surface clean even in view-source; the contact card branches on `seed` anyway.
  if (seed) {
    p.contact_email = ''
    p.contact_phone = null
  }

  // Fetch the current user's saved row for this partnership so we can:
  // (a) pass the real initialSaved state (eliminates the heart-state flash), and
  // (b) render the note editor if the user has saved this listing.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let savedRowId: string | null = null
  let savedNote: string | null = null
  let notesEnabled = false

  if (user) {
    // Try to select with the note column; fall back gracefully when the column
    // hasn't been migrated yet (same pattern as the /saved page and aircraft detail).
    const withNote = await supabase
      .from('saved_listings')
      .select('id, note')
      .eq('user_id', user.id)
      .eq('listing_id', p.id)
      .eq('listing_type', 'partnership')
      .maybeSingle()

    if (!withNote.error) {
      notesEnabled = true
      savedRowId = withNote.data?.id ?? null
      savedNote = withNote.data?.note ?? null
    } else {
      // note column not yet migrated (42703) or other error — id-only fallback.
      const fallback = await supabase
        .from('saved_listings')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', p.id)
        .eq('listing_type', 'partnership')
        .maybeSingle()
      savedRowId = fallback.data?.id ?? null
    }
  }
  const aircraft = aircraftLabel(p.make, p.model, p.year)
  const postedLabel = (p.posted_at ? new Date(`${p.posted_at}T00:00:00`) : new Date(p.created_at))
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <>
      {/* Warm cream page surface (Etsy × Airbnb token sweep, slice 5). The sticky
          mobile ContactBar stays OUTSIDE this wrap, exactly as /aircraft keeps its
          CompareTray outside the ch-surface wrap. */}
      <div className="ch-surface min-h-screen">
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
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/partnerships"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Partnerships
          </Link>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <ShareListingButton url={`${SITE_URL}/partnerships/${p.id}`} />
              <SaveListingButton listingId={p.id} initialSaved={!!savedRowId} variant="full" />
            </div>
            {notesEnabled && savedRowId && (
              <SavedListingNote savedRowId={savedRowId} note={savedNote} />
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2 lg:order-first">
            {/* Photo gallery — multi-photo with thumbnails + lightbox, degrades
                to a single image / make placeholder ("Not actual plane photo"). */}
            <PhotoGallery
              images={p.images}
              make={p.make}
              alt={`${aircraft} at ${p.home_airport}`}
              imageIsPlaceholder={p.image_is_placeholder}
            />

            <div className="ch-panel p-6">
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
              <div className="ch-panel p-6">
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
            <div className="ch-panel p-5">
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

            {/* Compact cost estimator — pre-filled from this listing's real
                numbers where available; degrades to sensible defaults when a
                field is missing (the component handles the nulls). Lets a buyer
                see their true monthly / per-hour cost right on the listing. */}
            <CostCalculator
              variant="compact"
              initialBuyIn={p.buy_in_price}
              initialMonthlyFixed={p.monthly_fixed}
              initialHourlyWet={p.hourly_wet}
              shareFraction={shareFractionFromType(p.share_type)}
            />

            {/* Structure card */}
            <div className="ch-panel p-5">
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

            {/* Owner-only "Improve your listing" nudge — slice 3. Renders only
                for the listing's owner and only when signals are missing. No
                existing per-listing edit route yet, so it links to the post
                flow (the only listing-management surface). */}
            {isOwner && <ListingOwnerNudge p={p} editHref="/partnerships/new" />}

            {/* Trust / completeness — slice 1 of the listing trust layer */}
            <TrustBadge p={p} variant="checklist" />

            {/* Contact card — desktop only (mobile uses sticky bar) */}
            <div className="hidden rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm lg:block">
              <h2 className="mb-3 text-sm font-semibold text-sky-800">Interested?</h2>
              {seed && persona ? (
                <>
                  {/* Member identity — avatar + name link to the profile, so the
                      persona reads as a real ClubHanger member you message on-site. */}
                  <Link
                    href={`/members/${persona.id}`}
                    className="group mb-4 flex items-center gap-3"
                  >
                    <AviatorAvatar seed={persona.avatarSeed} size={48} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-sky-700">
                        {persona.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {persona.homeAirport ? `Based at ${persona.homeAirport}` : 'View profile'}
                      </p>
                    </div>
                  </Link>
                  <MessageOwnerButton
                    listingId={p.id}
                    posterId={p.poster_id}
                    label={`Message ${persona.firstName}`}
                    returnPath={`/partnerships/${p.id}`}
                  />
                </>
              ) : (
                <>
                  {p.contact_name && (
                    <p className="mb-3 text-sm text-sky-700">Contact {p.contact_name}</p>
                  )}
                  <ContactButtons
                    listingId={p.id}
                    title={p.title}
                    contactEmail={p.contact_email}
                    contactPhone={p.contact_phone}
                    contactMethod={p.contact_method}
                    posterId={p.poster_id}
                  />
                </>
              )}
            </div>

            <div className="text-center">
              <ReportListing listingId={p.id} />
            </div>
          </div>
        </div>

        {/* Similar partnerships — real other listings (same make / state /
            airport), excludes this one, crawlable <Link> cards. Renders nothing
            when there are no sensible matches. */}
        <div className="mt-10">
          <SimilarListings current={p} />
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
        isSeed={seed}
      />
    </>
  )
}
