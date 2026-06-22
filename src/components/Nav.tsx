'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Plane, Bookmark, Heart, MessageCircle, LogIn, LogOut, Menu, X, Shield, Calculator, Users, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import ProfileMenu, { Avatar } from '@/components/ProfileMenu'

// About lives in the footer (declutter the top nav per the human's nav-polish ask).
const links: { href: string; label: string; icon?: LucideIcon }[] = [
  { href: '/partnerships', label: 'Partnerships', icon: Users },
  { href: '/aircraft', label: 'Planes for Sale', icon: Plane },
  { href: '/tools', label: 'Tools', icon: Calculator },
  { href: '/guides', label: 'Guides', icon: BookOpen },
]

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <Plane className="h-5 w-5 text-sky-600" strokeWidth={2.5} />
            <span className="text-lg">ClubHanger</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/partnerships/new"
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
            >
              Post a Listing
            </Link>
            {user ? (
              <ProfileMenu user={user} isAdmin={isAdmin} onSignOut={handleSignOut} />
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile right: Post CTA + hamburger */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/partnerships/new"
              className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
            >
              Post
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-200 sm:hidden',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      {/* Mobile menu panel */}
      <div
        className={cn(
          'fixed inset-x-0 top-16 z-40 border-b border-slate-200 bg-white shadow-lg transition-all duration-200 sm:hidden',
          menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'
        )}
      >
        <nav className="mx-auto max-w-7xl divide-y divide-slate-100 px-4 pb-safe">
          {user && (
            <div className="flex items-center gap-2.5 py-4">
              <Avatar user={user} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">Signed in as</div>
                <div className="truncate text-sm font-semibold text-slate-900">{user.email}</div>
              </div>
            </div>
          )}
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 py-4 text-base font-medium transition-colors',
                pathname.startsWith(href) ? 'text-sky-700' : 'text-slate-700'
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {label}
            </Link>
          ))}
          {user && (
            <Link
              href="/messages"
              className={cn(
                'flex items-center gap-2 py-4 text-base font-medium transition-colors',
                pathname.startsWith('/messages') ? 'text-sky-700' : 'text-slate-700'
              )}
            >
              <MessageCircle className="h-4 w-4" />
              Messages
            </Link>
          )}
          {user && (
            <Link
              href="/searches"
              className={cn(
                'flex items-center gap-2 py-4 text-base font-medium transition-colors',
                pathname.startsWith('/searches') ? 'text-sky-700' : 'text-slate-700'
              )}
            >
              <Bookmark className="h-4 w-4" />
              My Searches
            </Link>
          )}
          {user && (
            <Link
              href="/saved"
              className={cn(
                'flex items-center gap-2 py-4 text-base font-medium transition-colors',
                pathname.startsWith('/saved') ? 'text-sky-700' : 'text-slate-700'
              )}
            >
              <Heart className="h-4 w-4" />
              Saved
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-2 py-4 text-base font-medium transition-colors',
                pathname.startsWith('/admin') ? 'text-amber-700' : 'text-slate-700'
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
          <div className="py-4">
            {user ? (
              <button
                onClick={() => { setMenuOpen(false); handleSignOut() }}
                className="flex items-center gap-2 text-base font-medium text-slate-700"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-2 text-base font-medium text-slate-700"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  )
}
