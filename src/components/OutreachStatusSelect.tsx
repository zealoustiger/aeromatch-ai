'use client'

import { useTransition } from 'react'
import { updateTargetStatus } from '@/app/admin/outreach-actions'

const OPTIONS: { value: string; label: string }[] = [
  { value: 'not_contacted', label: 'Not contacted' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'joined', label: 'Joined' },
  { value: 'dead', label: 'Dead' },
]

const STYLE: Record<string, string> = {
  not_contacted: 'bg-slate-50 text-slate-600 ring-slate-200',
  contacted: 'bg-sky-50 text-sky-700 ring-sky-200',
  replied: 'bg-amber-50 text-amber-700 ring-amber-200',
  meeting: 'bg-violet-50 text-violet-700 ring-violet-200',
  joined: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  dead: 'bg-rose-50 text-rose-700 ring-rose-200',
}

/** Inline status dropdown that submits to the server action on change. */
export default function OutreachStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const fd = new FormData()
    fd.set('id', id)
    fd.set('status', e.target.value)
    startTransition(() => updateTargetStatus(fd))
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={pending}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-colors disabled:opacity-50 ${
        STYLE[status] ?? STYLE.not_contacted
      }`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
