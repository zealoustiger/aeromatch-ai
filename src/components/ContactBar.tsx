'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Phone, MessageCircle, Send, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getOrCreateThread, sendMessage } from '@/app/actions'
import { getMessageDraft, setMessageDraft, clearMessageDraft } from '@/lib/messageDraft'
import AlertSignup from './AlertSignup'
import type { User } from '@supabase/supabase-js'

interface Props {
  listingId: string
  posterId: string | null
  title: string
  contactEmail: string
  contactPhone: string | null
  contactMethod: string
  contactName: string | null
  /** Seed/concierge persona: messaging only (the email/phone are dead demo
   *  contacts), and the button is labelled with the persona's first name. */
  isSeed?: boolean
  /** The same make/model context + search path the page's own family
   *  AlertSignup box uses — passed through so the post-contact cross-sell
   *  below alerts on the same real search, not a fabricated one. */
  alertContext?: string
  alertSourcePath?: string
  alertCount?: number
  matchCount?: number
}

export default function ContactBar({
  listingId,
  posterId,
  title,
  contactEmail,
  contactPhone,
  contactMethod,
  contactName,
  isSeed = false,
  alertContext,
  alertSourcePath,
  alertCount,
  matchCount,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftKey = `partnership:${listingId}`
  const [user, setUser] = useState<User | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // Set only once a message has actually sent — mirrors ContactButtons'
  // (desktop) post-contact cross-sell moment, so the mobile sticky bar
  // offers the same one-screen pause before the visitor leaves for the
  // conversation, instead of navigating away immediately.
  const [sentThreadId, setSentThreadId] = useState<string | null>(null)
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
  // drafted message if one was captured before the sign-in redirect. This
  // component is always mounted (just CSS-hidden on desktop), so it's the
  // single owner of this effect — ContactButtons relies on it rather than
  // duplicating the trigger.
  useEffect(() => {
    if (searchParams.get('contact') !== '1') return
    if (!user || !posterId || user.id === posterId) return
    if (didAutoContact.current) return
    didAutoContact.current = true
    const url = new URL(window.location.href)
    url.searchParams.delete('contact')
    window.history.replaceState({}, '', url.toString())
    setErrorMsg(null)
    startTransition(async () => {
      const result = await getOrCreateThread(listingId, posterId)
      if ('threadId' in result) {
        const draft = getMessageDraft(draftKey)
        if (draft) {
          await sendMessage(result.threadId, draft)
          clearMessageDraft(draftKey)
          // A message actually sent just now — show the cross-sell beat
          // instead of navigating straight past it.
          setSentThreadId(result.threadId)
        } else {
          // No drafted message to send (just resuming after auth) —
          // nothing was "just sent," so there's no success moment to pause on.
          router.push(`/messages/${result.threadId}`)
        }
      } else {
        setErrorMsg(result.error ?? 'Could not open conversation.')
      }
    })
  }, [user, searchParams, listingId, posterId, draftKey, router])

  // Viewer is the poster — show a neutral note instead of Email/Call buttons
  // that would just contact themselves.
  if (!isSeed && user?.id === posterId) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 pb-safe shadow-lg backdrop-blur-sm lg:hidden">
        <p className="mx-auto max-w-lg text-center text-sm text-slate-500">
          This is your listing. Interested buyers can message you once they sign in.
        </p>
      </div>
    )
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || !posterId) return

    if (!user) {
      setMessageDraft(draftKey, trimmed)
      router.push(`/auth?next=${encodeURIComponent(`/partnerships/${listingId}?contact=1`)}`)
      return
    }

    setErrorMsg(null)
    startTransition(async () => {
      const result = await getOrCreateThread(listingId, posterId)
      if ('threadId' in result) {
        await sendMessage(result.threadId, trimmed)
        clearMessageDraft(draftKey)
        setSentThreadId(result.threadId)
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

  if (sentThreadId) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-safe shadow-lg backdrop-blur-sm lg:hidden">
        <div className="mx-auto max-w-lg space-y-3 py-1">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Message sent!
          </p>
          <AlertSignup
            context={alertContext}
            source="post_contact"
            sourcePath={alertSourcePath ?? '/partnerships'}
            noun="partnership"
            alertCount={alertCount}
            matchCount={matchCount}
            className="my-0"
          />
          <button
            type="button"
            onClick={() => router.push(`/messages/${sentThreadId}`)}
            className="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            View conversation →
          </button>
        </div>
      </div>
    )
  }

  // Seed personas: messaging only (dead demo email/phone are suppressed).
  const showEmail = !isSeed && (contactMethod === 'email' || contactMethod === 'both')
  const showPhone = !isSeed && (contactMethod === 'phone' || contactMethod === 'both') && contactPhone
  const showMessage = !!posterId && user?.id !== posterId
  const firstName = contactName?.trim().split(/\s+/)[0]
  const messageLabel = isSeed && firstName ? `Message ${firstName}` : 'Message'

  if (showMessage && expanded) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-safe shadow-lg backdrop-blur-sm lg:hidden">
        <form onSubmit={handleSend} className="mx-auto max-w-lg space-y-2 py-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${isSeed && firstName ? firstName : 'the owner'} about this partnership… (Enter to send)`}
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          <button
            type="submit"
            disabled={!text.trim() || isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {isPending ? 'Sending…' : user ? 'Send' : 'Sign in & send'}
          </button>
          {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
        </form>
      </div>
    )
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-safe shadow-lg backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        {contactName && (
          <p className="min-w-0 shrink truncate text-xs text-slate-500 sm:block hidden">
            Contact {contactName}
          </p>
        )}
        <div className="flex flex-1 gap-2">
          {showMessage && (
            <button
              onClick={() => {
                setExpanded(true)
                setTimeout(() => textareaRef.current?.focus(), 0)
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              <MessageCircle className="h-4 w-4" />
              {messageLabel}
            </button>
          )}
          {showEmail && (
            <a
              href={`mailto:${contactEmail}?subject=Re: ${encodeURIComponent(title)}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
          )}
          {showPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
