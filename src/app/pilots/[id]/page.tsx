import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MapPin, Plane, Handshake, UserSearch, ShieldCheck } from 'lucide-react'
import { getPublicProfile, getPublicProfileListings } from '@/lib/publicProfile'
import { memberSinceLabel } from '@/lib/seedProfiles'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import AviatorAvatar from '@/components/AviatorAvatar'
import AircraftSaleCard from '@/components/AircraftSaleCard'
import PartnershipCard from '@/components/PartnershipCard'
import SeekerCard from '@/components/SeekerCard'

/**
 * Public profile page for a real, signed-up pilot (as opposed to `/members/[id]`,
 * which is keyed by listing id and only ever renders hand-seeded demo personas).
 * `id` here is `profiles.user_id`. 404s when the user has no `profiles` row —
 * i.e. never visited /account — so there's nothing to show.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const profile = await getPublicProfile(id)
  if (!profile) return { title: 'Pilot not found' }
  const name = profile.display_name || 'ClubHanger member'
  const title = `${name} — ClubHanger pilot`
  const description = profile.home_airport
    ? `${name} is a ClubHanger member based at ${profile.home_airport}.`
    : `${name} is a ClubHanger member.`
  return {
    title,
    description,
    // Low-content user page today — not part of the (parked) SEO surface.
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/pilots/${id}` },
    openGraph: { title, description, siteName: SITE_NAME, type: 'profile' },
  }
}

export default async function PilotPublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await getPublicProfile(id)
  if (!profile) notFound()

  const { aircraft, partnerships, seekers } = await getPublicProfileListings(id)
  const hasAny = aircraft.length > 0 || partnerships.length > 0 || seekers.length > 0
  const since = memberSinceLabel(profile.created_at)
  const name = profile.display_name || 'ClubHanger member'

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/aircraft"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" /> Browse
        </Link>

        {/* Profile header */}
        <div className="ch-panel p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AviatorAvatar config={profile.avatar_config} seed={profile.user_id} size={88} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                {profile.home_airport && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Based at <strong className="font-semibold text-slate-700">{profile.home_airport}</strong>
                  </span>
                )}
                {since && <span>{since}</span>}
              </div>
              {(profile.mission || profile.bio) && (
                <p className="mt-3 max-w-xl text-sm text-slate-600">{profile.mission || profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Active listings */}
        {!hasAny && (
          <p className="ch-panel mt-8 py-8 text-center text-sm text-slate-500">
            No active listings from {name} right now.
          </p>
        )}

        {aircraft.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Plane className="h-5 w-5 text-sky-600" />
              Aircraft for sale
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {aircraft.map((a) => (
                <AircraftSaleCard key={a.id} p={a} />
              ))}
            </div>
          </section>
        )}

        {partnerships.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Handshake className="h-5 w-5 text-sky-600" />
              Partnerships
            </h2>
            <div className="space-y-4">
              {partnerships.map((p) => (
                <PartnershipCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}

        {seekers.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <UserSearch className="h-5 w-5 text-sky-600" />
              Seeking a partnership
            </h2>
            <div className="space-y-4">
              {seekers.map((s) => (
                <SeekerCard key={s.id} seeker={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
