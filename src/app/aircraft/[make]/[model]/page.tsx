import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { Plane, ArrowRight, Gauge, Wallet } from 'lucide-react'
import AircraftSaleList, { countMakeModel } from '@/components/AircraftSaleList'
import Breadcrumbs from '@/components/Breadcrumbs'
import { SEO_MAKE_MODELS, getMakeModel, SITE_URL } from '@/lib/seo'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'

type Props = { params: Promise<{ make: string; model: string }> }

export function generateStaticParams() {
  return SEO_MAKE_MODELS.map(({ makeSlug, modelSlug }) => ({
    make: makeSlug,
    model: modelSlug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make, model } = await params
  const entry = getMakeModel(make, model)
  if (!entry) return {}

  const n = await countMakeModel(entry.make, entry.modelPattern, entry.notModelPattern)
  const label = `${entry.make} ${entry.model}`
  const count = n.toLocaleString()
  const path = `/aircraft/${entry.makeSlug}/${entry.modelSlug}`

  return {
    // Title pattern per spec: "{Make} {Model} for sale — {N} aircraft | ClubHanger".
    // `absolute` bypasses the root layout's "%s | ClubHanger" template so the
    // " | ClubHanger" isn't doubled.
    title: { absolute: `${label} for sale — ${count} aircraft | ClubHanger` },
    description: `Browse ${count} ${label} aircraft for sale, aggregated from across the web. ${entry.specs} See specs and typical cost to own.`,
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: {
      title: `${label} for sale — ${count} aircraft`,
      description: `${label} aircraft for sale, with specs and cost-to-own guidance from ClubHanger.`,
    },
  }
}

export default async function MakeModelForSalePage({ params }: Props) {
  const { make, model } = await params
  const entry = getMakeModel(make, model)
  if (!entry) notFound()

  const n = await countMakeModel(entry.make, entry.modelPattern, entry.notModelPattern)
  // Guardrail: never render a thin/doorway page. If the inventory has dried up
  // for this combo, 404 rather than show an empty "for sale" landing page.
  if (n === 0) notFound()

  const label = `${entry.make} ${entry.model}`
  const otherCombos = SEO_MAKE_MODELS.filter(
    (e) => e.makeSlug !== entry.makeSlug || e.modelSlug !== entry.modelSlug
  ).slice(0, 12)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Aircraft for Sale', href: '/aircraft' },
          { label: `${label} for sale` },
        ]}
      />

      {/* Header with photo */}
      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="p-6 sm:p-8">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              <Plane className="h-7 w-7 text-sky-500" />
              {label} for sale
            </h1>
            <p className="mt-2 text-slate-500">
              <span className="font-semibold text-slate-700">{n.toLocaleString()}</span>{' '}
              {label} {n === 1 ? 'aircraft' : 'aircraft'} for sale, aggregated from across the web — search them all in one place.
            </p>
          </div>
          <div className="relative hidden h-full min-h-[200px] md:block">
            <Image
              src={getPlaceholderPhoto(entry.make)}
              alt={`${label} aircraft`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 0vw, 50vw"
            />
            <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
              Not actual plane photo
            </span>
          </div>
        </div>
      </div>

      {/* Specs + cost-to-own */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Gauge className="h-4 w-4 text-sky-500" />
            {label} specs
          </h2>
          <p className="text-sm text-slate-500">{entry.specs}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Wallet className="h-4 w-4 text-sky-500" />
            Cost to own a {label}
          </h2>
          <p className="text-sm text-slate-500">{entry.costToOwn}</p>
          <p className="mt-2 text-sm text-slate-400">
            Want to split those costs?{' '}
            <Link href="/partnerships" className="font-medium text-sky-600 hover:underline">
              Browse {entry.make} partnerships
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Listings */}
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        {label} listings
      </h2>
      <Suspense fallback={<ListSkeleton />}>
        <AircraftSaleList
          filters={{
            make: entry.make,
            modelPattern: entry.modelPattern,
            notModelPattern: entry.notModelPattern,
            basePath: `/aircraft/${entry.makeSlug}/${entry.modelSlug}`,
          }}
        />
      </Suspense>

      {/* Aggregation disclosure */}
      <p className="mt-6 text-xs text-slate-400">
        Listings are aggregated from third-party sites and link back to the original source.
        ClubHanger is not the seller. Listing data may be out of date — confirm details on the
        source listing.
      </p>

      {/* Cross-links */}
      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Browse other aircraft for sale</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {otherCombos.map((e) => (
            <Link
              key={`${e.makeSlug}/${e.modelSlug}`}
              href={`/aircraft/${e.makeSlug}/${e.modelSlug}`}
              className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
            >
              {e.make} {e.model} for sale
            </Link>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Link
            href="/aircraft"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            View all aircraft for sale <ArrowRight className="h-4 w-4" />
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
