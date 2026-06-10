'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteSavedSearch } from '@/app/actions'

export default function DeleteSearchButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteSavedSearch(id)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Delete this search"
      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
