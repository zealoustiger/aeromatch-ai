import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PostAircraftForm from '@/components/PostAircraftForm'
import PostTypeTabs from '@/components/PostTypeTabs'

export const metadata: Metadata = {
  title: 'Sell Your Aircraft — Free Listing',
  description:
    'List your aircraft for sale for free on ClubHanger. Reach pilots and buyers searching by make, model, price, and state.',
  robots: { index: false, follow: false },
}

export default async function NewAircraftPage() {
  // Posting requires an account — gate before rendering the form so the CTA
  // routes through /auth and comes back here.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/aircraft/new')

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <PostTypeTabs active="aircraft" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Sell Your Aircraft</h1>
        <p className="mt-2 text-slate-500">
          List your aircraft for sale for free. Reach pilots and buyers across the country.
        </p>
      </div>
      <PostAircraftForm />
    </div>
  )
}
