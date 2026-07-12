import Link from 'next/link'
import { Mail, MessageSquare, AlertTriangle, Sparkles, Flag } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'

export const metadata = { title: 'User Feedback', robots: { index: false } }
export const dynamic = 'force-dynamic'

type FeedbackRow = {
  id: string
  created_at: string
  type: string
  message: string
  email: string | null
  listing_id: string | null
  page_path: string | null
  status: string | null
}

const TYPE_META: Record<string, { label: string; icon: typeof MessageSquare; cls: string }> = {
  feedback: { label: 'General feedback', icon: MessageSquare, cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  issue: { label: 'Reported problem', icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  request: { label: 'Feature request', icon: Sparkles, cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  report: { label: 'Listing report', icon: Flag, cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

// Admin gate is enforced by src/app/admin/layout.tsx.
export default async function FeedbackInboxPage() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (data ?? []) as FeedbackRow[]

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">User feedback</h2>
        <p className="mt-1 text-sm text-slate-500">
          {rows.length} submission{rows.length === 1 ? '' : 's'} from the site's feedback widget
          (bottom-right on every page).
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-rose-600">Couldn&apos;t load feedback: {error.message}</p>
      )}

      {rows.length === 0 && !error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No feedback submitted yet.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const meta = TYPE_META[r.type] ?? TYPE_META.feedback
            const Icon = meta.icon
            return (
              <article key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${meta.cls}`}
                  >
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                  <time className="text-xs text-slate-400" dateTime={r.created_at}>
                    {new Date(r.created_at).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </time>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                  {r.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {r.email && (
                    <a
                      href={`mailto:${r.email}`}
                      className="inline-flex items-center gap-1 font-medium text-sky-600 hover:text-sky-700 hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" /> {r.email}
                    </a>
                  )}
                  {r.page_path && (
                    <Link
                      href={r.page_path}
                      target="_blank"
                      className="font-mono text-slate-500 hover:text-sky-600 hover:underline"
                    >
                      {r.page_path}
                    </Link>
                  )}
                  {r.listing_id && (
                    <Link
                      href={`/aircraft/listing/${r.listing_id}`}
                      target="_blank"
                      className="text-slate-500 hover:text-sky-600 hover:underline"
                    >
                      View listing ↗
                    </Link>
                  )}
                  {!r.email && (
                    <span className="italic text-slate-300">no email left</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
