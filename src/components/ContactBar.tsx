'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getOrCreateThread } from '@/app/actions'
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
}: Props) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  function handleMessage() {
    if (!posterId) return
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(`/partnerships/${listingId}`)}`)
      return
    }
    startTransition(async () => {
      const result = await getOrCreateThread(listingId, posterId)
      if ('threadId' in result) {
        router.push(`/messages/${result.threadId}`)
      }
    })
  }

  // Seed personas: messaging only (dead demo email/phone are suppressed).
  const showEmail = !isSeed && (contactMethod === 'email' || contactMethod === 'both')
  const showPhone = !isSeed && (contactMethod === 'phone' || contactMethod === 'both') && contactPhone
  const showMessage = !!posterId && user?.id !== posterId
  const firstName = contactName?.trim().split(/\s+/)[0]
  const messageLabel = isSeed && firstName ? `Message ${firstName}` : 'Message'

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
              onClick={handleMessage}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
            >
              <MessageCircle className="h-4 w-4" />
              {isPending ? 'Opening…' : messageLabel}
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
