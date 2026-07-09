import Link from 'next/link'
import AviatorAvatar from './AviatorAvatar'
import type { PublicProfile } from '@/lib/publicProfile'

/** Links a listing back to its real poster's public profile — avatar + name +
 *  home airport, same identity treatment `/partnerships/[id]` already gives
 *  seed/demo personas (→ `/members/[id]`), extended to real signed-up pilots
 *  (→ `/pilots/[id]`). Callers must only pass a non-null `profile` (i.e. the
 *  poster has visited `/account` at least once) — `/pilots/[id]` 404s
 *  otherwise, so there's nothing worth linking to. */
export default function PosterAttribution({ profile }: { profile: PublicProfile }) {
  const name = profile.display_name || 'ClubHanger member'
  return (
    <Link
      href={`/pilots/${profile.user_id}`}
      className="group mb-4 flex items-center gap-3"
    >
      <AviatorAvatar config={profile.avatar_config} seed={profile.user_id} size={44} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-sky-700">
          Posted by {name}
        </p>
        <p className="truncate text-xs text-slate-500">
          {profile.home_airport ? `Based at ${profile.home_airport}` : 'View pilot profile'}
        </p>
      </div>
    </Link>
  )
}
