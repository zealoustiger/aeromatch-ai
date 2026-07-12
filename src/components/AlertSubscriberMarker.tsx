'use client'

import { useEffect } from 'react'
import { markAlertSubscriber } from '@/lib/alertSubscriberFlag'

/**
 * Renders nothing. Marks this browser as an alert subscriber on mount — used by
 * `/alerts/manage` on the resolved-owner branch (a signed-in visit, or one via a
 * valid manage-link token) so the nav's "Get alerts" CTA becomes "My alerts" for
 * returning subscribers. Never rendered on the signed-out dead-end state.
 */
export default function AlertSubscriberMarker() {
  useEffect(() => {
    markAlertSubscriber()
  }, [])
  return null
}
