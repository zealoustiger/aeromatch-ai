// Cross-component "focus this listing" signal for the partnerships map ↔ list
// sync (map → list slice). Mirrors the existing LOCAL_SAVES_EVENT pattern
// (src/lib/localSaves.ts) — a plain window CustomEvent instead of prop-drilling
// through the map (dynamically-loaded client component) and the server-rendered
// list of cards.

/** Fired on the window when a map pin's popup asks to be shown in the list below. */
export const MAP_FOCUS_LISTING_EVENT = 'ch:map-focus-listing'

export interface MapFocusListingDetail {
  id: string
}

export function focusListingFromMap(id: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<MapFocusListingDetail>(MAP_FOCUS_LISTING_EVENT, { detail: { id } })
  )
}
