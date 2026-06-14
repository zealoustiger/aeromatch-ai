import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getProfile } from '@/lib/profiles'
import ProfileForm from '@/components/ProfileForm'

export const metadata: Metadata = {
  title: 'Your Pilot Profile',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/profile')

  const profile = await getProfile(user.id)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Your pilot profile</h1>
        <Link
          href={`/pilots/${user.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline"
        >
          View public profile <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
      <p className="mb-8 text-sm text-slate-500">
        This is the identity pilots see behind your listings. Everything here is self-attested; ClubHanger verification
        is separate and granted manually.
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProfileForm profile={profile} />
      </div>
    </div>
  )
}
