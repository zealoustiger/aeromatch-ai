'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquarePlus, X, Check } from 'lucide-react'
import { submitFeedback } from '@/app/actions'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

type FeedbackType = 'feedback' | 'issue' | 'request' | 'report'

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: 'feedback', label: 'General feedback' },
  { value: 'issue', label: 'Report a problem' },
  { value: 'request', label: 'Feature request' },
]

export function FeedbackForm({
  type: fixedType,
  listingId,
  onDone,
}: {
  type?: FeedbackType
  listingId?: string
  onDone?: () => void
}) {
  const pathname = usePathname()
  const [type, setType] = useState<FeedbackType>(fixedType ?? 'feedback')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const result = await submitFeedback({
      type,
      message,
      email: email || undefined,
      listingId,
      pagePath: pathname,
    })
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('sent')
      track('feedback_submitted', { type, has_email: !!email, listing_id: listingId })
      setTimeout(() => onDone?.(), 1500)
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex items-center gap-2 py-6 text-sm font-medium text-emerald-600">
        <Check className="h-5 w-5" /> Thanks — we read every submission.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!fixedType && (
        <div className="flex gap-1.5">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                type === opt.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          fixedType === 'report'
            ? 'What’s wrong with this listing? (spam, sold, not a partnership, wrong info…)'
            : 'What’s on your mind?'
        }
        rows={4}
        required
        className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional — if you’d like a reply)"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
      {status === 'error' && <p className="text-xs text-red-600">{errorMsg}</p>}
      <button
        type="submit"
        disabled={status === 'sending' || message.trim().length < 3}
        className="w-full rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-40"
      >
        {status === 'sending' ? 'Sending…' : 'Send'}
      </button>
    </form>
  )
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-4 w-4" />
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 p-5 sm:items-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Send us feedback</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FeedbackForm onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
