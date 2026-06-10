'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Bookmark, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { saveSearch } from '@/app/actions'
import type { User } from '@supabase/supabase-js'

export default function SaveSearchButton() {
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
      router.push(`/auth?next=${encodeURIComponent('/partnerships?' + paramsStr)}`)
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
      const result = await saveSearch(name, paramsStr)
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
      <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        <CheckCircle className="h-4 w-4" />
        Saved!
      </div>
    )
  }

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this search…"
          autoFocus
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
        <button
          type="submit"
          disabled={!name.trim() || isPending}
          className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
        >
          Cancel
        </button>
        {errorMsg && <p className="w-full text-xs text-red-600">{errorMsg}</p>}
      </form>
    )
  }

  return (
    <button
      onClick={handleSaveClick}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-sky-700"
    >
      <Bookmark className="h-4 w-4" />
      Save this search
    </button>
  )
}
