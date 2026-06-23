import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, TrendingUp, ArrowRight } from 'lucide-react'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'

const TITLE = 'Aircraft Partnership Calculators & Tools'
const DESCRIPTION =
  'Free aircraft partnership calculators: work out the true monthly and per-hour cost of a co-ownership share, or model how much offering shares in your plane could offset your fixed costs.'
const PATH = '/tools'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${PATH}`,
    type: 'website',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE, alt: `${TITLE} on ${SITE_NAME}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

const TOOLS = [
  {
    href: '/tools/cost-calculator',
    title: 'Cost calculator',
    description:
      'See the true all-in monthly and per-hour cost of a partnership share, and how it compares to renting or owning the plane outright.',
    icon: Calculator,
  },
  {
    href: '/tools/earnings-calculator',
    title: 'Earnings calculator',
    description:
      'Own a plane that sits idle? Model how much bringing on partners could offset your hangar, insurance, and annual reserve.',
    icon: TrendingUp,
  },
]

export default function ToolsHubPage() {
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${PATH}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: TOOLS.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}${t.href}`,
        name: t.title,
      })),
    },
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tools' },
        ]}
      />

      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Aircraft partnership calculators
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-500">
          Two free, no-signup calculators to run the numbers before you share a plane — whether
          you&apos;re buying into a partnership or offering shares in an aircraft you already own.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        {TOOLS.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-sky-300 hover:bg-sky-50"
            >
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-sky-700">
                  {t.title}
                  <ArrowRight className="h-4 w-4 shrink-0 text-sky-500 opacity-0 transition group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-500">
                  {t.description}
                </span>
              </span>
            </Link>
          )
        })}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    </div>
  )
}
