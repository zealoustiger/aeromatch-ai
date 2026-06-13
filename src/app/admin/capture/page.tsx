import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import CaptureClient from '@/components/CaptureClient'

export const metadata = { title: 'Capture', robots: { index: false } }
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export default async function CapturePage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email?.toLowerCase()
  const allowed = email && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email))

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Sign in to capture</h1>
        <p className="mt-2 text-sm text-slate-500">
          You need to be signed in as an admin. Sign in, then click the bookmarklet again.
        </p>
        <Link
          href="/auth?next=/admin/review"
          className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return <CaptureClient />
}
