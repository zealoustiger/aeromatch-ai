'use client'

import { useState, useTransition } from 'react'
import { RefreshCw, Send } from 'lucide-react'
import { adminReplayAlertDigest } from '@/app/admin/alerts/emails/actions'
import type { ReplayableAlert } from '@/lib/alertDigestReplay'

type Replay = Awaited<ReturnType<typeof adminReplayAlertDigest>>
type Ok = Extract<Replay, { ok: true }>

function alertLabel(a: ReplayableAlert): string {
  const what = a.context && a.context !== 'saved search' ? a.context : a.sourcePath
  return `${a.email} — ${what}`
}

/**
 * Live replay of the alert digest `/api/cron/alert-digest` sends. "Preview"
 * re-renders it in the iframe; "Send to my inbox" mails the identical message
 * to the signed-in admin so it can be checked in a real client (dark mode,
 * image proxying, Gmail clipping). Neither path ever emails the subscriber,
 * and neither advances their digest cursor.
 */
export default function AdminAlertDigestReplay({
  alerts,
  initial,
}: {
  alerts: ReplayableAlert[]
  initial: Ok | null
}) {
  // Default the picker to whichever alert the server already rendered below,
  // so the dropdown and the preview never disagree on first paint.
  const [alertId, setAlertId] = useState<string>(initial?.alertId ?? alerts[0]?.id ?? '')
  const [result, setResult] = useState<Ok | null>(initial)
  const [error, setError] = useState<string | null>(null)
  const [justSent, setJustSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  function run(send: boolean) {
    setError(null)
    setJustSent(false)
    startTransition(async () => {
      const res = await adminReplayAlertDigest({ alertId: alertId || undefined, send })
      if (!res.ok) {
        setError(res.reason)
        return
      }
      setResult(res)
      setJustSent(res.sent)
    })
  }

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50/40 p-6 shadow-sm">
      <div className="mb-4 border-b border-sky-100 pb-4">
        <h3 className="text-sm font-semibold text-slate-900">Alert digest — live replay</h3>
        <p className="mt-1 text-sm text-slate-600">
          The email <code className="rounded bg-white px-1 py-0.5 text-xs">/api/cron/alert-digest</code> sends, rebuilt
          from real listings through the cron&rsquo;s own sample fetchers and template. Sends only to your own admin
          inbox and never advances the subscriber&rsquo;s digest cursor.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={alertId}
          onChange={(e) => setAlertId(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          {alerts.length === 0 ? <option value="">No replayable alerts</option> : null}
          {alerts.map((a) => (
            <option key={a.id} value={a.id}>
              {alertLabel(a)}
            </option>
          ))}
        </select>
        <button
          onClick={() => run(false)}
          disabled={isPending || alerts.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
          Preview
        </button>
        <button
          onClick={() => run(true)}
          disabled={isPending || alerts.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {isPending ? 'Working…' : justSent ? 'Sent!' : 'Send to my inbox'}
        </button>
      </div>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {result ? (
        <>
          <p className="mb-1 text-sm">
            <span className="font-medium text-slate-700">Subject:</span>{' '}
            <span className="text-slate-600">{result.subject}</span>
          </p>
          <p className="mb-3 text-xs text-slate-500">
            <span
              className={`mr-2 inline-block rounded px-1.5 py-0.5 font-medium ${
                result.window === 'since-last-digest'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {result.window === 'since-last-digest' ? 'Real send window' : 'Fallback — not new'}
            </span>
            {result.alertEmail} &middot; <code>{result.sourcePath}</code> &middot; {result.note}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <iframe
              title="Alert digest replay preview"
              srcDoc={result.html}
              sandbox=""
              className="h-[520px] w-full rounded-lg border border-slate-200 bg-white"
            />
            <pre className="h-[520px] overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
              {result.text}
            </pre>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Pick an alert and hit Preview.</p>
      )}
    </section>
  )
}
