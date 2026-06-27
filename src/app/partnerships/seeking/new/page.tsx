import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PostSeekerListingForm from '@/components/PostSeekerListingForm'
import PostTypeTabs from '@/components/PostTypeTabs'

export const metadata: Metadata = {
  title: 'Post a Seeking Listing — Find an Aircraft Partnership',
  description:
    'Tell aircraft owners what you are looking for: aircraft type, budget, home airport, and ratings. Post a free seeking listing and let partnerships find you.',
}

export default async function NewSeekerListingPage() {
  // Show the form to everyone — auth is deferred to submission so users can fill
  // the form before being asked to sign in. The server action guards the insert.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <PostTypeTabs active="seeking" />
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Post a Seeking Listing</h1>
          <p className="mt-2 text-slate-500">
            Let aircraft owners know you&apos;re looking for a partnership. Describe what you&apos;re after
            and let them come to you.
          </p>
        </div>
        <PostSeekerListingForm isLoggedIn={!!user} />
      </div>
    </div>
  )
}
