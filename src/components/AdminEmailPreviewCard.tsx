'use client'

import { useTransition, useState } from 'react'
import { Send } from 'lucide-react'
import { adminSendEmailPreview } from '@/app/admin/alerts/emails/actions'

type Built = { subject: string; html: string; text: string }
type Entry = { name: string; purpose: string; dataNote: string; built: Built }

export default function AdminEmailPreviewCard({ entry }: { entry: Entry }) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')

  function handleSend() {
    setStatus('idle')
    startTransition(async () => {
      const result = await adminSendEmailPreview({
        name: entry.name,
        subject: entry.built.subject,
        html: entry.built.html,
        text: entry.built.text,
      })
      setStatus(result.ok ? 'sent' : 'error')
    })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-mono text-sm font-semibold text-slate-900">{entry.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{entry.purpose}</p>
          <p className="mt-1 text-xs text-slate-400">{entry.dataNote}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            onClick={handleSend}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {isPending ? 'Sending…' : status === 'sent' ? 'Sent!' : 'Send to my inbox'}
          </button>
          {status === 'error' ? (
            <p className="text-xs text-red-600">Couldn&apos;t send — try again.</p>
          ) : null}
        </div>
      </div>
      <p className="mb-2 text-sm">
        <span className="font-medium text-slate-700">Subject:</span>{' '}
        <span className="text-slate-600">{entry.built.subject}</span>
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <iframe
          title={`${entry.name} HTML preview`}
          srcDoc={entry.built.html}
          sandbox=""
          className="h-[420px] w-full rounded-lg border border-slate-200"
        />
        <pre className="h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {entry.built.text}
        </pre>
      </div>
    </section>
  )
}
