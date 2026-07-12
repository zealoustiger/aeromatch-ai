'use client'

import { useState } from 'react'
import { Bell, CheckCircle2 } from 'lucide-react'
import { subscribeManageCrossSell } from '@/app/actions'
import { track } from '@/lib/analytics'
import type { AlertCrossSellSuggestion } from '@/lib/alertCrossSell'

interface Props {
  /** unsubscribe_token this page is scoped to (token-based visitor); omitted for a
   *  signed-in session, where the action proves ownership via the session instead. */
  token?: string
  suggestion: AlertCrossSellSuggestion
}

/**
 * One-click "also want alerts for the counterpart?" box on /alerts/manage — the
 * digest → manage → grow loop (GOAL.md). Mirrors AlertCrossSell.tsx's UI/one-click
 * precedent but proves ownership the way every other manage-page action does
 * (session or the page's own token), not a status-page confirm_token.
 */
export default function ManageAlertCrossSell({ token, suggestion }: Props) {
  const [state, setState] = useState<'idle' | 'pending' | 'done' | 'dismissed' | 'error'>('idle')

  async function handleAccept() {
    if (state === 'pending') return
    setState('pending')
    const result = await subscribeManageCrossSell(suggestion.context, suggestion.sourcePath, token)
    if (result.error) {
      setState('error')
      return
    }
    track('alert_subscribed', {
      context: suggestion.context,
      source_path: suggestion.sourcePath,
      source: 'manage_cross_sell',
    })
    setState('done')
  }

  if (state === 'dismissed') return null

  return (
    <div className="mt-4 w-full rounded-lg border border-sky-100 bg-sky-50 px-4 py-4 text-left">
      {state === 'done' ? (
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <p className="text-sm font-medium text-slate-900">
            You&apos;re set for {suggestion.context} too.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <p className="text-sm font-medium text-slate-900">{suggestion.label}</p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleAccept}
              disabled={state === 'pending'}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
            >
              {state === 'pending' ? 'Saving…' : 'Yes, alert me'}
            </button>
            <button
              onClick={() => setState('dismissed')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              No thanks
            </button>
          </div>
          {state === 'error' && (
            <p className="mt-2 text-xs text-red-600">Something went wrong. Please try again.</p>
          )}
        </>
      )}
    </div>
  )
}
