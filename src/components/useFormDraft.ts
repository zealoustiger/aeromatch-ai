'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Autosave a long, uncontrolled form to localStorage so users don't fear losing
 * progress. Snapshots the form's named text/number/select/textarea fields
 * (debounced) as the user types, restores them on mount, and reports a save
 * `status` for a "Saving… / Saved" indicator.
 *
 * Deliberately DOM-driven (reads/writes element values) rather than controlled
 * state, so it can be dropped onto an existing uncontrolled `<form action>`
 * without rewiring every field. Written reusably for the other "Post a…" forms.
 *
 * Submit handling note: React resets an uncontrolled `<form action>` after the
 * action resolves. So we snapshot + clear the draft on submit, and on a failed
 * submit we restore the snapshot back into the (now-reset) fields — the user
 * loses nothing, and a successful submit (which navigates away) leaves no draft.
 */
export type DraftStatus = 'idle' | 'saving' | 'saved' | 'restored'

const DEBOUNCE_MS = 600

type DraftField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function isDraftable(el: Element): el is DraftField {
  if (el instanceof HTMLInputElement) {
    return !['file', 'password', 'submit', 'button', 'reset', 'hidden', 'checkbox', 'radio'].includes(el.type)
  }
  return el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement
}

function readForm(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {}
  for (const el of Array.from(form.elements)) {
    if (!isDraftable(el) || !el.name) continue
    if (el.value !== '') out[el.name] = el.value
  }
  return out
}

function writeForm(form: HTMLFormElement, data: Record<string, string>) {
  for (const el of Array.from(form.elements)) {
    if (!isDraftable(el) || !el.name) continue
    if (Object.prototype.hasOwnProperty.call(data, el.name)) {
      el.value = data[el.name]
    }
  }
}

export function useFormDraft(storageKey: string) {
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<DraftStatus>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapshot = useRef<Record<string, string> | null>(null)

  const writeStore = useCallback(
    (data: Record<string, string>) => {
      try {
        if (Object.keys(data).length) {
          window.localStorage.setItem(storageKey, JSON.stringify(data))
        } else {
          window.localStorage.removeItem(storageKey)
        }
      } catch {
        /* storage unavailable/full — autosave just no-ops, form still works */
      }
    },
    [storageKey]
  )

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
  }, [storageKey])

  // Restore any saved draft on mount, then autosave (debounced) on input.
  useEffect(() => {
    const form = formRef.current
    if (!form) return

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const data = JSON.parse(raw) as Record<string, string>
        if (data && typeof data === 'object' && Object.keys(data).length) {
          writeForm(form, data)
          setStatus('restored')
        }
      }
    } catch {
      /* corrupt/unavailable storage — start clean */
    }

    const save = () => {
      writeStore(readForm(form))
      setStatus('saved')
    }

    const onInput = () => {
      setStatus('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(save, DEBOUNCE_MS)
    }

    form.addEventListener('input', onInput)
    form.addEventListener('change', onInput)
    return () => {
      form.removeEventListener('input', onInput)
      form.removeEventListener('change', onInput)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [storageKey, writeStore])

  // Call from the form's onSubmit: snapshot current values and drop the saved
  // draft. A successful submit navigates away (leaving no stale draft); a failed
  // one is recovered by handleResult below.
  const handleSubmit = useCallback(() => {
    const form = formRef.current
    if (form) snapshot.current = readForm(form)
    if (timer.current) clearTimeout(timer.current)
    clear()
  }, [clear])

  // Call from a "Start over" control: empty the form, drop the saved draft, and
  // return to the idle state. Uses the native form.reset() (restores fields to
  // their HTML defaults — e.g. prefilled contact name/email stay) and clears
  // storage; reset doesn't fire input/change, so autosave won't re-arm.
  const reset = useCallback(() => {
    const form = formRef.current
    if (timer.current) clearTimeout(timer.current)
    snapshot.current = null
    clear()
    if (form) form.reset()
    setStatus('idle')
  }, [clear])

  // Call once the server action result is known. On success: discard the
  // snapshot. On failure: React has reset the uncontrolled form, so restore the
  // pre-submit values and re-arm the draft so nothing is lost.
  const handleResult = useCallback(
    (ok: boolean) => {
      if (ok) {
        snapshot.current = null
        clear()
        return
      }
      const form = formRef.current
      const snap = snapshot.current
      if (form && snap) {
        writeForm(form, snap)
        writeStore(snap)
        setStatus('saved')
      }
    },
    [clear, writeStore]
  )

  return { formRef, status, handleSubmit, handleResult, reset }
}
