import Link from 'next/link'
import { Compass } from 'lucide-react'
import AlertSignup from '@/components/AlertSignup'

// Root not-found: Next.js renders this inside RootLayout (Nav/Footer stay) for both
// notFound() calls and any URL that matches no route at all, and automatically returns
// a real 404 status + noindex — no metadata export needed here.
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-500">
        <Compass className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-slate-500">
        The link may be broken or the listing may no longer exist. Try browsing what&apos;s
        available instead.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/aircraft"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          Browse aircraft for sale
        </Link>
        <Link
          href="/partnerships"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Browse partnerships
        </Link>
      </div>

      <AlertSignup sourcePath="/" className="mt-12 w-full text-left" />
    </div>
  )
}
