import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PostAircraftForm from '@/components/PostAircraftForm'

export const metadata: Metadata = {
  title: 'Edit Your Listing — ClubHanger',
  robots: { index: false, follow: false },
}

export default async function EditAircraftListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/auth?next=/aircraft/listing/${id}/edit`)

  const { data: listing } = await supabase
    .from('aircraft_for_sale')
    .select('id, make, model, year, registration, ttaf, smoh, engine_type, title, description, asking_price, location, state, images, poster_id')
    .eq('id', id)
    .single()

  // Same not-found response whether the row is missing or owned by someone
  // else — never reveal that a listing exists to a non-owner.
  if (!listing || listing.poster_id !== user.id) notFound()

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Edit Your Listing</h1>
          <p className="mt-2 text-slate-500">Update your listing — changes go live as soon as you save.</p>
        </div>
        <PostAircraftForm
          mode="edit"
          listingId={listing.id}
          initialValues={{
            make: listing.make ?? undefined,
            model: listing.model ?? undefined,
            year: listing.year ?? undefined,
            registration: listing.registration ?? undefined,
            ttaf: listing.ttaf ?? undefined,
            smoh: listing.smoh ?? undefined,
            engine_type: listing.engine_type ?? undefined,
            asking_price: listing.asking_price ?? undefined,
            currentLocationLabel: listing.location ?? undefined,
            title: listing.title ?? undefined,
            description: listing.description ?? undefined,
            images: listing.images ?? undefined,
          }}
        />
      </div>
    </div>
  )
}
