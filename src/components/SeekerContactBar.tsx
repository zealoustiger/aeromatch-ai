'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Phone, MessageCircle, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getOrCreateSeekerThread } from '@/app/actions'
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
  const [user, setUser] = useState<User | null>(null)
  const [isPending, startTransition] = useTransition()
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
    if (!user || !seekerOwnerId || user.id === seekerOwnerId) return
    if (didAutoContact.current) return
    didAutoContact.current = true
    const url = new URL(window.location.href)
    url.searchParams.delete('contact')
    window.history.replaceState({}, '', url.toString())
    startTransition(async () => {
      const result = await getOrCreateSeekerThread(seekerId, seekerOwnerId)
      if ('threadId' in result) router.push(`/messages/${result.threadId}`)
    })
  }, [user, searchParams, seekerId, seekerOwnerId, router])

  function handleMessage() {
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(seekerPath + '?contact=1')}`)
      return
    }
    if (!seekerOwnerId) return
    startTransition(async () => {
      const result = await getOrCreateSeekerThread(seekerId, seekerOwnerId)
      if ('threadId' in result) {
        router.push(`/messages/${result.threadId}`)
      }
    })
  }

  const isOwner = user?.id === seekerOwnerId
  const showEmail = !isOwner && (contactMethod === 'email' || contactMethod === 'both')
  const showPhone = !isOwner && (contactMethod === 'phone' || contactMethod === 'both') && contactPhone
  const canMessage = !!seekerOwnerId && !isOwner

  if (!user) {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
        <h2 className="mb-1 text-sm font-semibold text-sky-800">Have a plane that fits?</h2>
        <p className="mb-3 text-sm text-sky-700">
          To protect pilots&apos; privacy, contact details are only shown to signed-in
          members. Sign in to reach out{displayName ? ` to ${displayName}` : ''}.
        </p>
        <button
          onClick={handleMessage}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          <LogIn className="h-4 w-4" /> Sign in to contact this pilot
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
      <h2 className="mb-1 text-sm font-semibold text-sky-800">Have a plane that fits?</h2>
      {displayName && (
        <p className="mb-3 text-sm text-sky-700">Reach out to {displayName}</p>
      )}
      <div className="space-y-2">
        {canMessage && (
          <button
            onClick={handleMessage}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" />
            {isPending ? 'Opening…' : 'Send Message'}
          </button>
        )}
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
