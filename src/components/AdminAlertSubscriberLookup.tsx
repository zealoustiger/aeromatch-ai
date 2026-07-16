'use client'

import { useState, useTransition } from 'react'
import { Search, Send } from 'lucide-react'
import { adminLookupAlertsByEmail, adminSendManageLink } from '@/app/admin/alerts/actions'
import type { AdminAlertRow } from '@/lib/alertsForOwner'

export default function AdminAlertSubscriberLookup() {
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<AdminAlertRow[] | null>(null)
  const [searchedEmail, setSearchedEmail] = useState<string | null>(null)
  const [linkStatus, setLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLinkStatus('idle')
    const query = email
    startTransition(async () => {
      const result = await adminLookupAlertsByEmail(query)
      if ('error' in result) {
        setError(result.error)
        setRows(null)
        setSearchedEmail(null)
      } else {
        setRows(result.rows)
        setSearchedEmail(query.toLowerCase().trim())
      }
    })
  }

  function handleSendLink() {
    if (!searchedEmail) return
    setLinkStatus('sending')
    startTransition(async () => {
      const result = await adminSendManageLink(searchedEmail)
      setLinkStatus('error' in result ? 'error' : 'sent')
    })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Subscriber lookup</h2>
      <p className="mb-4 text-sm text-slate-500">
        Look up a subscriber&apos;s alerts by email — for when someone replies &quot;I can&apos;t
        find my manage link&quot; or &quot;why did I get this?&quot;
      </p>

      <form onSubmit={handleLookup} className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="subscriber@example.com"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={isPending || !email.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          <Search className="h-3.5 w-3.5" />
          Look up
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {rows !== null && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400">No alerts found for that email.</p>
          ) : (
            <>
              <div className="space-y-2">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{row.context ?? 'Untitled alert'}</span>
                    <span className="text-slate-500">
                      {row.status}
                      {row.frequency ? ` · ${row.frequency}` : ''}
                      {row.source ? ` · ${row.source}` : ''}
                      {row.last_digest_at
                        ? ` · last sent ${new Date(row.last_digest_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}`
                        : ' · never sent'}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSendLink}
                disabled={isPending || linkStatus === 'sending'}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {linkStatus === 'sent' ? 'Sent!' : 'Email them their manage link'}
              </button>
              {linkStatus === 'error' ? (
                <p className="mt-2 text-xs text-red-600">Couldn&apos;t send — try again.</p>
              ) : null}
            </>
          )}
        </div>
      )}
    </section>
  )
}
