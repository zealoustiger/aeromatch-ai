'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bookmark, CheckCircle } from 'lucide-react'
import { saveSearch } from '@/app/actions'
import { autoNameSearch } from '@/lib/savedSearchName'

/**
 * One-tap "save as a search" for an email alert that has no matching
 * `saved_searches` row (see /searches's "Your email alerts" section) — reuses
 * the existing `saveSearch` action, which is idempotent on the alert insert
 * (23505 → success) so this never creates a duplicate alert, only the missing
 * saved-search row. Only rendered for alerts whose source_path base is one of
 * the three saveable marketplaces (see /searches/page.tsx's SAVABLE_ALERT_PATHS).
 */
export default function SaveAlertAsSearchButton({
  sourcePath,
  context,
}: {
  sourcePath: string
  context: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<null | { already: boolean }>(null)
  const [errorMsg, setErrorMsg] = useState('')

  function handleSave() {
    setErrorMsg('')
    const qIdx = sourcePath.indexOf('?')
    const basePath = qIdx === -1 ? sourcePath : sourcePath.slice(0, qIdx)
    const params = qIdx === -1 ? '' : sourcePath.slice(qIdx + 1)
    const name = context?.trim() || autoNameSearch(params, basePath)
    startTransition(async () => {
      const result = await saveSearch(name, params, basePath)
      if (result.error) {
        if (/already have a search/i.test(result.error)) setDone({ already: true })
        else setErrorMsg(result.error)
      } else {
        setDone({ already: false })
      }
    })
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <CheckCircle className="h-3.5 w-3.5" />
        {done.already ? 'Already a saved search' : 'Saved as a search'}
      </span>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50"
      >
        <Bookmark className="h-3.5 w-3.5" />
        {isPending ? 'Saving…' : 'Save as a search'}
      </button>
      {errorMsg && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {errorMsg}{' '}
          <Link href="/alerts/manage" className="underline underline-offset-2">
            Manage alerts
          </Link>
        </p>
      )}
    </div>
  )
}
