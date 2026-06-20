import { getAdminDoc } from '@/lib/adminDocs'
import AdminMarkdown from '@/components/AdminMarkdown'

export const metadata = { title: 'Backlog', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function BacklogTab() {
  const backlog = await getAdminDoc('backlog')
  const updated = backlog?.updated_at
    ? new Date(backlog.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-semibold text-slate-900">Feature Backlog</h2>
        <span className="text-xs text-slate-400">updated {updated}</span>
      </div>
      {backlog?.content ? (
        <AdminMarkdown markdown={backlog.content} />
      ) : (
        <p className="text-sm text-slate-500">No backlog synced yet.</p>
      )}
    </section>
  )
}
