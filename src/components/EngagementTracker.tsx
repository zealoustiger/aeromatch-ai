'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { notifyVisitor } from '@/lib/analytics'

/**
 * Per-page engagement beacon. The base `$pageview` only says a visitor arrived;
 * this adds the "what did they actually do" signal the Slack radar was missing:
 *   • dwell — how many seconds they stayed on the page
 *   • scroll — the deepest % of the page they reached
 *   • engaged — did they meaningfully interact (scrolled past the fold OR stayed >10s)
 *
 * Fires exactly ONE `page_exit` per page view, at whichever comes first: a
 * client-side route change, the tab being hidden, or the page unloading. Uses
 * navigator.sendBeacon on unload (fetch/keepalive is unreliable there). Mounted
 * once near PageViewTracker so it covers every route automatically.
 */

const FOLD_SCROLL_PCT = 40 // scrolling past ~40% = engaged with the content
const ENGAGED_DWELL_MS = 10_000

function scrollPct(): number {
  const doc = document.documentElement
  const scrollable = doc.scrollHeight - window.innerHeight
  if (scrollable <= 0) return 100 // page fits on screen — fully "seen"
  return Math.min(100, Math.round(((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100))
}

export default function EngagementTracker() {
  const pathname = usePathname()
  // Per-page mutable state. Reset on each pathname change.
  const startRef = useRef<number>(0)
  const maxScrollRef = useRef<number>(0)
  const firedRef = useRef<boolean>(false)
  const pathRef = useRef<string>('')

  useEffect(() => {
    if (!pathname) return
    // Reset for the new page.
    startRef.current = Date.now()
    maxScrollRef.current = scrollPct() // count the initial above-the-fold view
    firedRef.current = false
    pathRef.current = pathname

    const onScroll = () => {
      const p = scrollPct()
      if (p > maxScrollRef.current) maxScrollRef.current = p
    }

    // Fire the exit beacon once. `path` is captured so a beacon for page A can't
    // be mislabeled with page B's path after a fast client nav.
    const fireExit = () => {
      if (firedRef.current) return
      firedRef.current = true
      const seconds = Math.round((Date.now() - startRef.current) / 1000)
      const scroll = maxScrollRef.current
      const engaged = scroll >= FOLD_SCROLL_PCT || Date.now() - startRef.current >= ENGAGED_DWELL_MS
      const payload = JSON.stringify({
        sessionId: sessionIdForBeacon(),
        event: 'page_exit',
        path: pathRef.current,
        referrer: document.referrer || null,
        props: { seconds, scroll, engaged },
      })
      // sendBeacon survives unload where fetch(keepalive) often doesn't. Falls
      // back to the normal fetch beacon (via notifyVisitor) when unavailable.
      try {
        const ok = navigator.sendBeacon?.(
          '/api/visitor-webhook',
          new Blob([payload], { type: 'application/json' }),
        )
        if (!ok) notifyVisitor('page_exit', { seconds, scroll, engaged })
      } catch {
        notifyVisitor('page_exit', { seconds, scroll, engaged })
      }
    }

    const onVisibility = () => { if (document.visibilityState === 'hidden') fireExit() }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', fireExit)
    document.addEventListener('visibilitychange', onVisibility)

    // On a client-side route change, this cleanup runs BEFORE the next effect —
    // so fire the exit for the page we're leaving.
    return () => {
      fireExit()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', fireExit)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [pathname])

  return null
}

// Mirror analytics.ts's session id (same sessionStorage key) so the exit beacon
// threads under the same Slack message as the pageview.
function sessionIdForBeacon(): string {
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
