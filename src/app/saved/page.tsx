import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Heart, Plane } from 'lucide-react'
import Link from 'next/link'
import PartnershipCard from '@/components/PartnershipCard'
import AircraftSaleCard from '@/components/AircraftSaleCard'
import DeviceSavedListings from '@/components/DeviceSavedListings'
import SavedListingNote from '@/components/SavedListingNote'
import { getAircraftForSaleByIds } from '@/lib/aircraftForSale'
import type { Partnership, AircraftForSale } from '@/lib/types'

export default async function SavedPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Logged-out: don't bounce to /auth. Show this device's soft-saves (slice 1)
  // with an honest "device only" notice + an account push (slice 3).
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Heart className="h-6 w-6 text-sky-600" />
            My Saved Listings
          </h1>
          <p className="mt-1 text-slate-500">
            Listings you&apos;ve hearted on this device.
          </p>
        </div>
        <DeviceSavedListings />
      </div>
    )
  }

  // Saved listing ids in save order (newest first), split by listing type.
  // Select the optional `note` too; if that column hasn't been migrated yet,
  // fall back to a note-less select so the page never breaks (notes stay dormant
  // until the migration is applied — see schema.sql / CHANGELOG).
  type SavedRow = { id: string; listing_id: string; listing_type: string; note: string | null }
  let savedRows: SavedRow[] = []
  const withNote = await supabase
    .from('saved_listings')
    .select('id, listing_id, listing_type, note')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  // `note` is dormant until the additive migration is applied (see schema.sql /
  // CHANGELOG). When the column is missing we still render saves, but suppress the
  // note affordance entirely so users never see a control that can't persist.
  const notesEnabled = !withNote.error
  if (withNote.error) {
    const fallback = await supabase
      .from('saved_listings')
      .select('id, listing_id, listing_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    savedRows = (fallback.data ?? []).map((r) => ({ ...r, note: null })) as SavedRow[]
  } else {
    savedRows = (withNote.data ?? []) as SavedRow[]
  }

  // Map each saved listing (by type+id) → its saved-row id + note, so we can
  // render the note editor under the matching card.
  const savedMeta = new Map<string, { savedRowId: string; note: string | null }>()
  for (const r of savedRows) {
    savedMeta.set(`${r.listing_type}:${r.listing_id}`, { savedRowId: r.id, note: r.note })
  }

  const partnershipIds = (savedRows ?? [])
    .filter((r) => r.listing_type === 'partnership')
    .map((r) => r.listing_id as string)
  const aircraftIds = (savedRows ?? [])
    .filter((r) => r.listing_type === 'aircraft')
    .map((r) => r.listing_id as string)

  // Hydrate partnerships. A saved row whose partnership is no longer active
  // simply drops out (the .in() returns only existing active rows).
  let partnerships: Partnership[] = []
  if (partnershipIds.length > 0) {
    const { data } = await supabase
      .from('partnerships')
      .select('*')
      .eq('status', 'active')
      .in('id', partnershipIds)
    const byId = new Map((data ?? []).map((p) => [p.id, p as Partnership]))
    partnerships = partnershipIds
      .map((id) => byId.get(id))
      .filter((p): p is Partnership => !!p)
  }

  // Hydrate aircraft via the same helper /compare uses (preserves input order,
  // drops missing ids). Then drop any that are no longer active/sold so the
  // orphan-drop behaviour matches the partnership path above.
  let aircraft: AircraftForSale[] = []
  if (aircraftIds.length > 0) {
    const rows = await getAircraftForSaleByIds(aircraftIds)
    aircraft = rows.filter((a) => a.status === 'active')
  }

  const total = partnerships.length + aircraft.length

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Heart className="h-6 w-6 text-sky-600" />
          My Saved Listings
        </h1>
        <p className="mt-1 text-slate-500">
          Partnerships and aircraft you&apos;ve hearted — all in one place.
        </p>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Heart className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-600">No saved listings yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Browse{' '}
            <Link href="/partnerships" className="text-sky-600 underline-offset-2 hover:underline">
              partnerships
            </Link>{' '}
            or{' '}
            <Link href="/aircraft" className="text-sky-600 underline-offset-2 hover:underline">
              aircraft for sale
            </Link>{' '}
            and tap the{' '}
            <Heart className="inline-block h-3.5 w-3.5 -translate-y-px text-sky-500" aria-hidden="true" />{' '}
            on any listing to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {partnerships.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Saved partnerships{' '}
                <span className="text-sm font-normal text-slate-400">({partnerships.length})</span>
              </h2>
              <div className="space-y-4">
                {partnerships.map((p) => {
                  const meta = savedMeta.get(`partnership:${p.id}`)
                  return (
                    <div key={p.id}>
                      <PartnershipCard p={p} saved />
                      {notesEnabled && meta && (
                        <SavedListingNote savedRowId={meta.savedRowId} note={meta.note} />
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {aircraft.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Saved aircraft{' '}
                <span className="text-sm font-normal text-slate-400">({aircraft.length})</span>
              </h2>
              <div className="space-y-4">
                {aircraft.map((a) => {
                  const meta = savedMeta.get(`aircraft:${a.id}`)
                  return (
                    <div key={a.id}>
                      <AircraftSaleCard p={a} saved />
                      {notesEnabled && meta && (
                        <SavedListingNote savedRowId={meta.savedRowId} note={meta.note} />
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <p className="flex items-center justify-center gap-1.5 text-sm text-slate-400">
            <Plane className="h-3.5 w-3.5" />
            Looking for more?{' '}
            <Link href="/partnerships" className="text-sky-600 underline-offset-2 hover:underline">
              partnerships
            </Link>{' '}
            <span aria-hidden="true">·</span>{' '}
            <Link href="/aircraft" className="text-sky-600 underline-offset-2 hover:underline">
              aircraft for sale
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
