import Link from 'next/link'
import { marked } from 'marked'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { LayoutDashboard, FileText, ListChecks, Inbox } from 'lucide-react'

export const metadata = { title: 'Admin', robots: { index: false } }
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

type Doc = { title: string; content: string; updated_at: string }

async function getDoc(key: string): Promise<Doc | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('admin_content')
    .select('title, content, updated_at')
    .eq('key', key)
    .maybeSingle()
  return data
}

function Md({ markdown }: { markdown: string }) {
  // Content is authored by us (the nightshift loop + repo files), so it's trusted.
  const html = marked.parse(markdown, { async: false }) as string
  return <div className="admin-md" dangerouslySetInnerHTML={{ __html: html }} />
}

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email?.toLowerCase()
  const allowed = email && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email))

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Admin only</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with an authorized account to view the admin dashboard.
        </p>
        <Link
          href="/auth?next=/admin"
          className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const [report, backlog] = await Promise.all([getDoc('daily_report'), getDoc('backlog')])
  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <LayoutDashboard className="h-6 w-6 text-sky-500" /> Admin
        </h1>
        <Link
          href="/admin/review"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Inbox className="h-4 w-4" /> Review captures
        </Link>
      </div>

      {/* Daily report */}
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <FileText className="h-5 w-5 text-emerald-500" /> Daily Report
          </h2>
          <span className="text-xs text-slate-400">updated {fmt(report?.updated_at)}</span>
        </div>
        {report?.content ? (
          <Md markdown={report.content} />
        ) : (
          <p className="text-sm text-slate-500">No report yet — the overnight digest runs at 7am.</p>
        )}
      </section>

      {/* Backlog */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ListChecks className="h-5 w-5 text-sky-500" /> Feature Backlog
          </h2>
          <span className="text-xs text-slate-400">updated {fmt(backlog?.updated_at)}</span>
        </div>
        {backlog?.content ? (
          <Md markdown={backlog.content} />
        ) : (
          <p className="text-sm text-slate-500">No backlog synced yet.</p>
        )}
      </section>
    </div>
  )
}
