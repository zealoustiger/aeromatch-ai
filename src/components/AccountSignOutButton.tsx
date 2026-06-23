'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

/**
 * Standalone sign-out button for the /account page. Mirrors `Nav.handleSignOut`
 * exactly (browser supabase client → `signOut()` → home + refresh); kept tiny and
 * self-contained so the account page can stay a server component. Touches no
 * frozen auth file — it only *uses* the existing browser client.
 */
export default function AccountSignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
    >
      <LogOut className="h-4 w-4 text-slate-400" />
      Sign out
    </button>
  )
}
