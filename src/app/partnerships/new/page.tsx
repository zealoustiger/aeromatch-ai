import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PostPartnershipForm from '@/components/PostPartnershipForm'
import PostTypeTabs from '@/components/PostTypeTabs'
import EarningsCalculator from '@/components/EarningsCalculator'

export const metadata: Metadata = {
  title: 'Post an Aircraft Partnership — Free Listing',
  description:
    'List your aircraft partnership or co-ownership share for free. Reach pilots searching by home airport, budget, and aircraft type.',
  robots: { index: false, follow: false },
}

export default async function NewPartnershipPage() {
  // Show the form to everyone — auth is deferred to submission so users can fill
  // the form before being asked to sign in. The server action guards the insert.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="ch-surface min-h-screen">
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <PostTypeTabs active="partnership" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Post a Partnership</h1>
        <p className="mt-2 text-slate-500">
          List your aircraft partnership for free. Reach pilots searching in your area.
        </p>
      </div>
      <PostPartnershipForm isLoggedIn={!!user} />

      <div className="mt-10 border-t border-slate-100 pt-8">
        <p className="mb-3 text-sm text-slate-500">
          Not sure how to price it? Estimate what offering shares could offset on your monthly costs.
        </p>
        <EarningsCalculator variant="compact" />
      </div>
    </div>
    </div>
  )
}
