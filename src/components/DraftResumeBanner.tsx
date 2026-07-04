'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FileEdit, X } from 'lucide-react'

interface DraftType {
  key: string
  href: string
  label: string
  isEdit: boolean
}

// Same localStorage keys the three "Post a…" forms already autosave to via
// `useFormDraft` — this component only reads them, it never writes.
const NEW_DRAFT_TYPES: DraftType[] = [
  { key: 'ch:draft:partnership-new', href: '/partnerships/new', label: 'aircraft partnership listing', isEdit: false },
  { key: 'ch:draft:aircraft-new', href: '/aircraft/new', label: 'aircraft for sale listing', isEdit: false },
  { key: 'ch:draft:seeker-new', href: '/partnerships/seeking/new', label: 'pilot-seeking listing', isEdit: false },
]

// Edit-mode drafts are keyed per-listing (`ch:draft:{type}-edit:{id}`), so unlike the
// fixed "new" keys above we have to scan localStorage for a match.
const EDIT_DRAFT_TYPES: { prefix: string; hrefPrefix: string; label: string }[] = [
  { prefix: 'ch:draft:partnership-edit:', hrefPrefix: '/partnerships', label: 'aircraft partnership listing' },
  { prefix: 'ch:draft:aircraft-edit:', hrefPrefix: '/aircraft/listing', label: 'aircraft for sale listing' },
  { prefix: 'ch:draft:seeker-edit:', hrefPrefix: '/partnerships/seeking', label: 'pilot-seeking listing' },
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

// New-post drafts take priority (checked first, same order as before); an edit-mode
// draft is only surfaced if no new-post draft is in progress, so at most one banner shows.
function findDraft(): DraftType | null {
  const newDraft = NEW_DRAFT_TYPES.find((d) => hasDraft(d.key))
  if (newDraft) return newDraft

  let keys: string[]
  try {
    keys = Object.keys(window.localStorage)
  } catch {
    return null
  }
  for (const { prefix, hrefPrefix, label } of EDIT_DRAFT_TYPES) {
    const match = keys.find((k) => k.startsWith(prefix) && hasDraft(k))
    if (!match) continue
    const id = match.slice(prefix.length)
    if (!id) continue
    return { key: match, href: `${hrefPrefix}/${id}/edit`, label, isEdit: true }
  }
  return null
}

/**
 * A small dismissible reminder, floating above the page, for a visitor who started (and
 * autosaved) a "Post a…" draft, or edited a published listing, but navigated away before
 * saving — otherwise that unsaved work is invisible again the moment they leave the page.
 * Read-only against the existing `useFormDraft` localStorage keys; self-suppresses on the
 * matching post/edit page itself (which already shows its own restore indicator) and once
 * dismissed for the session.
 */
export default function DraftResumeBanner() {
  const pathname = usePathname()
  const [draft, setDraft] = useState<DraftType | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDraft(findDraft())
  }, [pathname])

  if (dismissed || !draft) return null
  if (pathname && pathname.startsWith(draft.href)) return null

  return (
    <div className="fixed bottom-20 left-5 right-5 z-40 sm:bottom-5 sm:right-auto sm:w-80">
      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-white p-3.5 shadow-lg">
        <FileEdit className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">
            {draft.isEdit ? 'Unsaved changes' : 'Unfinished listing'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {draft.isEdit
              ? `You have unsaved edits to your ${draft.label} — pick up where you left off.`
              : `Draft in progress: ${draft.label} — pick up where you left off.`}
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
