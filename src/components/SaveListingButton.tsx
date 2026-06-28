'use client'

import { useState, useEffect, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toggleSavedListing } from '@/app/actions'
import { cn } from '@/lib/utils'
import {
  isLocallySaved,
  addLocalSave,
  removeLocalSave,
  localSaveCount,
  LOCAL_SAVES_EVENT,
} from '@/lib/localSaves'
import SoftSavePrompt from './SoftSavePrompt'
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [saved, setSaved] = useState(initialSaved)
  const [promptOpen, setPromptOpen] = useState(false)
  const [deviceCount, setDeviceCount] = useState(0)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Reflect this device's soft-saves for logged-out visitors, and keep every
  // mounted heart in sync when any of them changes the local store.
  useEffect(() => {
    if (user) return
    const sync = () => {
      setSaved(isLocallySaved(listingId, listingType))
      setDeviceCount(localSaveCount())
    }
    sync()
    window.addEventListener(LOCAL_SAVES_EVENT, sync)
    return () => window.removeEventListener(LOCAL_SAVES_EVENT, sync)
  }, [user, listingId, listingType])

  const authNext = (() => {
    const qs = searchParams.toString()
    return qs ? `${pathname}?${qs}` : pathname
  })()

  function handleClick(e: React.MouseEvent) {
    // Cards wrap the listing in a Link; never navigate when hearting.
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      // Already device-saved → toggle off locally, no nag.
      if (isLocallySaved(listingId, listingType)) {
        removeLocalSave(listingId, listingType)
        return
      }
      // First save of this listing → push an account, but allow device fallback.
      setDeviceCount(localSaveCount())
      setPromptOpen(true)
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

  function handleSkipToDevice() {
    addLocalSave(listingId, listingType)
    setPromptOpen(false)
  }

  const label = saved ? 'Saved' : 'Save'
  const heart = (
    <Heart
      className={cn('h-4 w-4', saved && 'fill-sky-500 text-sky-600')}
      aria-hidden="true"
    />
  )

  const prompt = promptOpen ? (
    <SoftSavePrompt
      authNext={authNext}
      deviceSaveCount={deviceCount}
      onSkip={handleSkipToDevice}
      onCreateAccount={() => addLocalSave(listingId, listingType)}
      onClose={() => setPromptOpen(false)}
    />
  ) : null

  if (variant === 'full') {
    return (
      <>
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
        {prompt}
      </>
    )
  }

  return (
    <>
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
      {prompt}
    </>
  )
}
