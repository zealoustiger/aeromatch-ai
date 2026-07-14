'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, ListChecks, Inbox, ClipboardCheck, FlaskConical, Plane, Workflow, Target, MapPin, DollarSign, ShieldCheck, MessageSquare, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin', label: 'Daily Report', icon: FileText },
  { href: '/admin/goal', label: 'Goal & Allocation', icon: Target },
  { href: '/admin/how-it-works', label: 'How It Works', icon: Workflow },
  { href: '/admin/outreach', label: 'Outreach', icon: Plane },
  { href: '/admin/feedback', label: 'User Feedback', icon: MessageSquare },
  { href: '/admin/alerts', label: 'Alert Scoreboard', icon: Bell },
  { href: '/admin/backlog', label: 'Backlog', icon: ListChecks },
  { href: '/admin/review', label: 'Review Captures', icon: Inbox },
  { href: '/admin/listings', label: 'Review Listings', icon: ClipboardCheck },
  { href: '/admin/smoke', label: 'Smoke Tests', icon: FlaskConical },
  { href: '/admin/coverage', label: 'Bay Area Coverage', icon: MapPin },
  { href: '/admin/monetization', label: 'Revenue Signals', icon: DollarSign },
  { href: '/admin/pilots', label: 'Verify Pilots', icon: ShieldCheck },
]

export default function AdminTabs() {
  const pathname = usePathname()
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
