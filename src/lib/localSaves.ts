// Device-only "soft save" store for logged-out visitors.
//
// Slice 1 of the soft-save feature: a logged-out heart-tap can save a listing to
// this browser's localStorage instead of forcing an account. The notice shown to
// the user is honest — these are NOT synced and may be lost. Slice 2 will merge
// these into the user's account on signup.
//
// SSR-safe: every accessor guards on `typeof window` so it can be imported by
// client components without exploding during server render / prerender.

export type LocalSaveType = 'partnership' | 'aircraft'

export interface LocalSave {
  id: string
  type: LocalSaveType
}

const STORAGE_KEY = 'ch_local_saves'
/** Fired on the window whenever the local-save set changes, so every mounted
 *  heart on the page can re-read its state without prop-drilling. */
export const LOCAL_SAVES_EVENT = 'ch:local-saves-changed'

function hasWindow(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function getLocalSaves(): LocalSave[] {
  if (!hasWindow()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (s): s is LocalSave =>
        s && typeof s.id === 'string' && (s.type === 'partnership' || s.type === 'aircraft'),
    )
  } catch {
    return []
  }
}

export function localSaveCount(): number {
  return getLocalSaves().length
}

export function isLocallySaved(id: string, type: LocalSaveType): boolean {
  return getLocalSaves().some((s) => s.id === id && s.type === type)
}

function write(saves: LocalSave[]): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
    window.dispatchEvent(new Event(LOCAL_SAVES_EVENT))
  } catch {
    /* quota / disabled storage — fail soft, the heart just won't persist */
  }
}

export function addLocalSave(id: string, type: LocalSaveType): void {
  const saves = getLocalSaves()
  if (saves.some((s) => s.id === id && s.type === type)) return
  write([...saves, { id, type }])
}

export function removeLocalSave(id: string, type: LocalSaveType): void {
  const saves = getLocalSaves()
  const next = saves.filter((s) => !(s.id === id && s.type === type))
  if (next.length !== saves.length) write(next)
}

/** Wipe every device-only save. Used by slice 2 after the set has been merged
 *  into the signed-in user's real account, so it isn't merged again. */
export function clearLocalSaves(): void {
  if (!hasWindow()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event(LOCAL_SAVES_EVENT))
  } catch {
    /* disabled storage — fail soft */
  }
}
