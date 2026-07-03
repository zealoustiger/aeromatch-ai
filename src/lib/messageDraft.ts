// A single pending "message a seller" draft, persisted across the sign-in redirect
// so a logged-out visitor's typed message actually gets sent once they return
// instead of vanishing at the /auth wall. One draft at a time (keyed by listing) is
// enough — there's no multi-tab composing scenario worth the complexity here.
//
// SSR-safe: every accessor guards on `typeof window` so it can be imported by
// client components without exploding during server render / prerender.

const STORAGE_KEY = 'ch_pending_message'

interface PendingMessage {
  key: string
  body: string
}

function hasWindow(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function getMessageDraft(key: string): string | null {
  if (!hasWindow()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingMessage
    if (!parsed || parsed.key !== key || typeof parsed.body !== 'string') return null
    return parsed.body
  } catch {
    return null
  }
}

export function setMessageDraft(key: string, body: string): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, body } satisfies PendingMessage))
  } catch {
    /* quota / disabled storage — the draft just won't survive the redirect */
  }
}

export function clearMessageDraft(key: string): void {
  if (!hasWindow()) return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as PendingMessage
    if (parsed && parsed.key === key) window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
