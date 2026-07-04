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
export type DraftData = Record<string, string | string[]>

const DEBOUNCE_MS = 600

type DraftField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function isDraftable(el: Element): el is DraftField {
  if (el instanceof HTMLInputElement) {
    return !['file', 'password', 'submit', 'button', 'reset', 'hidden'].includes(el.type)
  }
  return el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement
}

// Checkboxes/radios are captured as an array of checked values per input `name`
// (supporting multi-box groups like a "Preferred Share Type" chip set), instead
// of being excluded — an excluded checkbox group used to silently vanish across
// a draft restore (e.g. after the sign-in-and-return redirect).
export function readForm(form: HTMLFormElement): DraftData {
  const out: DraftData = {}
  for (const el of Array.from(form.elements)) {
    if (!isDraftable(el) || !el.name) continue
    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
      if (!el.checked) continue
      const existing = out[el.name]
      out[el.name] = existing ? [...(Array.isArray(existing) ? existing : [existing]), el.value] : [el.value]
      continue
    }
    if (el.value !== '') out[el.name] = el.value
  }
  return out
}

function writeForm(form: HTMLFormElement, data: DraftData) {
  const changedCheckboxes: HTMLInputElement[] = []
  for (const el of Array.from(form.elements)) {
    if (!isDraftable(el) || !el.name) continue
    if (!Object.prototype.hasOwnProperty.call(data, el.name)) continue
    const value = data[el.name]
    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
      const checked = Array.isArray(value) ? value.includes(el.value) : value === el.value
      if (checked !== el.checked) {
        el.checked = checked
        changedCheckboxes.push(el)
      }
      continue
    }
    el.value = Array.isArray(value) ? (value[0] ?? '') : value
  }
  // Restoring a checked box silently (no native `change` event) would leave any
  // form-level sync logic (e.g. a hidden-input mirror) stale — dispatch one bubbling
  // `change` so listeners re-derive from the now-restored checked state.
  changedCheckboxes[changedCheckboxes.length - 1]?.dispatchEvent(new Event('change', { bubbles: true }))
}

export function useFormDraft(storageKey: string) {
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<DraftStatus>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapshot = useRef<DraftData | null>(null)

  const writeStore = useCallback(
    (data: DraftData) => {
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
        const data = JSON.parse(raw) as DraftData
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
