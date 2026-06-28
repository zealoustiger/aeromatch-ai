'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, MessageCircle } from 'lucide-react'
import { track } from '@/lib/analytics'
import { createClient } from '@/lib/supabase'
import { getOrCreateThread } from '@/app/actions'
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
    const pid = posterId
    if (!user) {
      // Preserve contact intent across auth: the ?contact=1 signal is auto-opened
      // by the always-mounted ContactBar on this page (single trigger, no dup thread).
      router.push(`/auth?next=${encodeURIComponent(`/partnerships/${listingId}?contact=1`)}`)
      return
    }
    startTransition(async () => {
      const result = await getOrCreateThread(listingId, pid)
      if ('threadId' in result) {
        router.push(`/messages/${result.threadId}`)
      }
    })
  }

  const showMessage = !!posterId && user?.id !== posterId

  return (
    <div className="space-y-2">
      {showMessage && (
        <button
          onClick={handleMessage}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
        >
          <MessageCircle className="h-4 w-4" />
          {isPending ? 'Opening…' : 'Message'}
        </button>
      )}
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
