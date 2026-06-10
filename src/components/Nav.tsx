'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Plane, Bookmark, LogIn, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const links = [
  { href: '/partnerships', label: 'Partnerships' },
  { href: '/about', label: 'About' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <Plane className="h-5 w-5 text-sky-600" strokeWidth={2.5} />
          <span className="text-lg">AeroMatch</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              {label}
            </Link>
          ))}
          {user && (
            <Link
              href="/searches"
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith('/searches')
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Bookmark className="h-3.5 w-3.5" />
              My Searches
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </Link>
          )}
          <Link
            href="/partnerships/new"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            Post a Listing
          </Link>
        </div>
      </div>
    </header>
  )
}
