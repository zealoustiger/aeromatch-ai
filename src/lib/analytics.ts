'use client'

import posthog from 'posthog-js'

/** Stable per-tab session id used to thread visitor activity in Slack. */
function getSessionId(): string {
  try {
    let id = sessionStorage.getItem('ch_sid')
    if (!id) {
      id = crypto.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem('ch_sid', id)
    }
    return id
  } catch {
    return 'anon'
  }
}

/** Fire-and-forget ping to the visitor radar (threaded Slack alerts). */
export function notifyVisitor(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    fetch('/api/visitor-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: getSessionId(),
        event,
        path: location.pathname,
        referrer: document.referrer || null,
        props,
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* never block on telemetry */
  }
}

/**
 * Safe event capture — sends to PostHog (when configured) AND the visitor radar.
 */
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  notifyVisitor(event, properties)
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  posthog.capture(event, properties)
}
