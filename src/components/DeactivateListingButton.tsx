'use client'

import { useTransition } from 'react'
import { deactivateListing } from '@/app/actions'

type Props = {
  type: 'aircraft' | 'partnership' | 'seeker'
  id: string
  label: string
  confirmMessage: string
}

export default function DeactivateListingButton({ type, id, label, confirmMessage }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!window.confirm(confirmMessage)) return
    startTransition(async () => {
      await deactivateListing(type, id)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-slate-400 hover:text-red-600 disabled:opacity-50 transition-colors"
    >
      {isPending ? 'Closing…' : label}
    </button>
  )
}
