'use client'

import posthog from 'posthog-js'

/**
 * Safe event capture — no-ops when PostHog isn't configured
 * (no NEXT_PUBLIC_POSTHOG_KEY) so dev and tests never break.
 */
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  posthog.capture(event, properties)
}
