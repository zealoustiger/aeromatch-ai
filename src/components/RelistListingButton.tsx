'use client'

import { useTransition } from 'react'
import { relistListing } from '@/app/actions'

type Props = {
  type: 'aircraft' | 'partnership' | 'seeker'
  id: string
}

export default function RelistListingButton({ type, id }: Props) {
  const [isPending, startTransition] = useTransition()

  const typeLabel = type === 'aircraft' ? 'aircraft listing' : type === 'partnership' ? 'partnership' : 'seeking listing'

  function handleClick() {
    if (!window.confirm(`Relist this ${typeLabel}? It will become active and visible to buyers again.`)) return
    startTransition(async () => {
      await relistListing(type, id)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
    >
      {isPending ? 'Relisting…' : 'Relist'}
    </button>
  )
}
