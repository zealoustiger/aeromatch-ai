'use client'

import { useState, useTransition } from 'react'
import { Bell, CheckCircle2, Loader2, BellOff } from 'lucide-react'
import { subscribeSavedSearchAlert, pauseAlert } from '@/app/actions'
import { track } from '@/lib/analytics'
import type { AlertFrequency } from '@/lib/alertFrequency'
import FrequencyToggle from '@/components/FrequencyToggle'
import PriceDropToggle from '@/components/PriceDropToggle'

interface AlertDetail {
  id: string
  frequency: AlertFrequency
  priceDropOptIn: boolean
}

interface Props {
  searchId: string
  /** The confirmed alert already linked to this search, if any. */
  alert: AlertDetail | null
  /** Gates the price-drop toggle — that matching only exists for aircraft alerts. */
  isAircraft: boolean
}

/** One-click "turn this saved search into a real email alert" (see /searches), plus,
 *  once subscribed, the same inline frequency/price-drop/turn-off controls
 *  `/alerts/manage` offers — so a subscriber doesn't have to leave this page to
 *  see or change them. */
export default function SavedSearchAlertButton({ searchId, alert: initialAlert, isAircraft }: Props) {
  const [alert, setAlert] = useState(initialAlert)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const [isTurningOff, startTurnOff] = useTransition()

  async function handleSubscribe() {
    if (pending || alert) return
    setPending(true)
    setError(false)
    const result = await subscribeSavedSearchAlert(searchId)
    setPending(false)
    if (result.error) {
      setError(true)
      return
    }
    track('alert_subscribed', {
      context: result.context || undefined,
      source_path: result.sourcePath,
      source: 'saved_search',
    })
    if (result.alertId) {
      setAlert({
        id: result.alertId,
        frequency: result.frequency ?? 'weekly',
        priceDropOptIn: result.priceDropOptIn ?? true,
      })
    }
  }

  function handleTurnOff() {
    if (!alert) return
    startTurnOff(async () => {
      const result = await pauseAlert(alert.id)
      if (!result.error) setAlert(null)
    })
  }

  if (alert) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Alerts on
        </span>
        {isAircraft ? <PriceDropToggle id={alert.id} enabled={alert.priceDropOptIn} /> : null}
        <FrequencyToggle id={alert.id} frequency={alert.frequency} />
        <button
          onClick={handleTurnOff}
          disabled={isTurningOff}
          title="Turn off alerts for this search (the search itself stays saved)"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          <BellOff className="h-3.5 w-3.5" />
          Turn off alerts
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={pending}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
      {pending ? 'Turning on…' : error ? 'Try again' : 'Get email alerts'}
    </button>
  )
}
