'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getOrCreateThread } from '@/app/actions'
import { track } from '@/lib/analytics'
import type { User } from '@supabase/supabase-js'

/**
 * In-site "Message {name}" button for a partnership listing. Mirrors the messaging
 * path the mobile ContactBar uses (auth-gate → getOrCreateThread → /messages/{id}),
 * but as a standalone primary button for the desktop contact card. Used for the
 * concierge-owned seed personas so a visitor messages them on-site (the inquiry
 * reaches the operator) rather than emailing a dead demo address.
 */
export default function MessageOwnerButton({
  listingId,
  posterId,
  label,
  returnPath,
}: {
  listingId: string
  posterId: string | null
  /** Button text, e.g. "Message Marcus". */
  label: string
  /** Where to send the user back after auth (the listing they're on). */
  returnPath: string
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isPending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // The owner can't message their own listing (mirrors the server guard).
  const isOwner = !!user && user.id === posterId

  function handleMessage() {
    if (!posterId) return
    setErr(null)
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(returnPath)}`)
      return
    }
    startTransition(async () => {
      track('contact_initiated', { listing_id: listingId, method: 'message' })
      const result = await getOrCreateThread(listingId, posterId)
      if ('threadId' in result) router.push(`/messages/${result.threadId}`)
      else setErr(result.error ?? 'Could not start the conversation.')
    })
  }

  if (isOwner) return null

  return (
    <div>
      <button
        onClick={handleMessage}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
      >
        <MessageCircle className="h-4 w-4" />
        {isPending ? 'Opening…' : label}
      </button>
      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
      <p className="mt-2 text-center text-xs text-slate-400">
        Replies arrive in your ClubHanger inbox.
      </p>
    </div>
  )
}
