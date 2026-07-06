import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership } from '@/lib/types'
import { getPartnershipListings, type PartnershipFilters } from '@/lib/partnershipsQuery'
import { getPartnershipCompVerdicts, type PartnershipCardVerdict } from '@/lib/partnershipComps'
import PartnershipCard from './PartnershipCard'
import AlertSignup from './AlertSignup'

/**
 * Partnership list surface. The fetch + trust-sort now live in the shared
 * `getPartnershipListings` helper (so the state/make pages can build ItemList
 * JSON-LD from the exact same result set this renders — no cloaking). This
 * component additionally hydrates the signed-in viewer's saved listings so cards
 * render filled hearts; that read is UI-only and stays here.
 */
export default async function PartnershipList({
  filters,
  alertContext,
  alertSourcePath,
}: {
  filters: PartnershipFilters
  /** Filter-aware email-alert context/source path — same values the page's own
   *  below-the-list `<AlertSignup>` uses. Rendered inside the zero-results empty
   *  state so a dead-end search leads with "get alerted" instead of nothing. */
  alertContext?: string
  alertSourcePath?: string
}) {
  const { listings, airportList, error } = await getPartnershipListings(filters)

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center text-sm text-red-600">
        Failed to load listings. Please try again.
      </div>
    )
  }

  let savedIds = new Set<string>()
  let verdicts = new Map<string, PartnershipCardVerdict>()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (hasSupabase && listings.length > 0) {
    const supabase = await createServerSupabaseClient()

    // Saved-listings hydration (fills hearts on cards).
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: saved } = await supabase
          .from('saved_listings')
          .select('listing_id')
          .eq('user_id', user.id)
          .eq('listing_type', 'partnership')
          .in('listing_id', listings.map((l) => l.id))
        savedIds = new Set((saved ?? []).map((s) => s.listing_id as string))
      }
    } catch {
      // Non-fatal: just render without filled hearts.
    }

    // Comp/Deal Check verdict chips: batch-fetch buy-in prices (+ year/ttaf/smoh) per
    // unique make so we can show the narrowed "Good deal"/"Priced high" verdict, or the
    // plain "Below/Above market" pill as a fallback. One DB query per unique make
    // (typically 1-4). Fails soft — no chips on error.
    verdicts = await getPartnershipCompVerdicts(supabase, listings)
  }

  return renderList(listings, filters, airportList, savedIds, verdicts, alertContext, alertSourcePath)
}

function renderList(
  listings: Partnership[],
  filters: PartnershipFilters,
  airportList: string[],
  savedIds: Set<string> = new Set(),
  verdicts: Map<string, PartnershipCardVerdict> = new Map(),
  alertContext?: string,
  alertSourcePath?: string
) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">No partnerships found yet.</p>
        <p className="mt-1 text-sm text-slate-400">Be the first — post a listing and get discovered.</p>
        {alertSourcePath && (
          <div className="mt-6 text-left">
            <AlertSignup context={alertContext} sourcePath={alertSourcePath} noun="partnership" className="mt-0" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        {listings.length} {listings.length === 1 ? 'partnership' : 'partnerships'} found
        {filters.airport && filters.radius ? (
          <span className="ml-1">
            within <strong>{filters.radius} miles</strong> of{' '}
            <strong>{filters.airport.toUpperCase()}</strong>
            {airportList.length > 1 && (
              <span className="text-slate-400"> ({airportList.length} airports)</span>
            )}
          </span>
        ) : airportList.length > 0 ? (
          <span className="ml-1">near <strong>{airportList.join(', ')}</strong></span>
        ) : null}
      </p>
      <div className="space-y-4">
        {listings.map((p) => (
          <PartnershipCard
            key={p.id}
            p={p}
            saved={savedIds.has(p.id)}
            comp={verdicts.get(p.id)?.comp ?? null}
            dealVerdict={verdicts.get(p.id)?.dealVerdict ?? null}
          />
        ))}
      </div>
    </div>
  )
}
