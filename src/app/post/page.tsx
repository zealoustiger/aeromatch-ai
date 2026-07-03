import type { Metadata } from 'next'
import Link from 'next/link'
import { Plane, Handshake, UserSearch, ArrowRight } from 'lucide-react'
import type { ComponentType } from 'react'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Post a Listing — ClubHanger',
  description: 'Sell an aircraft, post a partnership share, or list that you’re seeking a partnership.',
  robots: { index: false, follow: false },
}

const CHOICES: {
  href: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}[] = [
  {
    href: '/aircraft/new',
    title: 'Sell an aircraft',
    description: 'List a whole aircraft for sale. Free, reaches buyers searching by make, model, price, and state.',
    icon: Plane,
  },
  {
    href: '/partnerships/new',
    title: 'Post a partnership',
    description: 'Offer shares in a plane you own, or in one you’re buying. Set the split, price, and terms.',
    icon: Handshake,
  },
  {
    href: '/partnerships/seeking/new',
    title: 'Seeking a partnership',
    description: 'Let owners know you’re looking to buy into a share near a given airport.',
    icon: UserSearch,
  },
]

export default function PostChooserPage() {
  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Post a Listing' }]} />

        <header className="mt-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            What would you like to post?
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Pick the option below that matches what you're looking to do. All three are free.
          </p>
        </header>

        <div className="mt-8 space-y-4">
          {CHOICES.map((c) => {
            const Icon = c.icon
            return (
              <Link
                key={c.href}
                href={c.href}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-sky-300 hover:bg-sky-50"
              >
                <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-sky-700">
                    {c.title}
                    <ArrowRight className="h-4 w-4 shrink-0 text-sky-500 opacity-0 transition group-hover:opacity-100" />
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-500">
                    {c.description}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
