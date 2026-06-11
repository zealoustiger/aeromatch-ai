'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

export default function ListingViewTracker({
  listingId,
  airport,
  make,
  shareType,
}: {
  listingId: string
  airport: string
  make: string
  shareType: string
}) {
  useEffect(() => {
    track('listing_viewed', {
      listing_id: listingId,
      airport,
      make,
      share_type: shareType,
    })
  }, [listingId, airport, make, shareType])

  return null
}
