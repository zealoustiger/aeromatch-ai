import { getAdminDoc } from '@/lib/adminDocs'
import AdminMarkdown from '@/components/AdminMarkdown'

export const metadata = { title: 'How the loop works', robots: { index: false } }
export const dynamic = 'force-dynamic'

// Renders nightshift/HOW_IT_WORKS.md (synced to admin_content by sync-admin-docs.mjs) —
// the step-by-step of one build cycle, including the backlog check-off step. Project-
// specific: each project's dashboard shows its own synced doc.
export default async function HowItWorksTab() {
  const doc = await getAdminDoc('how_it_works')
  const updated = doc?.updated_at
    ? new Date(doc.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-semibold text-slate-900">How the build loop works</h2>
        <span className="text-xs text-slate-400">updated {updated}</span>
      </div>
      {doc?.content ? (
        <AdminMarkdown markdown={doc.content} />
      ) : (
        <p className="text-sm text-slate-500">
          Not synced yet — runs with the morning digest (7:15am). Source: <code>nightshift/HOW_IT_WORKS.md</code>.
        </p>
      )}
    </section>
  )
}
