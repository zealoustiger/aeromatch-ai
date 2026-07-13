'use client'

import { useEffect } from 'react'
import { addRecentlyViewed, type RecentlyViewedNoun } from '@/lib/recentlyViewed'

/** Invisible — logs this listing-detail view to the device-local recently-viewed log
 *  (see lib/recentlyViewed.ts) so browse pages can suggest an alert when views cluster
 *  on one make/model. Renders nothing. */
export default function RecentlyViewedTracker({
  noun,
  make,
  model,
}: {
  noun: RecentlyViewedNoun
  make: string | null
  model: string | null
}) {
  useEffect(() => {
    if (!make) return
    addRecentlyViewed(make, model, noun)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
