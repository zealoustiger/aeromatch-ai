'use client'

// Segment error boundary: catches uncaught errors thrown while rendering any
// page in the app tree and renders a branded fallback INSIDE the root layout
// (Nav + Footer stay). Pairs with global-error.tsx, which only fires if the root
// layout itself throws. Before this existed the app had no boundary, so a server
// error fell back to Next's built-in default error UI/chunk.
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface the real error in the server/browser console instead of letting it
    // be swallowed silently (the masking the airport-500 investigation hit).
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-500">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-500">
        We hit an unexpected error loading this page. It&apos;s not you — try again, or head
        back to browse aircraft partnerships and planes for sale.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-slate-400">Reference: {error.digest}</p>
      )}
    </div>
  )
}
