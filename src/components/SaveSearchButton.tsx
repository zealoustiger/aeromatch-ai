'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Bookmark, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { saveSearch } from '@/app/actions'
import type { User } from '@supabase/supabase-js'

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
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const paramsStr = searchParams.toString()
  if (!paramsStr) return null

  function handleSaveClick() {
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(basePath + '?' + paramsStr)}`)
      return
    }
    setShowForm(true)
    setName('')
    setErrorMsg('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setErrorMsg('')
    startTransition(async () => {
      const result = await saveSearch(name, paramsStr, basePath)
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        setSaved(true)
        setShowForm(false)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  if (saved) {
    return (
      <div className={`flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700${fullWidth ? ' w-full justify-center' : ''}`}>
        <CheckCircle className="h-4 w-4" />
        Saved!
      </div>
    )
  }

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className={`flex flex-wrap items-center gap-2${fullWidth ? ' w-full' : ''}`}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this search…"
          autoFocus
          className={`rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100${fullWidth ? ' w-full' : ''}`}
        />
        <button
          type="submit"
          disabled={!name.trim() || isPending}
          className={`rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60${fullWidth ? ' flex-1' : ''}`}
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className={`rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100${fullWidth ? ' flex-1' : ''}`}
        >
          Cancel
        </button>
        {errorMsg && <p className="w-full text-xs text-red-600">{errorMsg}</p>}
      </form>
    )
  }

  // Prominent sky-accent treatment: saving a *listing* (the heart on every card) is
  // obvious, but saving a *search* was a muted gray control users missed. This makes
  // the two discoverable at the same level without adding a second affordance.
  return (
    <button
      onClick={handleSaveClick}
      className={`flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition-colors hover:border-sky-400 hover:bg-sky-100${fullWidth ? ' w-full justify-center' : ''}`}
    >
      <Bookmark className="h-4 w-4" />
      Save this search
    </button>
  )
}
