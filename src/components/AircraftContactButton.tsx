'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getOrCreateAircraftThread, sendMessage } from '@/app/actions'
import { getMessageDraft, setMessageDraft, clearMessageDraft } from '@/lib/messageDraft'
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
  const draftKey = `aircraft:${aircraftId}`
  const [user, setUser] = useState<User | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const didAutoContact = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Restore a message typed before an auth redirect (or an abandoned draft from an
  // earlier visit) so nothing the visitor already wrote is lost.
  useEffect(() => {
    const draft = getMessageDraft(draftKey)
    if (draft) {
      setText(draft)
      setExpanded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-send the drafted message and open the thread when returning from auth
  // with ?contact=1 — this is the actual "value moment" capture: the visitor
  // already composed their message before hitting the sign-in wall.
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
      if ('threadId' in result) {
        const draft = getMessageDraft(draftKey)
        if (draft) {
          await sendMessage(result.threadId, draft)
          clearMessageDraft(draftKey)
        }
        router.push(`/messages/${result.threadId}`)
      } else {
        setErrorMsg(result.error ?? 'Could not open conversation.')
      }
    })
  }, [user, searchParams, aircraftId, posterId, draftKey, router])

  // Viewer is the poster — show a neutral "your listing" note.
  if (user?.id === posterId) {
    return (
      <p className="text-sm text-slate-500">
        This is your listing. Interested buyers can message you once they sign in.
      </p>
    )
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    if (!user) {
      setMessageDraft(draftKey, trimmed)
      router.push(`/auth?next=${encodeURIComponent(listingPath + '?contact=1')}`)
      return
    }

    setErrorMsg(null)
    startTransition(async () => {
      const result = await getOrCreateAircraftThread(aircraftId, posterId)
      if ('threadId' in result) {
        await sendMessage(result.threadId, trimmed)
        clearMessageDraft(draftKey)
        router.push(`/messages/${result.threadId}`)
      } else {
        setErrorMsg(result.error ?? 'Could not open conversation.')
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => {
          setExpanded(true)
          setTimeout(() => textareaRef.current?.focus(), 0)
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
      >
        <MessageCircle className="h-4 w-4" />
        Message seller
      </button>
    )
  }

  return (
    <form onSubmit={handleSend} className="space-y-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about the aircraft… (Enter to send)"
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
      <button
        type="submit"
        disabled={!text.trim() || isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {isPending ? 'Sending…' : user ? 'Send' : 'Sign in & send'}
      </button>
      {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
    </form>
  )
}
