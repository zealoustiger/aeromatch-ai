import Link from 'next/link'
import Image from 'next/image'
import { UserRound } from 'lucide-react'
import { getProfile } from '@/lib/profiles'
import VerifiedBadge from './VerifiedBadge'

/**
 * "Listed by …" author block for listing detail pages. Links to the pilot's public
 * profile and shows the ClubHanger verified badge when applicable. Renders nothing
 * for anonymous (no poster_id) or seed listings; fails soft if profiles are absent.
 */
export default async function AuthorIdentity({
  posterId,
  fallbackName,
}: {
  posterId: string | null
  fallbackName?: string | null
}) {
  if (!posterId) return null
  const profile = await getProfile(posterId)
  const name = profile?.display_name ?? fallbackName ?? 'ClubHanger Pilot'

  return (
    <Link
      href={`/pilots/${posterId}`}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:border-sky-300"
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt={name} fill className="object-cover" sizes="32px" />
        ) : (
          <UserRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-slate-400">Listed by</span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-800">{name}</span>
          {profile?.verified && <VerifiedBadge />}
        </span>
      </span>
    </Link>
  )
}
