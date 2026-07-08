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

/**
 * Fired on the window when the map's "Search this area" control filters the list
 * to the current viewport. `ids` is the set of listing ids visible in the map
 * bounds; `null` clears the filter (show every card again).
 */
export const MAP_BOUNDS_FILTER_EVENT = 'ch:map-bounds-filter'

export interface MapBoundsFilterDetail {
  ids: string[] | null
}

export function filterListByBounds(ids: string[] | null) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<MapBoundsFilterDetail>(MAP_BOUNDS_FILTER_EVENT, { detail: { ids } })
  )
}
