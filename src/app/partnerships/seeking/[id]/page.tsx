import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, Calendar, ChevronLeft, Search, Handshake, ArrowRight } from 'lucide-react'
import PartnershipLaunchBanner from '@/components/PartnershipLaunchBanner'
import { getSeekerCount } from '@/lib/seekersQuery'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PartnershipSeeker } from '@/lib/types'
import { anonymizeName, formatPrice, formatShareType, travelLabel } from '@/lib/utils'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import AviatorAvatar from '@/components/AviatorAvatar'
import SeekerContactBar from '@/components/SeekerContactBar'
import SaveListingButton from '@/components/SaveListingButton'
import SavedListingNote from '@/components/SavedListingNote'
import ShareListingButton from '@/components/ShareListingButton'
import PartnershipCard from '@/components/PartnershipCard'
import { getPartnershipListings } from '@/lib/partnershipsQuery'
import { MOCK_SEEKERS } from '@/lib/mockData'
import { getSeekerBudgetCheck } from '@/lib/partnershipComps'
import SeekerBudgetCheck from '@/components/SeekerBudgetCheck'
import SeekerDealSignals from '@/components/SeekerDealSignals'
import PartnerShareCostPanel from '@/components/PartnerShareCostPanel'
import SeekerTrustBadge from '@/components/SeekerTrustBadge'
import SeekerListingOwnerNudge from '@/components/SeekerListingOwnerNudge'
import MatchCountNudge from '@/components/MatchCountNudge'
import { countMatchingPartnershipsForSeeker, partnershipBrowseHrefForSeeker } from '@/lib/matchingQuery'
import AlertSignup from '@/components/AlertSignup'
import SimilarSeekers from '@/components/SimilarSeekers'

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


const MATCH_LIMIT = 4

const DAY_MS = 24 * 60 * 60 * 1000

// Redfin-style days-on-market label — mirrors SeekerCard's listedAgo exactly, so
// the browse card and this detail page always agree on how "fresh" a listing reads.
function listedAgo(createdAt: string | null): string | null {
  if (!createdAt) return null
  const then = new Date(createdAt).getTime()
  if (Number.isNaN(then)) return null
  const days = Math.floor((Date.now() - then) / DAY_MS)
  if (days <= 0) return 'Listed today'
  if (days === 1) return 'Listed 1 day ago'
  if (days < 7) return `Listed ${days} days ago`
  if (days < 14) return 'Listed 1 week ago'
  if (days < 30) return `Listed ${Math.floor(days / 7)} weeks ago`
  if (days < 60) return 'Listed 1 month ago'
  if (days < 365) return `Listed ${Math.floor(days / 30)} months ago`
  const years = Math.floor(days / 365)
  return years === 1 ? 'Listed 1 year ago' : `Listed ${years} years ago`
}

/**
 * Find up to 4 active partnerships that match this seeker's location and
 * aircraft preference. Airport-first; falls back to state if the airport
 * returns nothing. Self-suppresses (returns []) when no sensible match exists.
 */
async function getMatchingPartnerships(s: PartnershipSeeker) {
  const make = s.preferred_makes?.length === 1 ? s.preferred_makes[0] : undefined
  const buyin = s.max_buy_in != null ? String(s.max_buy_in) : undefined

  const { listings } = await getPartnershipListings({
    airport: s.home_airport,
    ...(make ? { make } : {}),
    ...(buyin ? { max_buyin: buyin } : {}),
  })
  if (listings.length > 0) return listings.slice(0, MATCH_LIMIT)

  if (!s.state) return []
  const { listings: byState } = await getPartnershipListings({
    state: s.state,
    ...(make ? { make } : {}),
    ...(buyin ? { max_buyin: buyin } : {}),
  })
  return byState.slice(0, MATCH_LIMIT)
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const s = await getSeeker(id)
  if (!s) return { title: 'Listing not found' }

  const location = [s.home_airport, s.city, s.state].filter(Boolean).join(', ')
  const title = `${s.title} | ${SITE_NAME}`
  const description =
    s.description?.slice(0, 155) ??
    `A pilot looking for a partnership share${location ? ` near ${location}` : ''}${
      s.max_buy_in ? ` — up to ${formatPrice(s.max_buy_in)} buy-in` : ''
    }. See the full listing on ClubHanger.`

  const url = `${SITE_URL}/partnerships/seeking/${s.id}`

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
      // Seeker listings have no photo (the avatar is a generated SVG, not a real
      // photo), so this always falls back to the site default — never fabricated.
      images: [{ url: DEFAULT_OG_IMAGE, alt: s.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_OG_IMAGE] },
  }
}

