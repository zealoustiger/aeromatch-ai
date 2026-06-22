import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { MapPin, ArrowRight } from 'lucide-react'
import PartnershipList from '@/components/PartnershipList'
import ModelFaq from '@/components/ModelFaq'
import { STATE_NAMES, STATE_CODES, SITE_URL, getPartnershipStateFaqs } from '@/lib/seo'
import { getPartnershipListings } from '@/lib/partnershipsQuery'
import { buildPartnershipItemListJsonLd } from '@/lib/partnershipJsonLd'
import { buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'

type Props = { params: Promise<{ state: string }> }

export function generateStaticParams() {
  return STATE_CODES.map((code) => ({ state: code.toLowerCase() }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params
  const code = state.toUpperCase()
  const name = STATE_NAMES[code]
  if (!name) return {}

  return {
    title: `Aircraft Partnerships in ${name} (${code}) — Co-Ownership Shares`,
    description: `Find aircraft partnerships and co-ownership opportunities in ${name}. Browse shares in Cessna, Piper, Cirrus and more — with transparent buy-in, monthly, and hourly costs. Free to search.`,
    alternates: { canonical: `${SITE_URL}/partnerships/state/${state.toLowerCase()}` },
    openGraph: {
      title: `Aircraft Partnerships in ${name}`,
      description: `Co-ownership shares and flying partnerships across ${name}, searchable by home airport.`,
    },
  }
}

export default async function StatePartnershipsPage({ params }: Props) {
  const { state } = await params
  const code = state.toUpperCase()
  const name = STATE_NAMES[code]
  if (!name) notFound()

  const otherStates = STATE_CODES.filter((c) => c !== code).slice(0, 12)

  // ItemList JSON-LD built from the SAME shared query PartnershipList renders, so
  // the markup matches the visible cards 1:1 (each item links to a real
  // /partnerships/[id]). Real data only — no fabricated rating/review.
  const { listings } = await getPartnershipListings({ state: code })
  const itemListJsonLd = buildPartnershipItemListJsonLd(listings, {
    name: `Aircraft partnerships in ${name}`,
    url: `${SITE_URL}/partnerships/state/${state.toLowerCase()}`,
  })

  // Curated states only (priority ca/tx/fl + a few distinctive GA states); others
  // render no FAQ — never templated boilerplate across all 50 states (GOAL.md).
  const faqs = getPartnershipStateFaqs(code)
  const faqJsonLd = buildFaqPageJsonLd(faqs ?? undefined, {
    url: `${SITE_URL}/partnerships/state/${state.toLowerCase()}`,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/partnerships" className="hover:text-slate-600">Partnerships</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">{name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          <MapPin className="h-7 w-7 text-sky-600" />
          Aircraft Partnerships in {name}
        </h1>
        <p className="mt-2 max-w-3xl text-slate-500">
          Browse aircraft co-ownership and partnership opportunities across {name}. Every listing
          shows the buy-in price, monthly fixed costs, and hourly wet rate upfront — so you know
          exactly what flying will cost before you reach out. Looking to share your own aircraft?{' '}
          <Link href="/partnerships/new" className="font-medium text-sky-600 hover:underline">
            Post a free listing
          </Link>{' '}
          and reach pilots searching in {name}.
        </p>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <PartnershipList filters={{ state: code }} />
      </Suspense>

      {/* Co-ownership FAQ (curated states only) */}
      {faqs && (
        <ModelFaq
          label={`Aircraft partnerships in ${name}`}
          faqs={faqs}
          className="mt-12"
        />
      )}

      {/* Cross-links */}
      <div className="mt-12 grid gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Pilots seeking partnerships</h2>
          <p className="mb-3 text-sm text-slate-500">
            Own an aircraft in {name}? Browse pilots actively looking to buy into a share near you.
          </p>
          <Link
            href="/partnerships/seeking"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            View seeking listings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Browse nearby states</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {otherStates.map((c) => (
              <Link
                key={c}
                href={`/partnerships/state/${c.toLowerCase()}`}
                className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
              >
                {STATE_NAMES[c]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}
