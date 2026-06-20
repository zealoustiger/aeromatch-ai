'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Rocket, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { submitReportFeedback, promoteToProduction } from '@/app/admin/feedback-actions'

type FeedbackEntry = {
  created_at: string
  body: string
  response: string | null
  status: string
}

export default function ReportFeedback({
  entries,
  stagingUrl,
}: {
  entries: FeedbackEntry[]
  stagingUrl: string
}) {
  const [submitted, setSubmitted] = useState(false)
  const [promo, setPromo] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function onPromote() {
    if (!confirm('Promote ALL current staging changes to production now? Vercel will deploy main to prod.')) return
    setPromo(null)
    startTransition(async () => setPromo(await promoteToProduction()))
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MessageSquare className="h-5 w-5 text-sky-500" /> Your feedback on this report
        </h2>
        {stagingUrl && (
          <a
            href={stagingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Review on staging <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Reactions, notes, what to prioritize or kill. Claude turns these into backlog items for tonight.
      </p>

      <form
        action={async (fd) => {
          await submitReportFeedback(fd)
          setSubmitted(true)
        }}
      >
        <textarea
          name="feedback"
          required
          rows={4}
          placeholder="e.g. Love the new model pages. The calculators feel cramped on mobile — fix that first. Kill the ad slots idea for now."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          onChange={() => setSubmitted(false)}
        />
        <button
          type="submit"
          className="mt-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Submit feedback
        </button>
      </form>

      {submitted && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle className="h-4 w-4" /> Saved. Claude will turn it into backlog items.
        </p>
      )}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Ship it</h3>
        <p className="mb-3 text-sm text-slate-500">
          Promote everything on <code className="rounded bg-slate-100 px-1 text-xs">staging</code> to production.
        </p>
        <button
          onClick={onPromote}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          <Rocket className="h-4 w-4" /> {pending ? 'Promoting…' : 'Promote to production'}
        </button>
        {promo && (
          <p className={`mt-3 flex items-start gap-1.5 text-sm ${promo.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {promo.ok ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            {promo.message}
          </p>
        )}
      </div>

      {entries.length > 0 && (
        <details className="mt-6 border-t border-slate-100 pt-4" open>
          <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
            Feedback log ({entries.length})
          </summary>
          <ul className="mt-3 space-y-3">
            {entries.map((e, i) => (
              <li key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                  <span>{new Date(e.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      e.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {e.status === 'processed' ? 'processed' : 'new'}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-slate-800">{e.body}</p>
                {e.response && (
                  <p className="mt-2 border-l-2 border-sky-200 pl-2 text-slate-600">
                    <span className="font-medium text-sky-700">Claude:</span> {e.response}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
