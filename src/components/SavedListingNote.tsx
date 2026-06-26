'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Pencil, Check, X, StickyNote, Plus } from 'lucide-react'
import { updateSavedNote } from '@/app/actions'

/**
 * Optional free-text note on a saved listing, shown beneath each card on `/saved`.
 * Empty → a quiet "Add a note" affordance; click opens an inline textarea with
 * Save/Cancel (⌘/Ctrl+Enter saves, Escape cancels). A populated note renders as
 * text with a pencil to edit; clearing the textarea and saving removes the note.
 * Owner-scoped server-side; the value persists on the per-user saved row.
 */
export default function SavedListingNote({
  savedRowId,
  note,
}: {
  savedRowId: string
  note: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(note ?? '')
  // Optimistic local copy so the row updates immediately; revalidatePath in the
  // action also brings the persisted value on the next render.
  const [displayNote, setDisplayNote] = useState(note ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
  }, [editing])

  function open() {
    setValue(displayNote)
    setError('')
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setError('')
  }

  function save() {
    if (isPending) return
    const trimmed = value.trim()
    if (trimmed === displayNote) {
      setEditing(false)
      return
    }
    startTransition(async () => {
      const result = await updateSavedNote(savedRowId, trimmed)
      if (result.error) {
        setError(result.error)
      } else {
        setDisplayNote(trimmed)
        setEditing(false)
        setError('')
      }
    })
  }

  if (!editing) {
    if (!displayNote) {
      return (
        <button
          onClick={open}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600"
        >
          <Plus className="h-3.5 w-3.5" />
          Add a note
        </button>
      )
    }
    return (
      <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2">
        <StickyNote className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" aria-hidden="true" />
        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm text-slate-700">
          {displayNote}
        </p>
        <button
          onClick={open}
          title="Edit note"
          aria-label="Edit note"
          className="flex-shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-amber-100 hover:text-amber-700"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <textarea
        ref={textareaRef}
        value={value}
        maxLength={1000}
        rows={3}
        disabled={isPending}
        placeholder="e.g. great panel — ask about damage history"
        onChange={(e) => {
          setValue(e.target.value)
          if (error) setError('')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            save()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
        className="w-full rounded-lg border border-sky-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
      <div className="mt-1.5 flex items-center gap-2">
        <button
          onClick={save}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          Save
        </button>
        <button
          onClick={cancel}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
        {displayNote && (
          <span className="text-xs text-slate-400">Clear the text and save to remove.</span>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  )
}
