import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PostPartnershipForm from '@/components/PostPartnershipForm'

export const metadata: Metadata = {
  title: 'Edit Your Partnership Listing — ClubHanger',
  robots: { index: false, follow: false },
}

export default async function EditPartnershipPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/auth?next=/partnerships/${id}/edit`)

  const { data: listing } = await supabase
    .from('partnerships')
    .select('id, make, model, year, registration, home_airport, share_type, shares_available, total_shares, buy_in_price, monthly_fixed, hourly_wet, ttaf, smoh, engine_type, title, description, images, contact_name, contact_email, contact_method, contact_phone, poster_id')
    .eq('id', id)
    .single()

  // Same not-found response whether the row is missing or owned by someone
  // else — never reveal that a listing exists to a non-owner.
  if (!listing || listing.poster_id !== user.id) notFound()

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Edit Your Partnership Listing</h1>
          <p className="mt-2 text-slate-500">Update your listing — changes go live as soon as you save.</p>
        </div>
        <PostPartnershipForm
          mode="edit"
          listingId={listing.id}
          initialValues={{
            make: listing.make ?? undefined,
            model: listing.model ?? undefined,
            year: listing.year ?? undefined,
            registration: listing.registration ?? undefined,
            home_airport: listing.home_airport ?? undefined,
            share_type: listing.share_type ?? undefined,
            shares_available: listing.shares_available ?? undefined,
            total_shares: listing.total_shares ?? undefined,
            buy_in_price: listing.buy_in_price ?? undefined,
            monthly_fixed: listing.monthly_fixed ?? undefined,
            hourly_wet: listing.hourly_wet ?? undefined,
            ttaf: listing.ttaf ?? undefined,
            smoh: listing.smoh ?? undefined,
            engine_type: listing.engine_type ?? undefined,
            title: listing.title ?? undefined,
            description: listing.description ?? undefined,
            images: listing.images ?? undefined,
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
