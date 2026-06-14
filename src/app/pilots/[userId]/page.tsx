import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Plane, Search, ShieldCheck } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getProfile } from '@/lib/profiles'
import { Partnership, PartnershipSeeker } from '@/lib/types'
import PartnershipCard from '@/components/PartnershipCard'
import SeekerCard from '@/components/SeekerCard'
import VerifiedBadge from '@/components/VerifiedBadge'

export const dynamic = 'force-dynamic'

function hasSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!url && url !== 'https://placeholder.supabase.co'
}

async function getActiveListings(userId: string): Promise<{ partnerships: Partnership[]; seekers: PartnershipSeeker[] }> {
  if (!hasSupabase()) return { partnerships: [], seekers: [] }
  try {
    const supabase = await createServerSupabaseClient()
    const [{ data: partnerships }, { data: seekers }] = await Promise.all([
      supabase.from('partnerships').select('*').eq('poster_id', userId).eq('status', 'active'),
      supabase.from('partnership_seekers').select('*').eq('poster_id', userId).eq('status', 'active'),
    ])
    return { partnerships: partnerships ?? [], seekers: seekers ?? [] }
  } catch {
    return { partnerships: [], seekers: [] }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  const profile = await getProfile(userId)
  const name = profile?.display_name ?? 'Pilot'
  return {
    title: `${name} — Pilot Profile`,
    description: profile?.mission ?? profile?.bio?.slice(0, 150) ?? `${name}'s pilot profile on ClubHanger.`,
    robots: { index: false, follow: true },
  }
}

export default async function PilotProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const profile = await getProfile(userId)
  const { partnerships, seekers } = await getActiveListings(userId)

  const verifiedSet = new Set((profile?.verified_ratings ?? []).map((r) => r.toLowerCase()))
  const name = profile?.display_name ?? 'ClubHanger Pilot'
  const hasListings = partnerships.length > 0 || seekers.length > 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Identity header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={name} fill className="object-cover" sizes="64px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-400">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
              {profile?.verified && <VerifiedBadge />}
            </div>
            {profile?.mission && <p className="mt-1 text-slate-600">{profile.mission}</p>}

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
              {profile?.home_airport && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <Link href={`/airports/${profile.home_airport.toLowerCase()}`} className="font-semibold text-slate-700 hover:text-sky-700">
                    {profile.home_airport}
                  </Link>
                </span>
              )}
              {profile?.total_hours != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {profile.total_hours} total hours
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ratings with per-rating verification */}
        {profile?.ratings_held && profile.ratings_held.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Ratings</h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.ratings_held.map((r) => {
                const isVerified = verifiedSet.has(r.toLowerCase())
                return (
                  <span
                    key={r}
                    title={isVerified ? 'Verified by ClubHanger' : 'Self-attested'}
                    className={
                      isVerified
                        ? 'inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200'
                        : 'inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200'
                    }
                  >
                    {isVerified && <ShieldCheck className="h-3 w-3" aria-hidden="true" />}
                    {r}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {profile?.bio && (
          <div className="mt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">About</h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-600">{profile.bio}</p>
          </div>
        )}

        {!profile && (
          <p className="mt-4 text-sm text-slate-400">This pilot hasn’t completed a profile yet.</p>
        )}
      </div>

      {/* Their listings */}
      {partnerships.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Plane className="h-5 w-5 text-sky-600" /> Partnerships offered
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
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Search className="h-5 w-5 text-emerald-600" /> Seeking a partnership
          </h2>
          <div className="space-y-4">
            {seekers.map((s) => (
              <SeekerCard key={s.id} seeker={s} />
            ))}
          </div>
        </section>
      )}

      {!hasListings && (
        <p className="mt-8 text-center text-sm text-slate-400">No active listings from this pilot right now.</p>
      )}
    </div>
  )
}
