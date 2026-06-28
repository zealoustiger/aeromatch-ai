'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Bookmark, CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { saveSearch } from '@/app/actions'
import { autoNameSearch } from '@/lib/savedSearchName'
import type { User } from '@supabase/supabase-js'

// Marker appended to the post-auth `next=` URL so a logged-out user's "save this
// search" intent survives the sign-in round trip and auto-completes on return —
// mirrors the ?contact=1 pattern the message buttons use to auto-open a thread.
const SAVE_INTENT_PARAM = 'saveSearch'

export default function SaveSearchButton({
  basePath = '/partnerships',
  fullWidth = false,
}: {
  basePath?: string
  /** Render full-width — used inside the narrow filter panel / mobile drawer so the
   *  control matches the adjacent "Clear all filters" button. Default keeps the
   *  compact inline appearance for the top action bar (unchanged). */
  fullWidth?: boolean
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  // After a save we swap the button for a confirmation that links to /searches.
  // `already` distinguishes a fresh save from a duplicate of an identical search.
  const [done, setDone] = useState<null | { already: boolean }>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()
  const didAutoSave = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Active filters minus our auth round-trip marker — this is what we actually save
  // and auto-name from (the marker must never leak into the stored search query).
  const cleanParams = (() => {
    const sp = new URLSearchParams(searchParams.toString())
    sp.delete(SAVE_INTENT_PARAM)
    return sp.toString()
  })()

  // One-shot save: auto-name from the active filters and persist. Shared by the
  // click handler and the post-auth auto-trigger.
  function runSave() {
    setErrorMsg('')
    const name = autoNameSearch(cleanParams, basePath)
    startTransition(async () => {
      const result = await saveSearch(name, cleanParams, basePath)
      if (result.error) {
        // A same-name collision means this exact search is already saved — treat as
        // success (still point them to where it lives) rather than a scary error.
        if (/already have a search/i.test(result.error)) setDone({ already: true })
        else setErrorMsg(result.error)
      } else {
        setDone({ already: false })
      }
    })
  }

  // Returning from auth with the save-search intent marker → complete the save the
  // user originally clicked, once, then strip the marker from the URL so a reload
  // won't re-fire it and the saved filters stay clean (mirrors ContactBar's
  // ?contact=1 auto-open).
  useEffect(() => {
    if (searchParams.get(SAVE_INTENT_PARAM) !== '1') return
    if (!user || !cleanParams || didAutoSave.current) return
    didAutoSave.current = true
    const url = new URL(window.location.href)
    url.searchParams.delete(SAVE_INTENT_PARAM)
    window.history.replaceState({}, '', url.toString())
    runSave()
  }, [user, searchParams, cleanParams]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!cleanParams) return null

  // One click: auto-name from the active filters and save immediately. No naming
  // step — the user renames later on /searches (slice 2). Signed-out → auth with an
  // intent marker, then back to this exact filtered search where the save
  // auto-completes (above).
  function handleSaveClick() {
    if (!user) {
      const next = `${basePath}?${cleanParams}&${SAVE_INTENT_PARAM}=1`
      router.push(`/auth?next=${encodeURIComponent(next)}`)
      return
    }
    runSave()
  }

  if (done) {
    return (
      <div
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700${
          fullWidth ? ' w-full justify-center' : ''
        }`}
      >
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4" />
          {done.already ? 'Already saved' : 'Search saved'}
        </span>
        <Link
          href="/searches"
          className="inline-flex items-center gap-0.5 font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
        >
          View in Saved Searches <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  // Prominent sky-accent treatment: saving a *listing* (the heart on every card) is
  // obvious, but saving a *search* was a muted gray control users missed. This makes
  // the two discoverable at the same level without adding a second affordance.
  return (
    <div className={fullWidth ? 'w-full' : undefined}>
      <button
        onClick={handleSaveClick}
        disabled={isPending}
        className={`flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition-colors hover:border-sky-400 hover:bg-sky-100 disabled:opacity-60${
          fullWidth ? ' w-full justify-center' : ''
        }`}
      >
        <Bookmark className="h-4 w-4" />
        {isPending ? 'Saving…' : 'Save this search'}
      </button>
      {errorMsg && <p className="mt-1 text-xs text-red-600">{errorMsg}</p>}
    </div>
  )
}
