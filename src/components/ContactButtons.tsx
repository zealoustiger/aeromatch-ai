'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, MessageCircle, Send } from 'lucide-react'
import { track } from '@/lib/analytics'
import { createClient } from '@/lib/supabase'
import { getOrCreateThread, sendMessage } from '@/app/actions'
import { getMessageDraft, setMessageDraft, clearMessageDraft } from '@/lib/messageDraft'
import type { User } from '@supabase/supabase-js'

export default function ContactButtons({
  listingId,
  title,
  contactEmail,
  contactPhone,
  contactMethod,
  posterId,
}: {
  listingId: string
  title: string
  contactEmail: string
  contactPhone: string | null
  contactMethod: string
  posterId?: string | null
}) {
  const router = useRouter()
  const draftKey = `partnership:${listingId}`
  const [user, setUser] = useState<User | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Restore a message typed before an auth redirect (or an abandoned draft from
  // an earlier visit) so nothing the visitor already wrote is lost. The
  // auto-send-on-return effect itself lives on the always-mounted ContactBar
  // (single trigger, no duplicate thread creation) — this component only
  // needs to re-show whatever the visitor had typed.
  useEffect(() => {
    const draft = getMessageDraft(draftKey)
    if (draft) {
      setText(draft)
      setExpanded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || !posterId) return
    const pid = posterId

    if (!user) {
      setMessageDraft(draftKey, trimmed)
      router.push(`/auth?next=${encodeURIComponent(`/partnerships/${listingId}?contact=1`)}`)
      return
    }

    setErrorMsg(null)
    startTransition(async () => {
      const result = await getOrCreateThread(listingId, pid)
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

  const showMessage = !!posterId && user?.id !== posterId

  return (
    <div className="space-y-2">
      {showMessage && (expanded ? (
        <form onSubmit={handleSend} className="space-y-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this partnership… (Enter to send)"
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          <button
            type="submit"
            disabled={!text.trim() || isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {isPending ? 'Sending…' : user ? 'Send' : 'Sign in & send'}
          </button>
          {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
        </form>
      ) : (
        <button
          onClick={() => {
            setExpanded(true)
            setTimeout(() => textareaRef.current?.focus(), 0)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <MessageCircle className="h-4 w-4" />
          Message
        </button>
      ))}
      {(contactMethod === 'email' || contactMethod === 'both') && (
        <a
          href={`mailto:${contactEmail}?subject=Re: ${encodeURIComponent(title)}`}
          onClick={() => track('contact_initiated', { listing_id: listingId, method: 'email' })}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          <Mail className="h-4 w-4" /> Send Email
        </a>
      )}
      {(contactMethod === 'phone' || contactMethod === 'both') && contactPhone && (
        <a
          href={`tel:${contactPhone}`}
          onClick={() => track('contact_initiated', { listing_id: listingId, method: 'phone' })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-white py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50"
        >
          <Phone className="h-4 w-4" /> {contactPhone}
        </a>
      )}
    </div>
  )
}
