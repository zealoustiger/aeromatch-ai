import { getAdminDoc } from '@/lib/adminDocs'
import AdminMarkdown from '@/components/AdminMarkdown'

export const metadata = { title: 'Daily Report', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function DailyReportTab() {
  const report = await getAdminDoc('daily_report')
  const updated = report?.updated_at
    ? new Date(report.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-semibold text-slate-900">Daily Report</h2>
        <span className="text-xs text-slate-400">updated {updated}</span>
      </div>
      {report?.content ? (
        <AdminMarkdown markdown={report.content} />
      ) : (
        <p className="text-sm text-slate-500">No report yet — the overnight digest runs at 7am.</p>
      )}
    </section>
  )
}
