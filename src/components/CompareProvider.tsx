'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Client-side selection state for the partnership "Compare" feature (SLICE 1).
 *
 * Holds the ids of the listings the user has selected to compare. State lives in
 * React + is mirrored to `sessionStorage` so it survives a page navigation
 * (e.g. opening a listing then coming back) without any DB / schema change, and
 * clears when the tab closes. Capped at MAX_COMPARE.
 */

export const MAX_COMPARE = 3
const STORAGE_KEY = 'clubhanger:compare:partnership'

export interface CompareItem {
  id: string
  label: string
}

interface CompareContextValue {
  items: CompareItem[]
  ids: string[]
  isSelected: (id: string) => boolean
  /** Toggle an id; returns false if the add was blocked (already at the cap). */
  toggle: (id: string, label?: string) => boolean
  remove: (id: string) => void
  clear: () => void
  count: number
  isFull: boolean
  /** True once mounted on the client — guards against SSR/hydration mismatch. */
  ready: boolean
}

const CompareContext = createContext<CompareContextValue | null>(null)

function readStored(): CompareItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (x): x is CompareItem =>
          !!x && typeof x.id === 'string' && typeof x.label === 'string'
      )
      .slice(0, MAX_COMPARE)
  } catch {
    return []
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  // Start empty so server + first client render match; hydrate from storage
  // after mount (avoids a hydration mismatch on the toggles / tray).
  const [items, setItems] = useState<CompareItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setItems(readStored())
    setReady(true)
  }, [])

  // Persist + keep other tabs/components in sync.
  useEffect(() => {
    if (!ready) return
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // sessionStorage unavailable (private mode etc.) — keep in-memory state.
    }
  }, [items, ready])

  const ids = useMemo(() => items.map((it) => it.id), [items])
  const isSelected = useCallback((id: string) => items.some((it) => it.id === id), [items])

  const toggle = useCallback((id: string, label = 'Listing'): boolean => {
    let added = true
    setItems((prev) => {
      if (prev.some((it) => it.id === id)) {
        added = true
        return prev.filter((it) => it.id !== id)
      }
      if (prev.length >= MAX_COMPARE) {
        added = false
        return prev
      }
      return [...prev, { id, label }]
    })
    return added
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      ids,
      isSelected,
      toggle,
      remove,
      clear,
      count: items.length,
      isFull: items.length >= MAX_COMPARE,
      ready,
    }),
    [items, ids, isSelected, toggle, remove, clear, ready]
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

/**
 * Returns the compare context, or null when used outside a provider. The toggle
 * is rendered on PartnershipCard which appears on surfaces without a provider
 * (homepage rails, /saved) — those just render no toggle.
 */
export function useCompareOptional(): CompareContextValue | null {
  return useContext(CompareContext)
}
