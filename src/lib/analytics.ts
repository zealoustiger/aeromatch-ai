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

/**
 * Campaign source for the session. UTM params only ride the FIRST (landing) URL,
 * so we stash them in sessionStorage on first sight and reuse for later events —
 * that way the Slack thread's first-event headline still shows the source even if
 * the tracked event isn't the landing pageview.
 */
function getUtm(): { source: string | null; content: string | null } {
  try {
    const p = new URLSearchParams(location.search)
    const src = p.get('utm_source')
    const content = p.get('utm_content')
    if (src) {
      sessionStorage.setItem('ch_utm', JSON.stringify({ source: src, content }))
      return { source: src, content }
    }
    const saved = sessionStorage.getItem('ch_utm')
    if (saved) return JSON.parse(saved)
  } catch {
    /* ignore */
  }
  return { source: null, content: null }
}

/**
 * True when this page is very likely driven by automation rather than a person:
 * `navigator.webdriver` is set by Playwright/Puppeteer/Selenium/Lightpanda (and
 * our own headless QA) unless deliberately stealth-patched, and the named UAs
 * are headless browsers that never belong to a human. Used to keep such
 * sessions out of PostHog; the visitor radar still hears about them (flagged)
 * so admin bot stats stay complete.
 */
export function isLikelyHeadless(): boolean {
  try {
    return navigator.webdriver === true || /Lightpanda|HeadlessChrome/i.test(navigator.userAgent)
  } catch {
    return false
  }
}

/**
 * Cheap client-side bot signals sent with every radar beacon. The server can't
 * see `navigator.webdriver` or the window geometry from headers, but together
 * they fingerprint headless scrapers well: the 2026-08-20 residential-proxy
 * sweep was 1920×1080 screen / 1280×720 viewport on every one of ~270 hits.
 */
function hints(): { webdriver: boolean; sw: number; sh: number; vw: number; vh: number } | null {
  try {
    return {
      webdriver: navigator.webdriver === true,
      sw: screen.width,
      sh: screen.height,
      vw: window.innerWidth,
      vh: window.innerHeight,
    }
  } catch {
    return null
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
        utm: getUtm(),
        hints: hints(),
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
