'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Heart, Bell, CheckCircle2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toggleSavedListing, subscribeSignedInAlert, getExistingAlertForSourcePath } from '@/app/actions'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
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
  listingType?: 'partnership' | 'aircraft' | 'seeker'
  initialSaved?: boolean
  /** `icon` = compact heart (cards); `full` = heart + label (detail page). */
  variant?: 'icon' | 'full'
  className?: string
  /** Human-readable thing being watched, e.g. "2019 Cessna 172" — same copy the
   *  page's own "Watch this listing" `AlertSignup` box uses. When omitted (or
   *  `watchSourcePath` is omitted), no save→watch cross-sell is offered — used to
   *  scope this to detail pages that have a real single-listing watch target
   *  (aircraft-for-sale + partnership; seeker profiles have no price to watch). */
  watchContext?: string
  /** The listing's own `?watch=price` source_path, e.g.
   *  `/aircraft/listing/<id>?watch=price` — passed straight into
   *  `subscribeSignedInAlert` on a one-tap click. */
  watchSourcePath?: string
}

export default function SaveListingButton({
  listingId,
  listingType = 'partnership',
  initialSaved = false,
  variant = 'icon',
  className,
  watchContext,
  watchSourcePath,
}: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [saved, setSaved] = useState(initialSaved)
  const [promptOpen, setPromptOpen] = useState(false)
  const [deviceCount, setDeviceCount] = useState(0)
  const [isPending, startTransition] = useTransition()
  // Save→watch cross-sell — the heart is the highest-intent moment on the site
  // with no alert offer today. Only ever triggered by a fresh, signed-in save
  // (never on unsave, never for logged-out/device-only saves), and only when the
  // caller passed a real watch target. 'hidden' covers both "never triggered" and
  // "checked, already watching" (no redundant offer).
  const [crossSell, setCrossSell] = useState<'hidden' | 'offer' | 'subscribing' | 'done'>('hidden')
  const [crossSellError, setCrossSellError] = useState('')

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

  // One-shot impression so this placement's view→subscribe conversion is
  // computable in the /admin/alerts funnel, matching every other watch-offer
  // surface (ContactBarWatchButton, MobileStickyAlertBar, SavedListingWatchButton).
  const crossSellViewedRef = useRef(false)
  useEffect(() => {
    if (crossSell !== 'offer' || crossSellViewedRef.current) return
    crossSellViewedRef.current = true
    track('alert_capture_viewed', {
      context: watchContext || undefined,
      source_path: watchSourcePath,
      source: 'save_cross_sell',
    })
  }, [crossSell, watchContext, watchSourcePath])

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
        // Fresh save (not an unsave) on a listing with a real watch target →
        // check whether they're already watching before offering (no redundant
        // ask). Fire-and-forget; never blocks the save itself.
        if (!previous && result.saved && watchSourcePath) {
          getExistingAlertForSourcePath(watchSourcePath).then((existing) => {
            if (!existing) setCrossSell('offer')
          })
        }
      }
    })
  }

  async function handleWatchSubscribe() {
    if (!watchSourcePath || crossSell === 'subscribing') return
    track('alert_capture_opened', {
      context: watchContext || undefined,
      source_path: watchSourcePath,
      source: 'save_cross_sell',
    })
    setCrossSellError('')
    setCrossSell('subscribing')
    const result = await subscribeSignedInAlert(watchContext ?? '', watchSourcePath, true, 'weekly', 'save_cross_sell')
    if (result.error) {
      setCrossSellError(result.error)
      setCrossSell('offer')
      return
    }
    track('alert_subscribed', {
      context: watchContext || undefined,
      source_path: watchSourcePath,
      source: 'save_cross_sell',
      signed_in: true,
    })
    markAlertSubscriber()
    setCrossSell('done')
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

  const watchCrossSell =
    crossSell === 'hidden' ? null : (
      <div className="absolute right-0 top-full z-10 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-sky-100 bg-white p-3 text-left shadow-lg">
        <button
          type="button"
          onClick={() => setCrossSell('hidden')}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {crossSell === 'done' ? (
          <div className="flex items-start gap-2 pr-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <p className="text-xs text-slate-600">
              You&rsquo;re set — we&rsquo;ll email you if the price drops.
            </p>
          </div>
        ) : (
          <div className="pr-4">
            <div className="flex items-start gap-2">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              <p className="text-xs font-medium text-slate-800">Saved! Alert me if the price drops?</p>
            </div>
            <button
              type="button"
              onClick={handleWatchSubscribe}
              disabled={crossSell === 'subscribing'}
              className="mt-2 w-full rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
            >
              {crossSell === 'subscribing' ? 'Saving…' : 'Yes, alert me'}
            </button>
            {crossSellError && <p className="mt-1.5 text-[11px] text-red-600">{crossSellError}</p>}
          </div>
        )}
      </div>
    )

  if (variant === 'full') {
    return (
      <div className="relative inline-block">
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
        {watchCrossSell}
      </div>
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
