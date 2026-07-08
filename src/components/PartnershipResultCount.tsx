'use client'

import { useEffect, useState } from 'react'
import {
  MAP_BOUNDS_FILTER_EVENT,
  type MapBoundsFilterDetail,
  filterListByBounds,
} from '@/lib/mapListSync'

/**
 * The "N partnerships found" line above the list. Client-owned so it stays
 * honest when the map's "Search this area" control filters cards in the page:
 * it swaps to "Showing M of N in this map area · Show all" and offers the reset.
 * `children` is the server-rendered airport/radius descriptor (unfiltered case).
 */
export default function PartnershipResultCount({
  total,
  children,
}: {
  total: number
  children?: React.ReactNode
}) {
  const [visibleIds, setVisibleIds] = useState<string[] | null>(null)

  useEffect(() => {
    function onBoundsFilter(e: Event) {
      setVisibleIds((e as CustomEvent<MapBoundsFilterDetail>).detail?.ids ?? null)
    }
    window.addEventListener(MAP_BOUNDS_FILTER_EVENT, onBoundsFilter)
    return () => window.removeEventListener(MAP_BOUNDS_FILTER_EVENT, onBoundsFilter)
  }, [])

  if (visibleIds != null) {
    return (
      <p className="mb-4 text-sm text-slate-500">
        Showing <strong>{visibleIds.length}</strong> of {total} in this map area
        <button
          type="button"
          onClick={() => filterListByBounds(null)}
          className="ml-2 font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          Show all
        </button>
      </p>
    )
  }

  return (
    <p className="mb-4 text-sm text-slate-500">
      {total} {total === 1 ? 'partnership' : 'partnerships'} found
      {children}
    </p>
  )
}
