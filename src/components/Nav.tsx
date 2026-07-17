'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Plane, Bookmark, Heart, MessageCircle, LogIn, LogOut, Menu, X, Shield, Calculator, Users, BookOpen, Settings, Bell, PlusCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import ProfileMenu, { Avatar } from '@/components/ProfileMenu'
import type { AviatorConfig } from '@/components/AviatorAvatar'
import { localSaveCount, LOCAL_SAVES_EVENT } from '@/lib/localSaves'
import { isAlertSubscriber, ALERT_SUBSCRIBER_EVENT } from '@/lib/alertSubscriberFlag'
import { getLocalSourcePaths, readAndStampVisit } from '@/lib/alertLocalSubscriptions'
import { getNewAlertMatchesSinceForPaths } from '@/app/actions'

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

// The `threads` read-tracking columns (last_message_at/last_message_sender_id/
// inquirer_read_at/owner_read_at) are additive columns already declared in
// schema.sql but not yet applied to the live Supabase DB. Cache the result for
// this browser tab so a not-yet-migrated DB fails the query at most once per
// session instead of on every route change — self-heals to the full query on
// the next page load once the migration is applied, no code change needed.
let threadsReadTrackingAvailable: boolean | null = null

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [avatarConfig, setAvatarConfig] = useState<AviatorConfig | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [deviceSaveCount, setDeviceSaveCount] = useState(0)
  // Whether this browser belongs to a known alert subscriber (per-browser
  // localStorage hint, boolean only — see lib/alertSubscriberFlag.ts). When true,
  // the primary "Get alerts" capture CTA becomes "My alerts" → /alerts/manage.
  const [alertSubscriber, setAlertSubscriber] = useState(false)
  // Honest "N new since your last visit" count for a known subscriber's own
  // locally-subscribed searches — null renders no badge (unknown/first visit/0).
  const [newAlertCount, setNewAlertCount] = useState<number | null>(null)

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

  // Preserve the current page across the sign-in round trip so a logged-out
  // visitor returns to where they were instead of the auth page's own default
  // (`/searches`) — including the homepage itself, which must pass `next=/`
  // explicitly rather than omit the param. The href below is a pathname-only
  // SSR / no-JS / new-tab fallback (no useSearchParams — that would force this
  // layout-level nav, and thus every page, into client rendering).
  const signInHref = `/auth?next=${encodeURIComponent(pathname || '/')}`

  // On a plain left-click, upgrade the fallback href to the FULL current URL —
  // including active query-string filters — read straight from window.location at
  // click time. This keeps a logged-out shopper's filters across auth without
  // pulling useSearchParams into the layout (which would change its render mode).
  // Modified clicks (new tab, etc.) fall through to the native pathname-only href.
  function handleSignInClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    setMenuOpen(false)
    const full = window.location.pathname + window.location.search
    router.push(`/auth?next=${encodeURIComponent(full || '/')}`)
  }

  useEffect(() => {
    const supabase = createClient()
    // Load the user's chosen aviator config so the nav matches their /account pick
    // (the component falls back to a seeded default when none is set).
    async function loadAvatar(u: User | null) {
      if (!u) { setAvatarConfig(null); return }
      const { data } = await supabase.from('profiles').select('avatar_config').eq('user_id', u.id).maybeSingle()
      setAvatarConfig((data?.avatar_config ?? null) as AviatorConfig | null)
    }
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); loadAvatar(data.user) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      loadAvatar(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch unread message count whenever the user or route changes.
  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    if (threadsReadTrackingAvailable === false) { setUnreadCount(0); return }
    const supabase = createClient()
    supabase
      .from('threads')
      .select('inquirer_id, owner_id, last_message_at, last_message_sender_id, inquirer_read_at, owner_read_at')
      .not('last_message_sender_id', 'is', null)
      .then(({ data, error }) => {
        if (error) {
          threadsReadTrackingAvailable = false
          setUnreadCount(0)
          return
        }
        threadsReadTrackingAvailable = true
        const count = (data ?? []).filter((t) => {
          if (t.last_message_sender_id === user.id) return false
          const readAt = t.inquirer_id === user.id ? t.inquirer_read_at : t.owner_read_at
          if (!readAt) return true
          return new Date(readAt) < new Date(t.last_message_at!)
        }).length
        setUnreadCount(count)
      })
  }, [user, pathname])

  // Give logged-out visitors who've soft-saved a listing (device-only, no account
  // yet) a way back to /saved — otherwise the save is undiscoverable once the
  // SoftSavePrompt closes. Mirrors the same getLocalSaves/LOCAL_SAVES_EVENT pattern
  // SaveListingButton already uses to stay in sync without a page reload.
  useEffect(() => {
    if (user) return
    const sync = () => setDeviceSaveCount(localSaveCount())
    sync()
    window.addEventListener(LOCAL_SAVES_EVENT, sync)
    return () => window.removeEventListener(LOCAL_SAVES_EVENT, sync)
  }, [user])

  // Read the per-browser subscriber flag after mount (localStorage is client-only,
  // so the first render always shows the default "Get alerts" and never mismatches
  // the server HTML). Re-read on same-tab changes (a fresh subscribe fires
  // ALERT_SUBSCRIBER_EVENT) and cross-tab changes (the native `storage` event).
  useEffect(() => {
    const sync = () => setAlertSubscriber(isAlertSubscriber())
    sync()
    window.addEventListener(ALERT_SUBSCRIBER_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ALERT_SUBSCRIBER_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Once we know this browser is a known subscriber, compare against its last
  // visit (read BEFORE re-stamping) for an honest "N new" delta on its own
  // locally-subscribed searches — then re-stamp so the NEXT visit's delta starts
  // from now. A first-ever "known subscriber" visit has no prior stamp, so it
  // just seeds one with no count (never counts "since forever" as new).
  useEffect(() => {
    if (!alertSubscriber) { setNewAlertCount(null); return }
    const lastVisitAt = readAndStampVisit()
    if (!lastVisitAt) return
    const paths = getLocalSourcePaths()
    if (paths.length === 0) return
    let cancelled = false
    getNewAlertMatchesSinceForPaths(paths, lastVisitAt).then((count) => {
      if (!cancelled) setNewAlertCount(count)
    })
    return () => { cancelled = true }
  }, [alertSubscriber])

  // Returning subscribers get a one-click path to manage; everyone else keeps the
  // capture CTA. `/alerts/manage` still proves ownership itself — this is just the label.
  const alertsHref = alertSubscriber ? '/alerts/manage' : '/alerts'
  const newAlertSuffix = alertSubscriber && newAlertCount ? ` · ${newAlertCount} new` : ''
  const alertsLabel = (alertSubscriber ? 'My alerts' : 'Get alerts') + newAlertSuffix
  const alertsLabelMobile = (alertSubscriber ? 'My alerts' : 'Alerts') + newAlertSuffix

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

          {/* Desktop right actions.
              Primary CTA is "Get alerts" (demand capture) — most visitors are buyers,
              not sellers, so we lead with the thing they want. Posting stays one click
              away as a muted secondary link. */}
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/post"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Post a listing
            </Link>
            <Link
              href={alertsHref}
              className="flex items-center gap-1.5 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
            >
              <Bell className="h-3.5 w-3.5" />
              {alertsLabel}
            </Link>
            {user ? (
              <ProfileMenu user={user} isAdmin={isAdmin} onSignOut={handleSignOut} avatarConfig={avatarConfig} unreadCount={unreadCount} />
            ) : (
              <>
                {deviceSaveCount > 0 && (
                  <Link
                    href="/saved"
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      pathname.startsWith('/saved')
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <Heart className="h-3.5 w-3.5" />
                    Saved
                  </Link>
                )}
                <Link
                  href={signInHref}
                  onClick={handleSignInClick}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Mobile right: Alerts CTA + hamburger (posting lives in the menu) */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href={alertsHref}
              className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
            >
              <Bell className="h-3.5 w-3.5" />
              {alertsLabelMobile}
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
              <Avatar user={user} size="sm" config={avatarConfig} />
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
          <Link
            href={alertsHref}
            className={cn(
              'flex items-center gap-2 py-4 text-base font-medium transition-colors',
              pathname.startsWith('/alerts') ? 'text-sky-700' : 'text-slate-700'
            )}
          >
            <Bell className="h-4 w-4" />
            {alertsLabel}
          </Link>
          <Link
            href="/post"
            className={cn(
              'flex items-center gap-2 py-4 text-base font-medium transition-colors',
              pathname.startsWith('/post') ? 'text-sky-700' : 'text-slate-700'
            )}
          >
            <PlusCircle className="h-4 w-4" />
            Post a listing
          </Link>
          {user && (
            <Link
              href="/account"
              className={cn(
                'flex items-center gap-2 py-4 text-base font-medium transition-colors',
                pathname.startsWith('/account') ? 'text-sky-700' : 'text-slate-700'
              )}
            >
              <Settings className="h-4 w-4" />
              Account
            </Link>
          )}
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
              {unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
          {user && (
            <Link
              href="/listings"
              className={cn(
                'flex items-center gap-2 py-4 text-base font-medium transition-colors',
                pathname.startsWith('/listings') ? 'text-sky-700' : 'text-slate-700'
              )}
            >
              <Plane className="h-4 w-4" />
              My Listings
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
          {(user || deviceSaveCount > 0) && (
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
                href={signInHref}
                onClick={handleSignInClick}
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
