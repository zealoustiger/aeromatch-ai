import { getAdminDoc } from '@/lib/adminDocs'
import AdminMarkdown from '@/components/AdminMarkdown'

export const metadata = { title: 'Goal & allocation', robots: { index: false } }
export const dynamic = 'force-dynamic'

// Renders nightshift/GOAL.md (synced to admin_content) — the current north-star goal and
// the strict priority cascade (bug → human task → AI goal). Authoritative & auto-updating:
// change GOAL.md and this reflects it after the next sync. Project-specific per dashboard.
export default async function GoalTab() {
  const doc = await getAdminDoc('goal')
  const updated = doc?.updated_at
    ? new Date(doc.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-semibold text-slate-900">Goal &amp; allocation policy</h2>
        <span className="text-xs text-slate-400">updated {updated}</span>
      </div>
      {doc?.content ? (
        <AdminMarkdown markdown={doc.content} />
      ) : (
        <p className="text-sm text-slate-500">
          Not synced yet — runs with the morning digest (7:15am). Source: <code>nightshift/GOAL.md</code>.
        </p>
      )}
    </section>
  )
}
