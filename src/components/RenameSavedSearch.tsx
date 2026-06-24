'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { renameSavedSearch } from '@/app/actions'

/**
 * Inline rename for a saved search on `/searches` (slice 2 of one-click save —
 * slice 1 auto-names on save, so users need a way to personalize/fix it here).
 * Shows the name with a pencil affordance; clicking opens an inline input with
 * Save/Cancel. Enter saves, Escape cancels. A duplicate-name collision surfaces a
 * friendly inline message rather than crashing. Owner-scoped server-side.
 */
export default function RenameSavedSearch({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  // Optimistic local name so the row updates immediately; revalidatePath in the
  // action also brings the persisted value on the next render.
  const [displayName, setDisplayName] = useState(name)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function open() {
    setValue(displayName)
    setError('')
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setError('')
  }

  function save() {
    const trimmed = value.trim()
    if (!trimmed || isPending) return
    if (trimmed === displayName) {
      setEditing(false)
      return
    }
    startTransition(async () => {
      const result = await renameSavedSearch(id, trimmed)
      if (result.error) {
        setError(result.error)
      } else {
        setDisplayName(trimmed)
        setEditing(false)
        setError('')
      }
    })
  }

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="font-semibold text-slate-900">{displayName}</span>
        <button
          onClick={open}
          title="Rename this search"
          aria-label="Rename this search"
          className="rounded p-1 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </span>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <input
        ref={inputRef}
        type="text"
        value={value}
        maxLength={120}
        disabled={isPending}
        onChange={(e) => {
          setValue(e.target.value)
          if (error) setError('')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
        className="min-w-0 max-w-full rounded-md border border-sky-300 px-2 py-1 text-sm font-semibold text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
      <button
        onClick={save}
        disabled={isPending || !value.trim()}
        title="Save name"
        aria-label="Save name"
        className="rounded p-1 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={cancel}
        disabled={isPending}
        title="Cancel"
        aria-label="Cancel rename"
        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
      >
        <X className="h-4 w-4" />
      </button>
      {error && <span className="w-full text-xs text-red-600">{error}</span>}
    </span>
  )
}
