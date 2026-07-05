/**
 * Handoff from the `/post` chooser's paste box to whichever "Post a…" form we guess
 * matches the pasted text. Read-once via sessionStorage: the target form consumes
 * (and clears) the entry on mount, so navigating back to `/post` and forward again
 * doesn't replay a stale paste.
 */

export type PostTarget = 'aircraft' | 'partnership' | 'seeker'

export const POST_TARGET_HREF: Record<PostTarget, string> = {
  aircraft: '/aircraft/new',
  partnership: '/partnerships/new',
  seeker: '/partnerships/seeking/new',
}

const STORAGE_KEY = 'ch:post-handoff'

const SEEKER_PATTERN =
  /\b(looking (for a (share|partnership)|to join|to buy into)|seeking a partnership|want to (join|buy into)|in the market for a (share|partnership)|pilot seeking|new to (flying|ownership|aircraft ownership))\b/i

const PARTNERSHIP_PATTERN =
  /\b(\d\s*\/\s*\d\s*(share|interest)?|quarter share|half share|third share|co-?owners?|co-?ownership|partnership(s)? available|share(s)? available|selling (a |my )?share|buy[- ]?in)\b/i

/** Keyword heuristic — no AI call, kept simple and reviewable. Defaults to the most
 * common case (an outright aircraft-for-sale listing) when nothing else matches. */
export function classifyPostText(raw: string): PostTarget {
  const text = raw.trim()
  const isBareUrl = /^https?:\/\/\S+$/i.test(text)
  // The seeker form has no URL-fetch path — a pasted link is never a seeker post.
  if (!isBareUrl && SEEKER_PATTERN.test(text)) return 'seeker'
  if (PARTNERSHIP_PATTERN.test(text)) return 'partnership'
  return 'aircraft'
}

export function stashPostHandoff(text: string) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, text)
  } catch {
    /* storage unavailable — the form just won't be pre-filled, no crash */
  }
}

/** Read-once: returns the stashed text (if any) and immediately clears it. */
export function consumePostHandoff(): string | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    if (value) window.sessionStorage.removeItem(STORAGE_KEY)
    return value
  } catch {
    return null
  }
}