export default async function SeekerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  const sp = searchParams ? await searchParams : {}
  const justPosted = sp.posted === '1'
  const justUpdated = sp.updated === '1'
  const s = await getSeeker(id)
  if (!s) notFound()

  const hdrs = await headers()
  const visitorRegion = hdrs.get('x-vercel-ip-country-region')
    ? decodeURIComponent(hdrs.get('x-vercel-ip-country-region')!)
    : null
  const supabase = await createServerSupabaseClient()
  const [matches, seekerCount, budgetCheck] = await Promise.all([
    getMatchingPartnerships(s),
    getSeekerCount(),
    getSeekerBudgetCheck(supabase, s),
  ])

  // Fetch the current user's saved row for this listing so we can:
  // (a) pass the real initialSaved state (eliminates the heart-state flash), and
  // (b) render the note editor if the user has saved this listing — mirroring the
  // aircraft/partnership detail pages.
  const { data: { user } } = await supabase.auth.getUser()
  let savedRowId: string | null = null
  let savedNote: string | null = null
  let notesEnabled = false
  if (user) {
    // Try to select with the note column; fall back gracefully when the column
    // hasn't been migrated yet (same pattern as the /saved page and aircraft/partnership).
    const withNote = await supabase
      .from('saved_listings')
      .select('id, note')
      .eq('user_id', user.id)
      .eq('listing_id', s.id)
      .eq('listing_type', 'seeker')
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
        .eq('listing_id', s.id)
        .eq('listing_type', 'seeker')
        .maybeSingle()
      savedRowId = fallback.data?.id ?? null
    }
  }
  const isOwner = !!user && !!s.poster_id && user.id === s.poster_id
  // Owner-only compatibility count — never computed for a visitor's page load.
  const matchingPartnershipCount = isOwner ? await countMatchingPartnershipsForSeeker(s) : 0

  // Owner-only "alert me for new matches" — same `/partnerships?make=&airport=`
  // query-string shape alert-digest's existing parseSourcePath already understands
  // (mirrors the /partnerships hub's alertMake/alertAirport/alertSourcePath pattern),
  // built from this seeker's own stated preferences so it's a genuine standing match.
  const alertMake = s.preferred_makes?.length === 1 ? s.preferred_makes[0] : undefined
  const alertAirport = s.home_airport || undefined
  const alertLocationClause = alertAirport ? `near ${alertAirport}` : undefined
  const alertContext = [alertMake, alertLocationClause].filter(Boolean).join(' ') || undefined
  const alertQuery = new URLSearchParams({
    ...(alertMake ? { make: alertMake } : {}),
    ...(alertAirport ? { airport: alertAirport } : {}),
  }).toString()
  const alertSourcePath = alertQuery ? `/partnerships?${alertQuery}` : '/partnerships'

  // Privacy-by-default: show the pilot as "First L." Contact details (email/phone)
  // are handled client-side by SeekerContactBar so they're never in public HTML.
  const displayName = anonymizeName(s.contact_name)

  const aircraftWant = [
    s.preferred_makes?.join(', '),
    s.preferred_models,
  ].filter(Boolean).join(' — ') || 'Open to any aircraft'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/partnerships/seeking"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Seeking Listings
        </Link>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <ShareListingButton url={`${SITE_URL}/partnerships/seeking/${s.id}`} />
            <SaveListingButton listingId={s.id} listingType="seeker" initialSaved={!!savedRowId} variant="full" />
          </div>
          {notesEnabled && savedRowId && (
            <SavedListingNote savedRowId={savedRowId} note={savedNote} />
          )}
        </div>
      </div>

      {/* Post-publish confirmation — shown once when redirected from the seeking post form */}
      {justPosted && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="font-semibold text-emerald-800">Your seeking listing is live!</p>
          <p className="mt-0.5 text-sm text-emerald-700">
            Aircraft owners looking for partners can now find you.{' '}
            <Link
              href={`/partnerships${s.home_airport ? `?airport=${s.home_airport}` : ''}`}
              className="font-medium underline hover:text-emerald-900"
            >
              Browse partnerships{s.home_airport ? ` near ${s.home_airport}` : ''} →
            </Link>
          </p>
          <p className="mt-1.5 text-sm text-emerald-700">
            <Link href="/listings" className="font-medium underline hover:text-emerald-900">
              View all my listings →
            </Link>
          </p>
        </div>
      )}

      {/* Post-edit confirmation — shown once when redirected from the edit form */}
      {justUpdated && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="font-semibold text-emerald-800">Your changes are saved.</p>
          <p className="mt-0.5 text-sm text-emerald-700">
            {s.title} is updated and live.{' '}
            <Link href="/listings" className="font-medium underline hover:text-emerald-900">
              View all my listings →
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Pilot header — aviator avatar (seeded by id) + anonymized name */}
            <div className="mb-5 flex items-center gap-3">
              <AviatorAvatar seed={s.id} size={64} />
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900">{displayName || 'A pilot'}</p>
                <p className="text-sm text-slate-500">Seeking a partnership share</p>
              </div>
            </div>

            {/* Badges */}
            <div className="mb-4 flex flex-wrap gap-2">
              {s.total_hours && (
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
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
                {s.additional_airports && s.additional_airports.length > 0 && (
                  <span className="text-slate-400"> · also: {s.additional_airports.join(', ')}</span>
                )}
                {s.willing_to_travel_nm && ` (willing to commute ${travelLabel(s.willing_to_travel_nm)})`}
              </span>
              {listedAgo(s.created_at) && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {listedAgo(s.created_at)}
                </span>
              )}
            </div>

            {s.description && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">About me</h2>
                <p className="whitespace-pre-line text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — key match facts sit beside the contact CTA */}
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

          {/* Synthesis panel — same "how this stacks up" tally the aircraft and
              partnership detail pages already show, sitting above the more detailed
              budget-check panel just like its siblings sit above their own comp panels. */}
          <SeekerDealSignals
            s={s}
            budgetCheck={budgetCheck ? { make: budgetCheck.make, result: budgetCheck.result } : null}
          />

          {budgetCheck && (
            <SeekerBudgetCheck
              make={budgetCheck.make}
              shareType={budgetCheck.shareType}
              result={budgetCheck.result}
            />
          )}

          {(s.max_monthly || s.max_hourly) && (
            <div>
              <p className="mb-2 px-1 text-xs text-slate-400">
                Projected from this pilot&apos;s stated maximum budget — not a confirmed cost.
              </p>
              <PartnerShareCostPanel
                buyInPrice={s.max_buy_in}
                monthlyFixed={s.max_monthly}
                hourlyWet={s.max_hourly}
                shareType={s.preferred_share_types?.length === 1 ? s.preferred_share_types[0] : null}
              />
            </div>
          )}

          {/* Aircraft preferences — in the right rail so the key match facts sit
              beside the contact CTA; single-column grid to fit the narrow rail. */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Aircraft Preferences</h2>
            <dl className="grid gap-3">
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
            </dl>
          </div>

          {/* Flying profile */}
          {(s.hours_per_month || (s.intended_use && s.intended_use.length > 0)) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Flying Profile</h2>
              <dl className="grid gap-3">
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

          {/* Owner-only "Improve your listing" nudge — shown only to the
              listing's owner, names exactly which trust signals below are
              still missing. Same placement convention (directly above the
              trust checklist) as the aircraft/partnership detail pages. */}
          {isOwner && (
            <SeekerListingOwnerNudge s={s} editHref={`/partnerships/seeking/${id}/edit`} />
          )}

          {/* Owner-only "N matches" — slice 1 of the compatibility matching
              engine. Honest count of active partnership listings compatible
              with this seeker's stated make/budget/hours/ratings/share-type
              preferences (src/lib/matching.ts); self-suppresses at 0. */}
          {isOwner && (
            <MatchCountNudge
              count={matchingPartnershipCount}
              label="Available partnerships match what you're looking for."
              href={partnershipBrowseHrefForSeeker(s)}
            />
          )}

          {/* Trust / completeness — checklist variant, same canonical signals
              as the browse-card compact chip, same sidebar placement (just
              above the contact card) as the aircraft/partnership pages. */}
          <SeekerTrustBadge s={s} variant="checklist" />

          {/* Contact card — client component handles auth so contact details
              are never rendered in the public (crawlable) server HTML. */}
          <SeekerContactBar
            seekerId={s.id}
            seekerOwnerId={s.poster_id}
            seekerPath={`/partnerships/seeking/${id}`}
            title={s.title}
            displayName={displayName}
            contactEmail={s.contact_email}
            contactPhone={s.contact_phone}
            contactMethod={s.contact_method}
          />
        </div>
      </div>

      {/* Matching partnerships — show up to 4 open partnerships near this
          seeker's airport (or state as a fallback) that fit their preferences.
          Self-suppresses entirely when no sensible match exists. */}
      {matches.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Handshake className="h-5 w-5 text-sky-600" />
            Partnerships near {s.home_airport}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {matches.map((p) => (
              <PartnershipCard key={p.id} p={p} />
            ))}
          </div>
          <div className="mt-4">
            <Link
              href={`/partnerships?airport=${encodeURIComponent(s.home_airport)}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
            >
              Browse all partnerships near {s.home_airport} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Owner-only "alert me for new matches" — closes the "instant payoff" backlog
          item's remaining gap now that currently-matching partnerships already render
          above: a seeker with 0 (or a full page of) matches today can still get
          notified the moment a new one appears. Renders independent of match count. */}
      {isOwner && (
        <AlertSignup context={alertContext} sourcePath={alertSourcePath} noun="partnership" />
      )}

      {/* "Similar pilots also seeking" — same-make/airport/state comparables rail,
          closing the last gap of the "similar listing" pattern already shipped on
          the aircraft and partnership detail pages. Self-suppresses at 0 matches. */}
      <div className="mt-10">
        <SimilarSeekers current={s} />
      </div>

      <PartnershipLaunchBanner
        visitorState={visitorRegion}
        seekerCount={seekerCount}
        sourcePath={`/partnerships/seeking/${id}`}
      />
    </div>
  )
}
