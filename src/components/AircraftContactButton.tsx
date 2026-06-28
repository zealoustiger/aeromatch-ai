'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getOrCreateAircraftThread } from '@/app/actions'
import type { User } from '@supabase/supabase-js'

export default function AircraftContactButton({
  aircraftId,
  posterId,
  listingPath,
}: {
  aircraftId: string
  posterId: string
  listingPath: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const didAutoContact = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Auto-open thread when returning from auth with ?contact=1
  useEffect(() => {
    if (searchParams.get('contact') !== '1') return
    if (!user || user.id === posterId) return
    if (didAutoContact.current) return
    didAutoContact.current = true
    const url = new URL(window.location.href)
    url.searchParams.delete('contact')
    window.history.replaceState({}, '', url.toString())
    setErrorMsg(null)
    startTransition(async () => {
      const result = await getOrCreateAircraftThread(aircraftId, posterId)
      if ('threadId' in result) router.push(`/messages/${result.threadId}`)
      else setErrorMsg(result.error ?? 'Could not open conversation.')
    })
  }, [user, searchParams, aircraftId, posterId, router])

  // Viewer is the poster — show a neutral "your listing" note.
  if (user?.id === posterId) {
    return (
      <p className="text-sm text-slate-500">
        This is your listing. Interested buyers can message you once they sign in.
      </p>
    )
  }

  function handleMessage() {
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(listingPath + '?contact=1')}`)
      return
    }
    setErrorMsg(null)
    startTransition(async () => {
      const result = await getOrCreateAircraftThread(aircraftId, posterId)
      if ('threadId' in result) {
        router.push(`/messages/${result.threadId}`)
      } else {
        setErrorMsg(result.error ?? 'Could not open conversation.')
      }
    })
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleMessage}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
      >
        <MessageCircle className="h-4 w-4" />
        {isPending ? 'Opening…' : 'Message seller'}
      </button>
      {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
    </div>
  )
}
