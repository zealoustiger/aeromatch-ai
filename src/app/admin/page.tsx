import { getAdminDoc } from '@/lib/adminDocs'
import AdminMarkdown from '@/components/AdminMarkdown'
import ReportFeedback from '@/components/ReportFeedback'
import VisitorAnalytics from '@/components/VisitorAnalytics'
import { createAdminClient } from '@/lib/supabase-admin'

export const metadata = { title: 'Daily Report', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function DailyReportTab() {
  const report = await getAdminDoc('daily_report')
  const updated = report?.updated_at
    ? new Date(report.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  const admin = createAdminClient()
  const { data: feedback } = await admin
    .from('report_feedback')
    .select('created_at, body, response, status')
    .order('created_at', { ascending: false })
    .limit(50)

  const stagingUrl = process.env.NEXT_PUBLIC_STAGING_URL || ''

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-semibold text-slate-900">Daily Report</h2>
          <div className="flex items-center gap-3">
            <a
              href="https://juno.zealoustiger.com/?agent=forge"
              target="_blank"
              rel="noopener noreferrer"
              title="Build-loop health, token usage & alerts (Forge · CTO)"
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-100"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Engineering health ↗
            </a>
            <span className="text-xs text-slate-400">updated {updated}</span>
          </div>
        </div>
        {report?.content ? (
          <AdminMarkdown markdown={report.content} />
        ) : (
          <p className="text-sm text-slate-500">No report yet — the overnight digest runs at 7am.</p>
        )}
      </section>

      <VisitorAnalytics />

      <ReportFeedback entries={feedback ?? []} stagingUrl={stagingUrl} />
    </>
  )
}
