import Link from 'next/link'
import { Handshake, UserSearch } from 'lucide-react'
import type { ComponentType } from 'react'

export type PostType = 'partnership' | 'seeking'

// The posting flows that actually exist today. A third "post a plane for sale"
// flow is on the backlog but has no page yet — adding it here would 404, so it's
// deliberately omitted until that route ships.
const TABS: {
  key: PostType
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}[] = [
  { key: 'partnership', label: 'Post a partnership', href: '/partnerships/new', icon: Handshake },
  { key: 'seeking', label: 'Seeking a partnership', href: '/partnerships/seeking/new', icon: UserSearch },
]

/**
 * Segmented toggle that lets a user switch between the "Post a…" flows from the
 * top of either posting page. Pure server component — each page passes the
 * `active` flow; the active tab is highlighted and carries `aria-current`, the
 * other is a real internal <Link> to its sibling page.
 */
export default function PostTypeTabs({ active }: { active: PostType }) {
  return (
    <nav
      aria-label="What do you want to post?"
      className="mb-6 inline-flex w-full max-w-md gap-1 rounded-full border border-[var(--ch-border)] bg-white p-1 shadow-sm sm:w-auto"
    >
      {TABS.map((t) => {
        const isActive = t.key === active
        const Icon = t.icon
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-center text-sm font-semibold leading-tight transition-colors sm:px-4',
              isActive
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700',
            ].join(' ')}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
