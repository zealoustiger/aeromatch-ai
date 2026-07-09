import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, Calendar, ChevronLeft, Radio, Wrench, AlertTriangle, Plane, ArrowRight, ShieldAlert, Search } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership, AircraftForSale, PartnershipSeeker } from '@/lib/types'
import { formatPrice, formatShareType, aircraftLabel, formatPriceK } from '@/lib/utils'
import { getPartnershipById } from '@/lib/partnerships'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, resolveMakeModelFamily } from '@/lib/seo'
import { getFamilyAskingPrices, getForSaleCrossSell } from '@/lib/aircraftForSale'
import { computeImpliedValueCheck, type ImpliedValueResult } from '@/lib/partnershipImpliedValue'
import PartnershipLaunchBanner from '@/components/PartnershipLaunchBanner'
import { getSeekerCount, getSeekerCrossSell } from '@/lib/seekersQuery'
import SeekerRailCard from '@/components/SeekerRailCard'
import ContactBar from '@/components/ContactBar'
import ContactButtons from '@/components/ContactButtons'
import MessageOwnerButton from '@/components/MessageOwnerButton'
import AviatorAvatar from '@/components/AviatorAvatar'
import { isSeedProfile, personaFromPartnership } from '@/lib/seedProfiles'
import PosterAttribution from '@/components/PosterAttribution'
import { getPublicProfile } from '@/lib/publicProfile'
import ListingViewTracker from '@/components/ListingViewTracker'
import ReportListing from '@/components/ReportListing'
import MonetizationIntent from '@/components/MonetizationIntent'
import SaveListingButton from '@/components/SaveListingButton'
import SavedListingNote from '@/components/SavedListingNote'
import TrustBadge from '@/components/TrustBadge'
import ListingOwnerNudge from '@/components/ListingOwnerNudge'
import MatchCountNudge from '@/components/MatchCountNudge'
import { countMatchingSeekersForPartnership, seekerBrowseHrefForPartnership } from '@/lib/matchingQuery'
import PhotoGallery from '@/components/PhotoGallery'
import SimilarListings from '@/components/SimilarListings'
import AircraftRailCard from '@/components/AircraftRailCard'
import ShareListingButton from '@/components/ShareListingButton'
import PartnershipMarketCheck from '@/components/PartnershipMarketCheck'
import PartnerShareCostPanel from '@/components/PartnerShareCostPanel'
import { partnershipBuyInComp, partnershipDealVerdict, PartnerCompResult, PartnershipDealCheck } from '@/lib/partnershipComps'
import PartnershipDealSignals from '@/components/PartnershipDealSignals'
import ReviewsSection from '@/components/ReviewsSection'
import { classifyAvionics, computeIfrSuitability, type AvionicsInfo, type IfrTier } from '@/lib/avionicsClassify'
import { computeEngineLife, type EngineLifeResult } from '@/lib/engineLife'
import { computeAirframeUsage, type AirframeUsageResult } from '@/lib/airframeUsage'
import { computeOverhaulTimeline, type OverhaulTimelineResult } from '@/lib/overhaulTimeline'
import { computeAnnualStatus, type AnnualStatusResult } from '@/lib/annualStatus'
import { computeDamageHistory, type DamageHistoryResult } from '@/lib/damageHistory'
import { computeDaysOnMarketContext, type DaysOnMarketContext } from '@/lib/daysOnMarket'
import { countNearbyPartnerships, NEAR_RADIUS_NM, type NearbyCount } from '@/lib/nearbyPartnerships'

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

