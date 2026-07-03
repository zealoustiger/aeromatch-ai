'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Phone, MessageCircle, LogIn, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getOrCreateSeekerThread, sendMessage } from '@/app/actions'
import { getMessageDraft, setMessageDraft, clearMessageDraft } from '@/lib/messageDraft'
import type { User } from '@supabase/supabase-js'

interface Props {
  seekerId: string
  seekerOwnerId: string | null
  seekerPath: string
  title: string
  displayName: string | null
  contactEmail: string
  contactPhone: string | null
  contactMethod: string
}

export default function SeekerContactBar({
  seekerId,
  seekerOwnerId,
  seekerPath,
  title,
  displayName,
  contactEmail,
  contactPhone,
  contactMethod,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftKey = `seeker:${seekerId}`
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

  // Restore a message typed before an auth redirect (or an abandoned draft from
  // an earlier visit) so nothing the visitor already wrote is lost.
  useEffect(() => {
    const draft = getMessageDraft(draftKey)
    if (draft) {
      setText(draft)
      setExpanded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-open thread when returning from auth with ?contact=1, sending the
  // drafted message if one was captured before the sign-in redirect.
  useEffect(() => {
    if (searchParams.get('contact') !== '1') return
    if (!user || !seekerOwnerId || user.id === seekerOwnerId) return
    if (didAutoContact.current) return
    didAutoContact.current = true
    const url = new URL(window.location.href)
    url.searchParams.delete('contact')
    window.history.replaceState({}, '', url.toString())
    setErrorMsg(null)
    startTransition(async () => {
      const result = await getOrCreateSeekerThread(seekerId, seekerOwnerId)
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
  }, [user, searchParams, seekerId, seekerOwnerId, draftKey, router])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || !seekerOwnerId) return

    if (!user) {
      setMessageDraft(draftKey, trimmed)
      router.push(`/auth?next=${encodeURIComponent(seekerPath + '?contact=1')}`)
      return
    }

    setErrorMsg(null)
    startTransition(async () => {
      const result = await getOrCreateSeekerThread(seekerId, seekerOwnerId)
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

  const isOwner = user?.id === seekerOwnerId
  const showEmail = !isOwner && (contactMethod === 'email' || contactMethod === 'both')
  const showPhone = !isOwner && (contactMethod === 'phone' || contactMethod === 'both') && contactPhone
  const canMessage = !!seekerOwnerId && !isOwner

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
      <h2 className="mb-1 text-sm font-semibold text-sky-800">Have a plane that fits?</h2>
      {!user ? (
        <p className="mb-3 text-sm text-sky-700">
          To protect pilots&apos; privacy, contact details are only shown to signed-in
          members. Sign in to reach out{displayName ? ` to ${displayName}` : ''}.
        </p>
      ) : (
        displayName && <p className="mb-3 text-sm text-sky-700">Reach out to {displayName}</p>
      )}
      <div className="space-y-2">
        {canMessage && (expanded ? (
          <form onSubmit={handleSend} className="space-y-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${displayName ?? 'this pilot'} about your aircraft… (Enter to send)`}
              rows={3}
              className="w-full resize-none rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
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
            {user ? <MessageCircle className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            Send Message
          </button>
        ))}
        {showEmail && (
          <a
            href={`mailto:${contactEmail}?subject=Re: ${encodeURIComponent(title)}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" /> Send Email
          </a>
        )}
        {showPhone && (
          <a
            href={`tel:${contactPhone}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Phone className="h-4 w-4" /> {contactPhone}
          </a>
        )}
      </div>
    </div>
  )
}
