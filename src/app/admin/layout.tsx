import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import { getAdminEmail } from '@/lib/admin-auth'
import AdminTabs from '@/components/AdminTabs'

export const metadata = { title: 'Admin', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await getAdminEmail()

  if (!email) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Admin only</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with an authorized account to view the admin area.
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <LayoutDashboard className="h-6 w-6 text-sky-500" /> Admin
        </h1>
        <span className="text-xs text-slate-400">{email}</span>
      </div>
      <AdminTabs />
      {children}
    </div>
  )
}
