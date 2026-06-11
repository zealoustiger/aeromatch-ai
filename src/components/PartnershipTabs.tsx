'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function PartnershipTabs({ active }: { active: 'available' | 'seeking' }) {
  return (
    <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
      <Link
        href="/partnerships"
        className={cn(
          'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
          active === 'available'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        Available Partnerships
      </Link>
      <Link
        href="/partnerships/seeking"
        className={cn(
          'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
          active === 'seeking'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        Pilots Seeking
      </Link>
    </div>
  )
}
