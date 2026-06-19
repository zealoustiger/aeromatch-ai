'use client'

import { useState, useEffect, useTransition } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toggleSavedListing } from '@/app/actions'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface Props {
  listingId: string
  listingType?: 'partnership' | 'aircraft'
  initialSaved?: boolean
  /** `icon` = compact heart (cards); `full` = heart + label (detail page). */
  variant?: 'icon' | 'full'
  className?: string
}

export default function SaveListingButton({
  listingId,
  listingType = 'partnership',
  initialSaved = false,
  variant = 'icon',
  className,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  function handleClick(e: React.MouseEvent) {
    // Cards wrap the listing in a Link; never navigate when hearting.
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      const qs = searchParams.toString()
      const next = qs ? `${pathname}?${qs}` : pathname
      router.push(`/auth?next=${encodeURIComponent(next)}`)
      return
    }

    const previous = saved
    setSaved(!previous) // optimistic
    startTransition(async () => {
      const result = await toggleSavedListing(listingId, listingType)
      if (result.error || typeof result.saved !== 'boolean') {
        setSaved(previous) // revert on failure
      } else {
        setSaved(result.saved)
      }
    })
  }

  const label = saved ? 'Saved' : 'Save'
  const heart = (
    <Heart
      className={cn('h-4 w-4', saved && 'fill-sky-500 text-sky-600')}
      aria-hidden="true"
    />
  )

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved listings' : 'Save this listing'}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60',
          saved
            ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
            : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-sky-700',
          className,
        )}
      >
        {heart}
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved listings' : 'Save this listing'}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm transition-colors hover:text-sky-700 disabled:opacity-60',
        saved && 'text-sky-600',
        className,
      )}
    >
      {heart}
    </button>
  )
}