// Mirrors the aircraft-for-sale listing page's priceDrop() — only a real, recorded
// buy-in reduction counts (never fabricated); increases are shown in the deal-signals
// panel, not here.
function buyInDrop(p: Partnership): number | null {
  if (p.previous_buy_in_price != null && p.buy_in_price != null && p.buy_in_price < p.previous_buy_in_price) {
    return p.previous_buy_in_price - p.buy_in_price
  }
  return null
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

export default async function PartnershipDetailPage({
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
  const p = await getPartnership(id)
  if (!p) notFound()

  const hdrs = await headers()
  const visitorRegion = hdrs.get('x-vercel-ip-country-region')
    ? decodeURIComponent(hdrs.get('x-vercel-ip-country-region')!)
    : null
  const seekerCount = await getSeekerCount()

  const isOwner = await isListingOwner(p.poster_id)
  const buyInPriceDrop = buyInDrop(p)
  // Owner-only compatibility count — never computed for a visitor's page load.
  const matchingSeekerCount = isOwner ? await countMatchingSeekersForPartnership(p) : 0

  // Seed/demo persona (e.g. "Marcus T.") — owned by the concierge house account,
  // so it gets the on-site "Message {name}" flow + a member profile link instead
  // of a dead mailto. `persona` shapes the public-facing member identity.
  const seed = isSeedProfile(p)
  const persona = seed ? personaFromPartnership(p) : null

  // Real-poster attribution — the non-seed counterpart to `persona` above; only
  // when the poster actually has a `profiles` row (self-suppresses otherwise so
  // we never link to a page that 404s).
  const posterProfile = !seed && p.poster_id ? await getPublicProfile(p.poster_id) : null

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
  // Fetch buy-in prices + created_at of other active same-make partnerships for the
  // market check. created_at powers the listing-age context (domContext), which
  // uses the broader same-make set (a market-activity signal, not a price claim).
  // The buy-in verdict itself (partnerComp) is narrowed further, to the same
  // resolved make+model family, so a price claim never compares across models
  // (mirrors aircraftComps.ts's honesty bar). Fails soft.
  let partnerComp: PartnerCompResult | null = null
  let partnerDomContext: DaysOnMarketContext | null = null
  if (p.make) {
    try {
      const { data: comps } = await supabase
        .from('partnerships')
        .select('buy_in_price, total_shares, created_at, model')
        .eq('status', 'active')
        .eq('make', p.make)
        .neq('id', p.id)
        .limit(200)
      if (comps && comps.length > 0) {
        const subjectFamily = resolveMakeModelFamily(p.make, p.model)
        if (p.buy_in_price && p.total_shares && subjectFamily) {
          const otherComps = comps
            .filter(
              (c: { buy_in_price: number | null; model: string | null }) =>
                c.buy_in_price != null &&
                c.buy_in_price > 0 &&
                resolveMakeModelFamily(p.make, c.model)?.modelSlug === subjectFamily.modelSlug
            )
            .map((c: { buy_in_price: number | null; total_shares: number | null }) => ({
              buyIn: c.buy_in_price as number,
              totalShares: c.total_shares,
            }))
          partnerComp = partnershipBuyInComp(p.buy_in_price, p.total_shares, otherComps)
        }
        partnerDomContext = computeDaysOnMarketContext(
          p.created_at,
          comps.map((c: { created_at: string }) => c.created_at),
          Date.now(),
        )
      }
    } catch {
      partnerComp = null
      partnerDomContext = null
    }
  }

  // Deal check — the same comp family, additionally narrowed to similar year + similar
  // hours (ttaf/smoh), normalized for share size. Deliberately a SEPARATE query/try-catch
  // from the block above: `ttaf`/`smoh` on `partnerships` are dormant behind the
  // still-unapplied `partnership_add_spec_fields` migration, so an explicit select naming
  // them can 42703 in today's DB. If it does, this block alone degrades to null — it must
  // never take down the already-working whole-family `partnerComp` above.
  let partnerDeal: PartnershipDealCheck | null = null
  let partnerFamilyLabel: string | null = null
  if (p.make && p.buy_in_price && p.total_shares && p.total_shares >= 2 && p.year) {
    try {
      const subjectFamily = resolveMakeModelFamily(p.make, p.model)
      if (subjectFamily) {
        partnerFamilyLabel = `${subjectFamily.make} ${subjectFamily.model}`
        const { data: dealComps } = await supabase
          .from('partnerships')
          .select('buy_in_price, total_shares, model, year, ttaf, smoh')
          .eq('status', 'active')
          .eq('make', p.make)
          .neq('id', p.id)
          .limit(200)
        if (dealComps && dealComps.length > 0) {
          const otherDealComps = dealComps
            .filter(
              (c: { model: string | null }) =>
                resolveMakeModelFamily(p.make, c.model)?.modelSlug === subjectFamily.modelSlug
            )
            .map((c: { buy_in_price: number | null; total_shares: number | null; year: number | null; ttaf: number | null; smoh: number | null }) => ({
              buyIn: c.buy_in_price as number,
              totalShares: c.total_shares,
              year: c.year,
              ttaf: c.ttaf,
              smoh: c.smoh,
            }))
          partnerDeal = partnershipDealVerdict(
            { buyIn: p.buy_in_price, totalShares: p.total_shares, year: p.year, ttaf: p.ttaf, smoh: p.smoh },
            otherDealComps
          )
        }
      }
    } catch {
      partnerDeal = null
    }
  }

  // Cross-sell to whole-aircraft listings of the same make/model — the reverse
  // of the aircraft-for-sale detail page's `PartnershipCrossSellPanel`. Lets a
  // co-ownership shopper see "N Cessna 172s for sale" if they'd rather buy outright.
  const forSaleCrossSell = p.make ? await getForSaleCrossSell(p.make, p.model) : null

  // Seeker cross-sell — the third leg of "blend result types + cross-sell": other
  // pilots also actively looking for a share in this make, visible to every visitor
  // (distinct from the owner-only MatchCountNudge above, which only this listing's
  // owner sees).
  const seekerCrossSell = p.make ? await getSeekerCrossSell(p.make, p.model) : null

  // Implied aircraft value check — cross-silo sanity check comparing
  // (buy_in × total_shares) against the median asking price of same make/model
  // aircraft currently for sale on ClubHanger. Proprietary: no other listing site
  // fuses partnership share math with the for-sale market. Fails soft (null) when
  // make/model doesn't resolve a family, or fewer than 4 for-sale comps are available.
  let impliedValueCheck: ImpliedValueResult | null = null
  if (p.buy_in_price && p.total_shares && p.total_shares >= 2 && p.make && p.model) {
    try {
      const family = resolveMakeModelFamily(p.make, p.model)
      if (family) {
        const forSalePrices = await getFamilyAskingPrices(
          family.make,
          family.modelPattern,
          family.notModelPattern,
        )
        impliedValueCheck = computeImpliedValueCheck(p.buy_in_price, p.total_shares, forSalePrices)
      }
    } catch {
      impliedValueCheck = null
    }
  }

  const aircraft = aircraftLabel(p.make, p.model, p.year)
  const postedLabel = (p.posted_at ? new Date(`${p.posted_at}T00:00:00`) : new Date(p.created_at))
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Absolute listing-age string for the market check panel ("Listed 14 days ago").
  const DAY_MS = 86_400_000
  const partnerDaysOnMarket = Math.max(0, Math.floor((Date.now() - new Date(p.created_at).getTime()) / DAY_MS))
  const partnerListedAgo =
    partnerDaysOnMarket === 0
      ? 'Listed today'
      : partnerDaysOnMarket === 1
        ? 'Listed 1 day ago'
        : `Listed ${partnerDaysOnMarket} days ago`

  // Classify avionics capabilities from the partnership description text.
  // Partnerships don't have a structured avionics[] column; we split the description
  // into phrases and run the same keyword classifier so IFR buyers get capability
  // chips (Glass panel, ADS-B Out, Autopilot) without needing a DB schema change.
  // Self-suppresses (null) when no capabilities are detected.
  const descPhrases = p.description
    ? p.description.split(/[,;\n/]+/).map((s) => s.trim()).filter(Boolean)
    : null
  const avionicsInfo = classifyAvionics(descPhrases)

  const engineLife = computeEngineLife({ smoh: p.smoh, engineType: p.engine_type })

  // Airframe utilization — average hours flown per year over the aircraft's life
  // (ttaf ÷ age). Honesty-gated: self-suppresses when ttaf or year is missing. A
  // life-average rule of thumb, distinct from the SMOH-based Engine Life panel; the
  // shared airframe matters just as much to a co-ownership buyer.
  const airframeUsage = computeAirframeUsage({ ttaf: p.ttaf, year: p.year })

  // Annual-inspection status + damage-history read — same honesty-gated panels the
  // aircraft-for-sale detail page already ships (src/lib/annualStatus.ts,
  // src/lib/damageHistory.ts). Self-suppress when the field is null — never a
  // fabricated status.
  const annualStatus = computeAnnualStatus(p.annual_due, new Date())
  const damage = computeDamageHistory(p.damage_history)

  // Overhaul timeline — fuses the engine's hours-remaining-to-TBO with the shared aircraft's
  // OWN historical utilization into the calendar question a co-owner asks: "how many years
  // until an overhaul?" Self-suppresses when the engine is at/beyond TBO or utilization is
  // unknown, so it only enriches the Engine Life panel when the projection is honest.
  const overhaulTimeline =
    engineLife && !engineLife.beyondTbo && airframeUsage
      ? computeOverhaulTimeline({
          remainingHours: engineLife.remainingHours,
          hoursPerYear: airframeUsage.hoursPerYear,
        })
      : null

  // Nearby alternatives — count of other active partnerships within NEAR_RADIUS_NM
  // of this airport. Proprietary competitive context: buyers see at a glance whether
  // this is the only option near their home field or one of several. Fails soft (null).
  let nearbyCtx: NearbyCount | null = null
  try {
    const result = await countNearbyPartnerships(p.home_airport, p.id)
    if (result && result.count > 0) nearbyCtx = result
  } catch {
    nearbyCtx = null
  }

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

        {/* Post-publish confirmation — shown once when redirected from the partnership post form */}
        {justPosted && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="font-semibold text-emerald-800">Your partnership is live!</p>
            <p className="mt-0.5 text-sm text-emerald-700">
              Pilots searching for partnerships{p.home_airport ? ` near ${p.home_airport}` : ''} can now find you.{' '}
              <Link
                href={`/partnerships/seeking${p.home_airport ? `?airport=${p.home_airport}` : ''}`}
                className="font-medium underline hover:text-emerald-900"
              >
                Browse pilots who are seeking →
              </Link>
            </p>
            <p className="mt-1.5 text-sm text-emerald-700">
              <Link href="/listings" className="font-medium underline hover:text-emerald-900">
                View all my listings →
              </Link>
            </p>
            {/* Seller-upgrade intent signals — same honest fake-door pattern as the
                buyer-facing partnership-formation CTAs below, shown once at the
                poster's own post-listing moment. */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MonetizationIntent
                path="feature_listing"
                label="Feature this listing"
                title="Coming soon — want early access?"
                description="Get your listing featured with extra visibility so more pilots see it first. We're gauging interest before building this out — leave your email and we'll reach out when it's ready."
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              />
              <MonetizationIntent
                path="listing_vetting"
                label="Get it vetted"
                title="Coming soon — want early access?"
                description="Have your listing reviewed and vetted so pilots can trust it at a glance. We're gauging interest before building this out — leave your email and we'll reach out when it's ready."
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              />
            </div>
          </div>
        )}

        {/* Post-edit confirmation — shown once when redirected from the edit form */}
        {justUpdated && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="font-semibold text-emerald-800">Your changes are saved.</p>
            <p className="mt-0.5 text-sm text-emerald-700">
              {p.title} is updated and live.{' '}
              <Link href="/listings" className="font-medium underline hover:text-emerald-900">
                View all my listings →
              </Link>
            </p>
          </div>
        )}

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

            {/* Avionics & panel — capability chips + full equipment list for the
                shared aircraft. Self-suppresses when no avionics data was extracted. */}
            {avionicsInfo && <AvionicsPanel info={avionicsInfo} />}

            {/* "How this partnership stacks up" synthesis panel — mirrors the
                aircraft DealScorePanel; uses partnerComp already fetched above. */}
            <PartnershipDealSignals p={p} comp={partnerComp} impliedValue={impliedValueCheck} engineLife={engineLife} annualStatus={annualStatus} damage={damage} avionicsInfo={avionicsInfo} />

            {/* Engine life & overhaul reserve — proprietary panel using extracted
                smoh + engine_type. Self-suppresses when either field is missing or
                the engine type can't be matched to a known piston-GA TBO family. */}
            {engineLife && <EngineLifePanel life={engineLife} timeline={overhaulTimeline} />}

            {/* Airframe time — average hrs/year over the aircraft's life, with honest
                two-sided guidance. Renders only when ttaf + year are both known. */}
            {airframeUsage && <AirframeUsagePanel usage={airframeUsage} />}

            {/* Annual-inspection status — self-suppresses when annual_due is
                missing/unparseable/outside the plausible annual window. */}
            {annualStatus && <AnnualStatusPanel status={annualStatus} />}

            {/* Damage-history read — self-suppresses when damage_history is unknown (null). */}
            {damage && <DamageHistoryPanel damage={damage} />}

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
          <div className="min-w-0 space-y-4 order-first lg:order-last">
            {/* Cost card */}
            <div className="ch-panel p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Costs</h2>
              <dl className="space-y-3">
                {p.buy_in_price && (
                  <div>
                    <dt className="text-xs text-slate-400">Buy-In</dt>
                    <dd className="text-2xl font-bold text-slate-900">{formatPrice(p.buy_in_price)}</dd>
                    {buyInPriceDrop != null && (
                      <p className="mt-0.5 text-xs text-slate-400 line-through">{formatPrice(p.previous_buy_in_price)}</p>
                    )}
                    {partnerComp && (
                      <p className={`mt-1 text-xs font-semibold ${
                        partnerComp.kind === 'below'
                          ? 'text-emerald-600'
                          : partnerComp.kind === 'above'
                            ? 'text-amber-600'
                            : 'text-slate-500'
                      }`}>
                        {partnerComp.kind === 'near'
                          ? `Around market · ~${formatPriceK(partnerComp.median)} expected for this share size · ${partnerComp.count} comps`
                          : `~${partnerComp.pct}% ${partnerComp.kind} market · ~${formatPriceK(partnerComp.median)} expected for this share size · ${partnerComp.count} comps`}
                      </p>
                    )}
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

            {/* Partnership market check — buy-in vs. same-make median + listing-age
                context. Self-suppresses when buy_in_price is null or fewer than 4
                same-make comps exist; listing-age footer additionally requires ≥5 comps
                with a known created_at (honesty floor from computeDaysOnMarketContext). */}
            {partnerComp && (
              <PartnershipMarketCheck
                comp={partnerComp}
                make={p.make}
                listed={partnerListedAgo}
                daysOnMarket={partnerDaysOnMarket}
                domContext={partnerDomContext}
                deal={partnerDeal}
                familyLabel={partnerFamilyLabel ?? undefined}
              />
            )}

            {/* Compact cost estimator — pre-filled from this listing's real
                annual cost at different flying rates + buy-in break-even vs.
                renting — purpose-built for the partnership co-ownership context. */}
            <PartnerShareCostPanel
              buyInPrice={p.buy_in_price}
              monthlyFixed={p.monthly_fixed}
              hourlyWet={p.hourly_wet}
              shareType={p.share_type}
              reservePerHour={engineLife?.reservePerHour}
              engineFamily={engineLife?.family}
            />

            {/* Nearby alternatives — other active partnerships within NEAR_RADIUS_NM.
                Proprietary competitive context: lets buyers see at a glance whether
                this is the only option near their home field or one of several.
                Self-suppresses when count is 0 (this is the only nearby option)
                or when the airport can't be resolved. */}
            {nearbyCtx && (
              <div className="ch-panel p-5">
                <h2 className="mb-1 text-sm font-semibold text-slate-800">
                  Also near {p.home_airport}
                </h2>
                <p className="text-sm text-slate-600">
                  {nearbyCtx.count} other active {nearbyCtx.count === 1 ? 'partnership' : 'partnerships'} within {NEAR_RADIUS_NM} nm
                  {nearbyCtx.city ? ` of ${nearbyCtx.city}${nearbyCtx.state ? `, ${nearbyCtx.state}` : ''}` : ''}
                </p>
                <Link
                  href={`/partnerships/near/${nearbyCtx.nearPath}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-800"
                >
                  Browse all {nearbyCtx.count} nearby <MapPin className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Whole-aircraft cross-sell — reverse of the aircraft-for-sale
                detail page's PartnershipCrossSellPanel. Self-suppresses when
                there are no active for-sale listings for this make/model. */}
            {forSaleCrossSell && p.make && (
              <ForSaleCrossSellPanel
                make={p.make}
                model={forSaleCrossSell.modelLevel ? (p.model ?? null) : null}
                count={forSaleCrossSell.count}
                minPrice={forSaleCrossSell.minPrice}
                samples={forSaleCrossSell.samples}
              />
            )}

            {/* Seeker cross-sell — real pilot demand for this make, visible to every
                visitor. Self-suppresses when there are no active matching seekers. */}
            {seekerCrossSell && p.make && (
              <SeekerCrossSellPanel
                make={p.make}
                model={seekerCrossSell.modelLevel ? (p.model ?? null) : null}
                count={seekerCrossSell.count}
                samples={seekerCrossSell.samples}
              />
            )}

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

            {/* Owner-only "N matches" — slice 1 of the compatibility matching
                engine. Honest count of active pilots-seeking-a-partnership
                listings compatible with this partnership's make/budget/hours/
                ratings/share-type (src/lib/matching.ts); self-suppresses at 0. */}
            {isOwner && (
              <MatchCountNudge
                count={matchingSeekerCount}
                label={`Pilot${matchingSeekerCount === 1 ? '' : 's'} seeking a partnership match what you're offering.`}
                href={seekerBrowseHrefForPartnership(p)}
              />
            )}

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
                  {posterProfile && <PosterAttribution profile={posterProfile} />}
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

            {/* Monetization intent signals — same honest fake-door pattern as
                the aircraft-for-sale listing page's broker/services CTAs,
                testing demand for partnership-formation and co-ownership
                management services before building either. Never claims the
                service exists; UI + waitlist capture only. */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-slate-800">More ways we can help</h2>
              <p className="mb-3 text-sm text-slate-500">
                We're exploring these too — let us know what you'd use.
              </p>
              <div className="grid grid-cols-1 gap-2">
                <MonetizationIntent
                  path="partnership_formation"
                  label="Help me form a partnership"
                  title="Coming soon — want early access?"
                  description="Get help finding partners, drafting an agreement, and structuring a new co-ownership from scratch. We're gauging interest before building this out — leave your email and we'll reach out when it's ready."
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-50"
                />
                <MonetizationIntent
                  path="co_ownership_management"
                  label="Manage my co-ownership"
                  title="Coming soon — want early access?"
                  description="Get help running an existing partnership — scheduling, cost-splitting, and partner communication in one place. We're gauging interest before building this out — leave your email and we'll reach out when it's ready."
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-50"
                />
              </div>
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

        {/* Reviews — real listings only; a seed/demo persona's listing isn't a
            real partnership someone can have actually experienced. */}
        {!seed && (
          <div className="mt-10">
            <ReviewsSection targetId={p.id} ownerId={p.poster_id} />
          </div>
        )}

        <PartnershipLaunchBanner
          visitorState={visitorRegion}
          seekerCount={seekerCount}
          sourcePath={`/partnerships/${p.id}`}
        />
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

// ─── For-Sale Cross-Sell Panel ───────────────────────────────────────────────
// Reverse of the aircraft-for-sale detail page's PartnershipCrossSellPanel:
// points a co-ownership shopper at whole aircraft for sale in the same make/model.

function ForSaleCrossSellPanel({
  make,
  model,
  count,
  minPrice,
  samples,
}: {
  make: string
  model: string | null
  count: number
  minPrice: number | null
  /** Up to 3 real matching for-sale listings to preview inline. Empty → no rail. */
  samples: AircraftForSale[]
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const makeEncoded = encodeURIComponent(make)
  const label = model ? `${make} ${model}` : make
  const ctaHref = model
    ? `/aircraft?make=${makeEncoded}&model=${encodeURIComponent(model)}`
    : `/aircraft?make=${makeEncoded}`
  return (
    <div className="ch-panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Plane className="h-4 w-4" /> Prefer to buy outright?
      </h2>
      <p className="text-sm font-medium text-slate-800">
        {count === 1 ? '1 whole aircraft' : `${count} whole aircraft`} for sale for{' '}
        {label} on ClubHanger.
      </p>
      {minPrice != null && (
        <p className="mt-1 text-sm text-slate-500">
          From <span className="font-semibold text-slate-700">{fmt(minPrice)}</span> — no partner scheduling to coordinate.
        </p>
      )}
      <Link
        href={ctaHref}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
      >
        Browse {label} for sale <ArrowRight className="h-4 w-4" />
      </Link>
      {samples.length > 0 && (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {samples.map((s) => (
            <li key={s.id} className="contents">
              <AircraftRailCard p={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Seeker Cross-Sell Panel ─────────────────────────────────────────────────
// Third leg of "blend result types + cross-sell": real pilot demand for this
// make/model, visible to every visitor (distinct from the owner-only MatchCountNudge).

function SeekerCrossSellPanel({
  make,
  model,
  count,
  samples,
}: {
  make: string
  model: string | null
  count: number
  /** Up to 3 real matching seeker listings to preview inline. Empty → no rail. */
  samples: PartnershipSeeker[]
}) {
  const makeEncoded = encodeURIComponent(make)
  const label = model ? `${make} ${model}` : make
  const ctaHref = model
    ? `/partnerships/seeking?make=${makeEncoded}&model=${encodeURIComponent(model)}`
    : `/partnerships/seeking?make=${makeEncoded}`
  return (
    <div className="ch-panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Search className="h-4 w-4" /> Other pilots looking
      </h2>
      <p className="text-sm font-medium text-slate-800">
        {count === 1 ? '1 other pilot is' : `${count} other pilots are`} also looking for a{' '}
        {label} share on ClubHanger.
      </p>
      <Link
        href={ctaHref}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
      >
        See who&apos;s looking <ArrowRight className="h-4 w-4" />
      </Link>
      {samples.length > 0 && (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {samples.map((s) => (
            <li key={s.id} className="contents">
              <SeekerRailCard seeker={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const CAP_COLORS: Record<string, string> = {
  glass: 'bg-violet-50 text-violet-700 ring-violet-200',
  adsb: 'bg-sky-50 text-sky-700 ring-sky-200',
  autopilot: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  waas: 'bg-sky-50 text-sky-700 ring-sky-200',
  gps: 'bg-slate-100 text-slate-700 ring-slate-200',
}

// IFR-verdict badge colors per tier (mirrors the aircraft detail page's IFR_CHIP).
const IFR_CHIP: Record<IfrTier, string> = {
  full:     'bg-emerald-50 text-emerald-700 ring-emerald-200',
  capable:  'bg-sky-50 text-sky-700 ring-sky-200',
  equipped: 'bg-amber-50 text-amber-700 ring-amber-200',
  basic:    'bg-slate-100 text-slate-600 ring-slate-200',
}

function AvionicsPanel({ info }: { info: AvionicsInfo }) {
  if (info.caps.length === 0) return null
  const ifr = computeIfrSuitability(info.caps)
  return (
    <div className="ch-panel p-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Radio className="h-4 w-4" /> Avionics & panel
      </h2>

      {/* IFR suitability verdict — synthesized from the capability chips below.
          Same honesty-gated read as the aircraft detail page; self-suppresses
          when no IFR-meaningful caps were detected. */}
      {ifr && (
        <div className="mb-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ring-1 ${IFR_CHIP[ifr.tier]}`}>
            {ifr.headline}
          </span>
          <p className="mt-2 text-sm font-medium text-slate-700">{ifr.sub}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {info.caps.map((cap) => (
          <span
            key={cap.key}
            title={cap.hint}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${CAP_COLORS[cap.key] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}
          >
            {cap.label}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Capabilities mentioned in the listing description. Verify with logbooks before purchase.
      </p>
    </div>
  )
}

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Math.round(n)
  )

// Per-band accent for the airframe utilization read (mirrors the aircraft detail page).
// Neutral-to-informative by design: "low" is amber (a thing to ask about — sitting risk),
// not a green win.
const USAGE_META: Record<AirframeUsageResult['band'], { label: string; chip: string }> = {
  low:     { label: 'Low time',  chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
  typical: { label: 'Typical',   chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  high:    { label: 'High time', chip: 'bg-sky-50 text-sky-700 ring-sky-200' },
}

function AirframeUsagePanel({ usage }: { usage: AirframeUsageResult }) {
  const meta = USAGE_META[usage.band]
  return (
    <div className="ch-panel p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Plane className="h-4 w-4" /> Airframe time
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Average over the aircraft&apos;s life — {usage.ttaf.toLocaleString()} hrs total time
        across ~{usage.ageYears} years. A rule of thumb, not a guarantee.
      </p>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-extrabold text-slate-900">
          ≈{usage.hoursPerYear.toLocaleString()} hrs/yr
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${meta.chip}`}
        >
          {meta.label}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-700">{usage.headline}</p>

      <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">
        {usage.detail}
      </p>
    </div>
  )
}

// Per-state accent for the annual-inspection read (mirrors the aircraft detail
// page). "current" is a green reassurance; "soon"/"overdue" are amber prompts to
// ask/budget — never alarmist red, since we only know the listing's stated date,
// not the aircraft's true logbook status.
const ANNUAL_META: Record<AnnualStatusResult['state'], { label: string; chip: string }> = {
  current: { label: 'Current',   chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  soon:    { label: 'Due soon',  chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
  overdue: { label: 'Verify',    chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
}

function AnnualStatusPanel({ status }: { status: AnnualStatusResult }) {
  const meta = ANNUAL_META[status.state]
  return (
    <div className="ch-panel p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Calendar className="h-4 w-4" /> Annual inspection
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Required every 12 calendar months. Read off the listing&apos;s stated annual-due date —
        confirm against the logbooks.
      </p>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-extrabold text-slate-900">{status.dueLabel}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${meta.chip}`}
        >
          {status.state !== 'current' && <AlertTriangle className="h-3 w-3" />}
          {meta.label}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-700">{status.headline}</p>

      <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">
        {status.detail}
      </p>
    </div>
  )
}

// Per-state accent for the damage read. "clean" (none reported) is a green
// reassurance; "reported" is an amber prompt to ask/verify — never alarmist red,
// since the flag reflects the listing's wording, not a verified logbook fact.
const DAMAGE_META: Record<DamageHistoryResult['state'], { chip: string }> = {
  clean:    { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  reported: { chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
}

function DamageHistoryPanel({ damage }: { damage: DamageHistoryResult }) {
  const meta = DAMAGE_META[damage.state]
  return (
    <div className="ch-panel p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <ShieldAlert className="h-4 w-4" /> Damage history
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Reported in the listing — confirm against the airframe and engine logbooks.
      </p>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-lg font-extrabold text-slate-900">{damage.headline}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${meta.chip}`}
        >
          {damage.state === 'reported' && <AlertTriangle className="h-3 w-3" />}
          {damage.label}
        </span>
      </div>

      <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">
        {damage.detail}
      </p>

      <Link
        href="/guides/aircraft-pre-purchase-inspection"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-900"
      >
        Pre-purchase inspection guide
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

function EngineLifePanel({
  life,
  timeline,
}: {
  life: EngineLifeResult
  timeline?: OverhaulTimelineResult | null
}) {
  const pct = Math.max(0, Math.min(100, Math.round((life.remainingHours / life.tboHours) * 100)))
  return (
    <div className="ch-panel p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Wrench className="h-4 w-4" /> Engine Life
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Based on {life.smoh.toLocaleString()} hrs since overhaul (SMOH) and the published{' '}
        {life.tboHours.toLocaleString()} hr TBO for the {life.family}.
      </p>

      {life.beyondTbo ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Engine is beyond published TBO</p>
            <p className="mt-0.5 text-sm text-amber-700">
              This engine has {Math.abs(life.remainingHours).toLocaleString()} hrs past the{' '}
              {life.tboHours.toLocaleString()} hr TBO. Ask the owner about the engine
              inspection history and any overhauled-beyond-TBO authorization.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">
              {life.remainingHours.toLocaleString()} hrs
            </span>
            <span className="text-sm text-slate-500">to TBO</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${pct > 40 ? 'bg-emerald-400' : pct > 15 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">{pct}% of TBO remaining</p>
        </div>
      )}

      {/* Overhaul timeline — remaining hrs projected onto the shared aircraft's own
          historical flying rate. Only present when the engine is within TBO and we have a
          utilization read, so it self-suppresses rather than guess. A rough projection. */}
      {timeline && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              ≈ {timeline.yearsToTbo} {timeline.yearsToTbo === 1 ? 'year' : 'years'} to overhaul
              at its historical pace
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {timeline.remainingHours.toLocaleString()} hrs left ÷ this aircraft&apos;s
              ~{timeline.hoursPerYear.toLocaleString()} hrs/yr average. A rough projection —
              the partnership&apos;s actual flying rate will change the timeline.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-500">Engine reserve budget</span>
          <span className="font-semibold text-slate-800">
            ~{money(life.reservePerYear)}/yr · ~{money(life.reservePerHour)}/hr
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Estimated overhaul cost ({money(life.overhaulCostUsd)}) spread over{' '}
          {life.tboHours.toLocaleString()} hr TBO at 100 hrs/yr — a rule of thumb, not a quote.
        </p>
      </div>
    </div>
  )
}
