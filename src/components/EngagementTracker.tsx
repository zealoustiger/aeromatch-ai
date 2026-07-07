'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { notifyVisitor } from '@/lib/analytics'

/**
 * Per-page engagement beacon. The base `$pageview` only says a visitor arrived;
 * this adds the "what did they actually do" signal the Slack radar was missing:
 *   • dwell    — how many seconds they stayed on the page
 *   • scroll   — the deepest % of the page they reached
 *   • engaged  — did they meaningfully interact (scrolled past the fold OR >10s)
 *   • sections — which parts of the page they lingered on ("what they paused on"),
 *                as a scrollspy over the page's headings / [data-track-section]s
 *
 * Fires exactly ONE `page_exit` per page view, at whichever comes first: a
 * client-side route change, the tab being hidden, or the page unloading. Uses
 * navigator.sendBeacon on unload (fetch/keepalive is unreliable there). Mounted
 * once near PageViewTracker so it covers every route automatically.
 */

const FOLD_SCROLL_PCT = 40 // scrolling past ~40% = engaged with the content
const ENGAGED_DWELL_MS = 10_000
const ACTIVE_LINE_PX = 160 // a section is "active" once its top scrolls above this y
const MIN_SECTION_MS = 3_000 // ignore sections merely scrolled past
const TOP_SECTIONS = 2 // report the 2 most-dwelt sections

function scrollPct(): number {
  const doc = document.documentElement
  const scrollable = doc.scrollHeight - window.innerHeight
  if (scrollable <= 0) return 100 // page fits on screen — fully "seen"
  return Math.min(100, Math.round(((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100))
}

// A section anchor = an element with an explicit [data-track-section] label, or a
// content heading (h2/h3) we can name by its text. Explicit labels win for the
// key panels; headings cover everything else with zero per-page wiring.
function sectionLabel(el: Element): string {
  const explicit = el.getAttribute('data-track-section')
  const raw = explicit || (el.textContent || '')
  return raw.replace(/\s+/g, ' ').trim().slice(0, 48)
}
function collectSections(): Element[] {
  const els = Array.from(document.querySelectorAll('[data-track-section], main h2, main h3'))
  // Fall back to document-level headings when there's no <main> wrapper.
  if (els.length === 0) return Array.from(document.querySelectorAll('h2, h3'))
  return els
}

export default function EngagementTracker() {
  const pathname = usePathname()
  const startRef = useRef(0)
  const maxScrollRef = useRef(0)
  const firedRef = useRef(false)
  const pathRef = useRef('')
  const dwellRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (!pathname) return
    startRef.current = Date.now()
    maxScrollRef.current = scrollPct()
    firedRef.current = false
    pathRef.current = pathname
    dwellRef.current = new Map()

    // ── Scrollspy: attribute wall-time to the section currently under the
    // ACTIVE_LINE. `active` = the last anchor whose top has scrolled above the
    // line; time between switches is credited to the outgoing section. Anchors
    // are re-collected lazily (cheap, throttled) so late-hydrated/Suspense
    // content still counts. ──
    let anchors: Element[] = collectSections()
    let anchorsAt = Date.now()
    let activeLabel: string | null = null
    let activeSince = Date.now()
    let raf = 0

    const credit = (label: string | null, until: number) => {
      if (!label) return
      const prev = dwellRef.current.get(label) ?? 0
      dwellRef.current.set(label, prev + (until - activeSince))
    }

    const recompute = () => {
      raf = 0
      const now = Date.now()
      if (now - anchorsAt > 1500) { anchors = collectSections(); anchorsAt = now } // catch new content

      const p = scrollPct()
      if (p > maxScrollRef.current) maxScrollRef.current = p

      // Last anchor whose top is at/above the active line = the section being read.
      let current: Element | null = null
      for (const el of anchors) {
        if (el.getBoundingClientRect().top <= ACTIVE_LINE_PX) current = el
        else break
      }
      const label = current ? sectionLabel(current) : null
      if (label !== activeLabel) {
        credit(activeLabel, now)
        activeLabel = label
        activeSince = now
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(recompute) }

    // Fire the exit beacon once. `path` is captured so a beacon for page A can't
    // be mislabeled with page B's path after a fast client nav.
    const fireExit = () => {
      if (firedRef.current) return
      firedRef.current = true
      const now = Date.now()
      credit(activeLabel, now) // flush the section they were on when they left

      const seconds = Math.round((now - startRef.current) / 1000)
      const scroll = maxScrollRef.current
      const engaged = scroll >= FOLD_SCROLL_PCT || now - startRef.current >= ENGAGED_DWELL_MS
      const sections = [...dwellRef.current.entries()]
        .filter(([, ms]) => ms >= MIN_SECTION_MS)
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_SECTIONS)
        .map(([label, ms]) => ({ label, seconds: Math.round(ms / 1000) }))

      const props = { seconds, scroll, engaged, sections }
      const payload = JSON.stringify({
        sessionId: sessionIdForBeacon(),
        event: 'page_exit',
        path: pathRef.current,
        referrer: document.referrer || null,
        props,
      })
      try {
        const ok = navigator.sendBeacon?.(
          '/api/visitor-webhook',
          new Blob([payload], { type: 'application/json' }),
        )
        if (!ok) notifyVisitor('page_exit', props)
      } catch {
        notifyVisitor('page_exit', props)
      }
    }

    const onVisibility = () => { if (document.visibilityState === 'hidden') fireExit() }

    recompute() // seed the initial active section (above-the-fold)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    window.addEventListener('pagehide', fireExit)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      fireExit()
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
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
