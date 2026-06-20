import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { Plane, ArrowRight } from 'lucide-react'
import PartnershipList from '@/components/PartnershipList'
import { SEO_MAKES, getMakeBySlug, SITE_URL } from '@/lib/seo'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'
import { getPartnershipListings } from '@/lib/partnershipsQuery'
import { buildPartnershipItemListJsonLd } from '@/lib/partnershipJsonLd'

type Props = { params: Promise<{ make: string }> }

export function generateStaticParams() {
  return SEO_MAKES.map(({ slug }) => ({ make: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make } = await params
  const entry = getMakeBySlug(make)
  if (!entry) return {}

  return {
    title: `${entry.name} Partnerships & Co-Ownership Shares`,
    description: `Find ${entry.name} aircraft partnerships and co-ownership shares near your home airport. Transparent buy-in, monthly, and hourly costs on every listing. Free to search and post.`,
    alternates: { canonical: `${SITE_URL}/partnerships/make/${entry.slug}` },
    openGraph: {
      title: `${entry.name} Aircraft Partnerships`,
      description: `Co-ownership shares in ${entry.name} aircraft, searchable by home airport.`,
    },
  }
}

export default async function MakePartnershipsPage({ params }: Props) {
  const { make } = await params
  const entry = getMakeBySlug(make)
  if (!entry) notFound()

  const otherMakes = SEO_MAKES.filter((m) => m.slug !== entry.slug)

  // ItemList JSON-LD built from the SAME shared query PartnershipList renders, so
  // the markup matches the visible cards 1:1 (each item links to a real
  // /partnerships/[id]). Real data only — no fabricated rating/review.
  const { listings } = await getPartnershipListings({ make: entry.filter })
  const itemListJsonLd = buildPartnershipItemListJsonLd(listings, {
    name: `${entry.name} aircraft partnerships`,
    url: `${SITE_URL}/partnerships/make/${entry.slug}`,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/partnerships" className="hover:text-slate-600">Partnerships</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">{entry.name}</span>
      </nav>

      {/* Header with photo */}
      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="p-6 sm:p-8">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              <Plane className="h-7 w-7 text-sky-600" />
              {entry.name} Partnerships
            </h1>
            <p className="mt-3 text-slate-500">{entry.blurb}</p>
            <p className="mt-3 text-sm text-slate-400">
              Every listing shows buy-in, monthly fixed, and hourly wet rate upfront.
              Have a {entry.name} to share?{' '}
              <Link href="/partnerships/new" className="font-medium text-sky-600 hover:underline">
                Post a free listing
              </Link>.
            </p>
          </div>
          <div className="relative hidden h-full min-h-[220px] md:block">
            <Image
              src={getPlaceholderPhoto(entry.filter)}
              alt={`${entry.name} aircraft`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 0vw, 50vw"
            />
          </div>
        </div>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <PartnershipList filters={{ make: entry.filter }} />
      </Suspense>

      {/* Cross-links */}
      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Browse other makes</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {otherMakes.map(({ slug, name }) => (
            <Link
              key={slug}
              href={`/partnerships/make/${slug}`}
              className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
            >
              {name} partnerships
            </Link>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Link
            href="/partnerships"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            View all partnerships <ArrowRight className="h-4 w-4" />
          </Link>
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
