'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Bookmark, Heart, MessageCircle, LogOut, Shield } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

// Deterministic avatar (initial + background) for users without a photo. Picks a
// stable warm/sky tone from the email so the same person always reads the same.
const AVATAR_BG = [
  'bg-sky-600',
  'bg-amber-600',
  'bg-emerald-600',
  'bg-rose-500',
  'bg-violet-600',
  'bg-teal-600',
]

function avatarFor(user: User): { initial: string; bg: string; label: string } {
  const email = user.email ?? ''
  const local = email.split('@')[0] ?? ''
  const initial = (local[0] ?? '?').toUpperCase()
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) | 0
  const bg = AVATAR_BG[Math.abs(hash) % AVATAR_BG.length]
  return { initial, bg, label: email || 'Account' }
}

function Avatar({ user, size = 'md' }: { user: User; size?: 'md' | 'sm' }) {
  const { initial, bg } = avatarFor(user)
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        bg,
        size === 'md' ? 'h-8 w-8 text-sm' : 'h-9 w-9 text-base'
      )}
    >
      {initial}
    </span>
  )
}

type MenuItem = { href: string; label: string; icon: LucideIcon }

export default function ProfileMenu({
  user,
  isAdmin,
  onSignOut,
}: {
  user: User
  isAdmin: boolean
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { label } = avatarFor(user)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items: MenuItem[] = [
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/saved', label: 'Saved', icon: Heart },
    { href: '/searches', label: 'My Searches', icon: Bookmark },
  ]
  if (isAdmin) items.push({ href: '/admin', label: 'Admin', icon: Shield })

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center rounded-full ring-1 ring-slate-200 transition-shadow hover:ring-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <Avatar user={user} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="flex items-center gap-2.5 px-3 py-3">
            <Avatar user={user} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Signed in as</div>
              <div className="truncate text-sm font-semibold text-slate-900">{label}</div>
            </div>
          </div>
          <div className="my-1 border-t border-slate-100" />
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Icon className="h-4 w-4 text-slate-400" />
              {label}
            </Link>
          ))}
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export { Avatar }
