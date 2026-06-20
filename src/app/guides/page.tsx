import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BookOpen,
  Users,
  Wallet,
  FileText,
  Scale,
  Search,
  ArrowRight,
  Calculator,
} from 'lucide-react'
import { SITE_URL } from '@/lib/seo'
import Breadcrumbs from '@/components/Breadcrumbs'

const TITLE = 'Aircraft Co-Ownership Guides'
const PATH = '/guides'
const DESCRIPTION =
  'Plain-English guides to aircraft co-ownership and flying partnerships: how shared ownership works, what it really costs, and what to put in a partnership agreement. Honest, educational explainers written for pilots — no jargon, no sales pitch.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} — How Sharing a Plane Works | ClubHanger` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description:
      'Pilot-written guides to aircraft co-ownership: how partnerships work, what they cost, and what belongs in a co-ownership agreement.',
    url: `${SITE_URL}${PATH}`,
    type: 'website',
  },
}

// The three pillar guides — SINGLE source of truth for the visible cards AND the
// CollectionPage / ItemList JSON-LD, so the structured data can never list a
// guide that isn't shown on the page.
const GUIDES: {
  path: string
  title: string
  description: string
  icon: typeof Users
}[] = [
  {
    path: '/guides/aircraft-co-ownership',
    title: 'How Aircraft Co-Ownership & Partnerships Work',
    description:
      'The starting point: how shared ownership works, the types of shares, how partners split costs, and how to find the right partner.',
    icon: Users,
  },
  {
    path: '/guides/cost-of-aircraft-co-ownership',
    title: 'How Much Does It Cost to Co-Own an Aircraft?',
    description:
      'A full cost breakdown — buy-in, fixed costs, and hourly costs — with a worked Cessna 172 example and honest, labeled estimate ranges.',
    icon: Wallet,
  },
  {
    path: '/guides/aircraft-partnership-agreement',
    title: 'What to Put in an Aircraft Partnership Agreement',
    description:
      'A plain-English checklist of what a good agreement should cover: shares and buy-out, scheduling, cost-sharing, maintenance, insurance, disputes, and exit.',
    icon: FileText,
  },
  {
    path: '/guides/leaseback-vs-co-ownership',
    title: 'Aircraft Leaseback vs. Co-Ownership',
    description:
      'The decision guide: leaseback (rent your plane to a flight school for income) versus co-ownership (share the plane and costs with partners) — who each is for, control, wear, tax and insurance, and how to choose.',
    icon: Scale,
  },
  {
    path: '/guides/how-to-find-aircraft-partners',
    title: 'How to Find Aircraft Co-Owners & Partners',
    description:
      'The sourcing playbook: where to look for partners (flying clubs, FBOs, EAA chapters, type clubs, airport boards, and online), how to vet a candidate, the red flags to avoid, how many partners makes sense, and how to go from a match to a signed agreement.',
    icon: Search,
  },
]

export default function GuidesHubPage() {
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${PATH}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: GUIDES.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}${g.path}`,
        name: g.title,
      })),
    },
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Guides' },
        ]}
      />

      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Aircraft Co-Ownership Guides
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-500">
          Thinking about sharing a plane? These plain-English guides walk through how aircraft
          co-ownership and flying partnerships actually work — how they&apos;re structured, what they
          really cost, and what to write down before you sign. They&apos;re honest, educational
          explainers written for pilots, not a sales pitch.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        {GUIDES.map((g) => {
          const Icon = g.icon
          return (
            <Link
              key={g.path}
              href={g.path}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-sky-300 hover:bg-sky-50"
            >
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-sky-700">
                  {g.title}
                  <ArrowRight className="h-4 w-4 shrink-0 text-sky-500 opacity-0 transition group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-500">
                  {g.description}
                </span>
              </span>
            </Link>
          )
        })}
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl border border-sky-100 bg-sky-50 p-6 text-center">
        <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-slate-900">
          <BookOpen className="h-5 w-5 text-sky-600" /> Ready to put it into practice?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">
          Estimate a fair cost split for your group, then see who&apos;s looking to share a plane near
          you.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/tools/cost-calculator"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 font-medium text-white hover:bg-sky-700"
          >
            <Calculator className="h-5 w-5" /> Estimate your cost
          </Link>
          <Link
            href="/partnerships"
            className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-5 py-2.5 font-medium text-sky-700 hover:bg-sky-50"
          >
            <Users className="h-5 w-5" /> Browse partnerships <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    </div>
  )
}
