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
 * Client-side selection state for the listing "Compare" feature.
 *
 * SLICE 1 shipped partnership comparison; SLICE 2 extends the SAME provider to
 * the `/aircraft` (planes-for-sale) marketplace. Holds the ids of the listings
 * the user has selected to compare, each tagged with its listing TYPE so the two
 * marketplaces never mix into one nonsensical comparison.
 *
 * Selection is scoped to ONE type at a time: starting a selection of a different
 * type clears the prior one (obvious, no silent data loss). State lives in React
 * + is mirrored to `sessionStorage` so it survives a page navigation (e.g.
 * opening a listing then coming back) without any DB / schema change, and clears
 * when the tab closes. Capped at MAX_COMPARE.
 */

export const MAX_COMPARE = 3
const STORAGE_KEY = 'clubhanger:compare'

export type CompareType = 'partnership' | 'aircraft'

export interface CompareItem {
  id: string
  label: string
  type: CompareType
}

interface CompareContextValue {
  items: CompareItem[]
  ids: string[]
  /** The type currently being compared, or null when nothing is selected. */
  type: CompareType | null
  isSelected: (id: string, type: CompareType) => boolean
  /**
   * Toggle an id of a given type; returns false if the add was blocked (at the
   * cap). Selecting a DIFFERENT type than the current selection replaces it.
   */
  toggle: (id: string, label: string, type: CompareType) => boolean
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
    const items = parsed.filter(
      (x): x is CompareItem =>
        !!x &&
        typeof x.id === 'string' &&
        typeof x.label === 'string' &&
        (x.type === 'partnership' || x.type === 'aircraft')
    )
    // Stored selection must be a single type (the UI scopes to one at a time);
    // if somehow mixed, keep only the first type's items.
    const firstType = items[0]?.type
    return items.filter((x) => x.type === firstType).slice(0, MAX_COMPARE)
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
  const type = useMemo<CompareType | null>(() => items[0]?.type ?? null, [items])
  const isSelected = useCallback(
    (id: string, t: CompareType) => items.some((it) => it.id === id && it.type === t),
    [items]
  )

  const toggle = useCallback((id: string, label = 'Listing', t: CompareType): boolean => {
    let added = true
    setItems((prev) => {
      const currentType = prev[0]?.type ?? null
      // Switching marketplaces: replace the prior (other-type) selection with
      // this one — never mix the two types into one comparison.
      if (currentType !== null && currentType !== t) {
        added = true
        return [{ id, label, type: t }]
      }
      if (prev.some((it) => it.id === id)) {
        added = true
        return prev.filter((it) => it.id !== id)
      }
      if (prev.length >= MAX_COMPARE) {
        added = false
        return prev
      }
      return [...prev, { id, label, type: t }]
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
      type,
      isSelected,
      toggle,
      remove,
      clear,
      count: items.length,
      isFull: items.length >= MAX_COMPARE,
      ready,
    }),
    [items, ids, type, isSelected, toggle, remove, clear, ready]
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

/**
 * Returns the compare context, or null when used outside a provider. The toggle
 * is rendered on PartnershipCard / AircraftSaleCard which appear on surfaces
 * without a provider (homepage rails, /saved) — those just render no toggle.
 */
export function useCompareOptional(): CompareContextValue | null {
  return useContext(CompareContext)
}
