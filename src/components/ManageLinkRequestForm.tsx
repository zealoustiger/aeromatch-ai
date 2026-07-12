'use client'

import { useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { requestAlertsManageLink } from '@/app/actions'

/**
 * Self-serve "email me my manage link" form for the signed-out `/alerts/manage`
 * state — a subscriber with no account whose original digest/confirm email (the
 * only place a manage token has ever appeared) is gone otherwise has no path
 * back in. Always shows the same neutral success copy regardless of whether the
 * email actually has alerts, matching `requestAlertsManageLink`'s no-enumeration
 * contract.
 */
export default function ManageLinkRequestForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'pending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setState('pending')
    const result = await requestAlertsManageLink(email)
    if (result.error) {
      setErrorMsg(result.error)
      setState('error')
      return
    }
    setState('sent')
  }

  if (state === 'sent') {
    return (
      <p className="mt-4 text-sm text-emerald-700">
        If that email has alerts with us, we&rsquo;ve just sent a link to manage them — check
        your inbox.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row" noValidate>
      <label htmlFor="manage-link-email" className="sr-only">
        Email address
      </label>
      <input
        id="manage-link-email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (state === 'error') setState('idle')
        }}
        placeholder="your@email.com"
        autoComplete="email"
        className="w-full flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
      <button
        type="submit"
        disabled={state === 'pending'}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
      >
        <Mail className="h-4 w-4" />
        {state === 'pending' ? 'Sending…' : 'Email me my manage link'}
      </button>
      {state === 'error' && <p className="text-xs text-red-600 sm:w-full">{errorMsg}</p>}
    </form>
  )
}
