'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FileEdit, X } from 'lucide-react'

interface DraftType {
  key: string
  href: string
  label: string
}

// Same localStorage keys the three "Post a…" forms already autosave to via
// `useFormDraft` — this component only reads them, it never writes.
const DRAFT_TYPES: DraftType[] = [
  { key: 'ch:draft:partnership-new', href: '/partnerships/new', label: 'aircraft partnership listing' },
  { key: 'ch:draft:aircraft-new', href: '/aircraft/new', label: 'aircraft for sale listing' },
  { key: 'ch:draft:seeker-new', href: '/partnerships/seeking/new', label: 'pilot-seeking listing' },
]

function hasDraft(key: string): boolean {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return false
    const data = JSON.parse(raw)
    return !!data && typeof data === 'object' && Object.keys(data).length > 0
  } catch {
    return false
  }
}

/**
 * A small dismissible reminder, floating above the page, for a visitor who started (and
 * autosaved) a "Post a…" draft but navigated away before publishing — otherwise that
 * half-finished listing is invisible again the moment they leave the post page. Read-only
 * against the existing `useFormDraft` localStorage keys; self-suppresses on the matching
 * post page itself (which already shows its own restore indicator) and once dismissed for
 * the session.
 */
export default function DraftResumeBanner() {
  const pathname = usePathname()
  const [draft, setDraft] = useState<DraftType | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDraft(DRAFT_TYPES.find((d) => hasDraft(d.key)) ?? null)
  }, [pathname])

  if (dismissed || !draft) return null
  if (pathname && pathname.startsWith(draft.href)) return null

  return (
    <div className="fixed bottom-20 left-5 right-5 z-40 sm:bottom-5 sm:right-auto sm:w-80">
      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-white p-3.5 shadow-lg">
        <FileEdit className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">Unfinished listing</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Draft in progress: {draft.label} — pick up where you left off.
          </p>
          <Link
            href={draft.href}
            className="mt-2 inline-block text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline"
          >
            Continue draft →
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
