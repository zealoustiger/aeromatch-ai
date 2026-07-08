'use client'

import { useState } from 'react'
import { CheckCircle, Sparkles, X } from 'lucide-react'
import { joinWaitlist } from '@/app/actions'
import { track } from '@/lib/analytics'

interface Props {
  /** Revenue-path id this CTA is testing demand for, e.g. "broker". */
  path: string
  /** Button label, e.g. "Work with a broker". */
  label: string
  /** Modal heading. */
  title: string
  /** Modal body copy. */
  description: string
  className?: string
}

/**
 * Honest "fake-door" CTA — measures demand for a possible future revenue path
 * without pretending the service exists. Opening the modal fires a
 * `monetization_intent` event (the real signal); the email field is an
 * optional bonus so an interested pilot can be notified when it ships.
 */
export default function MonetizationIntent({ path, label, title, description, className }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function openModal() {
    setOpen(true)
    track('monetization_intent', { path })
  }

  function closeModal() {
    setOpen(false)
    setStatus('idle')
    setEmail('')
    setErrorMsg('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setErrorMsg('')
    setStatus('submitting')
    const result = await joinWaitlist(email, '', path)
    if (result.error) {
      setErrorMsg(result.error)
      setStatus('idle')
      return
    }
    setStatus('success')
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          className ??
          'inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50'
        }
      >
        <Sparkles className="h-4 w-4" />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            {status === 'success' ? (
              <div className="py-4 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-900">You're on the list.</h2>
                <p className="mt-2 text-slate-500">We'll email you when this is ready.</p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                  <Sparkles className="h-6 w-6 text-sky-600" />
                </div>

                <h2 className="text-xl font-bold text-slate-900">Coming soon — want early access?</h2>
                <p className="mt-2 text-slate-500">{description}</p>

                <form onSubmit={handleSubmit} className="mt-6">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                  {errorMsg && <p className="mt-1.5 text-xs text-red-600">{errorMsg}</p>}
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="mt-3 w-full rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
                  >
                    {status === 'submitting' ? 'Saving…' : 'Get early access'}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={closeModal}
                    className="text-sm font-medium text-slate-500 hover:text-sky-600 hover:underline"
                  >
                    Maybe later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
