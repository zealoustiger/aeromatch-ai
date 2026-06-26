import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MapPin, Plane, ShieldCheck } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPartnershipById } from '@/lib/partnerships'
import { Partnership } from '@/lib/types'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import {
  isSeedProfile,
  personaFromPartnership,
  memberSinceLabel,
} from '@/lib/seedProfiles'
import AviatorAvatar from '@/components/AviatorAvatar'
import PartnershipCard from '@/components/PartnershipCard'
import MessageOwnerButton from '@/components/MessageOwnerButton'

/**
 * Lightweight public member profile for a seed/demo persona (e.g. "Marcus T.").
 * The persona is keyed by the seed listing's id; it is owned by the concierge
 * house account, so the on-site "Message" button reaches the operator. Renders a
 * member header (aviator avatar, name, location, member-since) plus the persona's
 * active listing(s). 404s for ids that aren't a seed persona — we don't expose
 * profiles for real users (who have their own privacy model) or scraped rows.
 */

// The persona's active listings: every active partnership owned by the same
// concierge account AND sharing this persona's contact_name (so a group like
// "Oakland Flying Club" with multiple posts shows them all; a one-off shows one).
async function personaListings(p: Partnership): Promise<Partnership[]> {
  try {
    const supabase = await createServerSupabaseClient()
    let q = supabase
      .from('partnerships')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    q = p.poster_id ? q.eq('poster_id', p.poster_id) : q.eq('id', p.id)
    if (p.contact_name) q = q.eq('contact_name', p.contact_name)
    const { data } = await q
    const rows = (data ?? []).filter((r) => isSeedProfile(r))
    // Ensure the current listing is present and first even if the filter is sparse.
    const withSelf = rows.some((r) => r.id === p.id) ? rows : [p, ...rows]
    return withSelf
  } catch {
    return [p]
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const p = await getPartnershipById(id)
  if (!p || !isSeedProfile(p)) return { title: 'Member not found' }
  const persona = personaFromPartnership(p)
  const title = `${persona.name} — ClubHanger member`
  const description = persona.homeAirport
    ? `${persona.name} is a ClubHanger member based at ${persona.homeAirport}.`
    : `${persona.name} is a ClubHanger member.`
  return {
    title,
    description,
    // Personas are demo/bootstrap supply — keep them out of the index.
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/members/${id}` },
    openGraph: { title, description, siteName: SITE_NAME, type: 'profile' },
  }
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const p = await getPartnershipById(id)
  if (!p || !isSeedProfile(p)) notFound()

  const persona = personaFromPartnership(p)
  const since = memberSinceLabel(persona.memberSince)
  const listings = await personaListings(p)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/partnerships"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="h-4 w-4" /> Partnerships
      </Link>

      {/* Member header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <AviatorAvatar seed={persona.avatarSeed} size={88} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{persona.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              {persona.homeAirport && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Based at <strong className="font-semibold text-slate-700">{persona.homeAirport}</strong>
                  {persona.location && ` · ${persona.location}`}
                </span>
              )}
              {since && <span>{since}</span>}
            </div>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              ClubHanger member
            </span>
          </div>

          {/* Message — desktop; reaches the member in their ClubHanger inbox. */}
          <div className="w-full shrink-0 sm:w-48">
            <MessageOwnerButton
              listingId={p.id}
              posterId={p.poster_id}
              label={`Message ${persona.firstName}`}
              returnPath={`/members/${p.id}`}
            />
          </div>
        </div>
      </div>

      {/* The persona's listing(s) */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
          <Plane className="h-5 w-5 text-sky-600" />
          {listings.length > 1
            ? `${persona.firstName}'s partnership listings`
            : `${persona.firstName}'s partnership listing`}
        </h2>
        <div className="space-y-4">
          {listings.map((listing) => (
            <PartnershipCard key={listing.id} p={listing} />
          ))}
        </div>
      </div>
    </div>
  )
}
