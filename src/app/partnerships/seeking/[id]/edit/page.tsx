import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PostSeekerListingForm from '@/components/PostSeekerListingForm'

export const metadata: Metadata = {
  title: 'Edit Your Seeking Listing — ClubHanger',
  robots: { index: false, follow: false },
}

export default async function EditSeekerListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/auth?next=/partnerships/seeking/${id}/edit`)

  const { data: listing } = await supabase
    .from('partnership_seekers')
    .select('id, home_airport, additional_airports, max_buy_in, title, preferred_makes, preferred_models, aircraft_category, min_year, max_year, max_monthly, max_hourly, willing_to_travel_nm, total_hours, ratings_held, hours_per_month, intended_use, preferred_share_types, description, contact_name, contact_email, contact_method, contact_phone, poster_id')
    .eq('id', id)
    .single()

  // Same not-found response whether the row is missing or owned by someone
  // else — never reveal that a listing exists to a non-owner.
  if (!listing || listing.poster_id !== user.id) notFound()

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Edit Your Seeking Listing</h1>
          <p className="mt-2 text-slate-500">Update your listing — changes go live as soon as you save.</p>
        </div>
        <PostSeekerListingForm
          mode="edit"
          listingId={listing.id}
          userEmail={user.email}
          userName={user.user_metadata?.full_name}
          initialValues={{
            home_airport: listing.home_airport ?? undefined,
            additional_airport_2: listing.additional_airports?.[0] ?? undefined,
            max_buy_in: listing.max_buy_in ?? undefined,
            title: listing.title ?? undefined,
            preferred_makes: listing.preferred_makes?.join(', ') ?? undefined,
            preferred_models: listing.preferred_models ?? undefined,
            aircraft_category: listing.aircraft_category ?? undefined,
            min_year: listing.min_year ?? undefined,
            max_year: listing.max_year ?? undefined,
            max_monthly: listing.max_monthly ?? undefined,
            max_hourly: listing.max_hourly ?? undefined,
            willing_to_travel_nm: listing.willing_to_travel_nm ?? undefined,
            total_hours: listing.total_hours ?? undefined,
            ratings_held: listing.ratings_held?.join(', ') ?? undefined,
            hours_per_month: listing.hours_per_month ?? undefined,
            intended_use: listing.intended_use ?? undefined,
            preferred_share_types: listing.preferred_share_types ?? undefined,
            description: listing.description ?? undefined,
            contact_name: listing.contact_name ?? undefined,
            contact_email: listing.contact_email ?? undefined,
            contact_method: listing.contact_method ?? undefined,
            contact_phone: listing.contact_phone ?? undefined,
          }}
        />
      </div>
    </div>
  )
}
