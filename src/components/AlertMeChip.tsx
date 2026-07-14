'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { subscribeSignedInAlert, getExistingAlertForSourcePath } from '@/app/actions'
import { track } from '@/lib/analytics'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'
import { isLocallySubscribed } from '@/lib/alertLocalSubscriptions'
import { createClient } from '@/lib/supabase'

interface Props {
  /** Human-readable phrase describing the active filters, e.g. "Cessna 172 in
   *  California" — same value already threaded into the page's footer `AlertSignup`. */
  context?: string
  /** Reproducible source path for the active filter set, e.g. "/aircraft?make=Cessna". */
  sourcePath: string
}

/**
 * One-tap "🔔 Alert me for this search" chip for the active-filter toolbar
 * (GOAL.md: one-tap alerts "from any active filter set"). Signed-in visitors
 * subscribe in a single click via the existing `subscribeSignedInAlert`; signed-out
 * visitors are scrolled to the page's existing email-capture `AlertSignup` (same
 * `context`/`sourcePath`) with the email field focused — no separate subscribe path,
 * just a shortcut to the one that already exists below the results.
 */
export default function AlertMeChip({ context, sourcePath }: Props) {
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [hasExistingAlert, setHasExistingAlert] = useState(false)
  const [locallySubscribed, setLocallySubscribed] = useState(false)
  const [justSubscribed, setJustSubscribed] = useState(false)
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setLocallySubscribed(isLocallySubscribed(sourcePath))
  }, [sourcePath])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setSignedInEmail(data.user?.email ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSignedInEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!signedInEmail) {
      setHasExistingAlert(false)
      return
    }
    let cancelled = false
    getExistingAlertForSourcePath(sourcePath).then((detail) => {
      if (!cancelled) setHasExistingAlert(!!detail)
    })
    return () => {
      cancelled = true
    }
  }, [signedInEmail, sourcePath])

  const alreadyOn = hasExistingAlert || locallySubscribed || justSubscribed

  async function handleClick() {
    if (pending || alreadyOn) return
    if (!signedInEmail) {
      const el = document.getElementById('alert-email')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.focus()
      }
      return
    }
    setErrorMsg('')
    setPending(true)
    const result = await subscribeSignedInAlert(context ?? '', sourcePath)
    setPending(false)
    if (result.error) {
      setErrorMsg(result.error)
      return
    }
    track('alert_subscribed', {
      context: context || 'all',
      source_path: sourcePath,
      source: 'filter_toolbar',
      signed_in: true,
    })
    markAlertSubscriber()
    setJustSubscribed(true)
  }

  if (alreadyOn) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 py-1.5 pl-3 pr-3.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Alerts on
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={errorMsg || undefined}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-600 py-1.5 pl-3 pr-3.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
      {pending ? 'Saving…' : errorMsg ? 'Try again' : 'Alert me for this search'}
    </button>
  )
}
