'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Rocket, CheckCircle, AlertTriangle } from 'lucide-react'
import { submitReportFeedback, promoteToProduction } from '@/app/admin/feedback-actions'

export default function ReportFeedback({ log }: { log: string }) {
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
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <MessageSquare className="h-5 w-5 text-sky-500" /> Your feedback on this report
      </h2>
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
          <CheckCircle className="h-4 w-4" /> Saved to the feedback log. Claude will turn it into backlog items.
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

      {log.trim() && (
        <details className="mt-6 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
            Feedback log
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            {log}
          </pre>
        </details>
      )}
    </section>
  )
}
