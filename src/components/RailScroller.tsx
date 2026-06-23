'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Thin client wrapper for a horizontal collection rail (homepage curated rails).
 * It owns only the scroll mechanics — the cards stay server-rendered and arrive as
 * `children`, so no data-fetch moves to the client.
 *
 * Behaviour:
 * - Hidden scrollbar + scroll-snap (`snap-x snap-mandatory`); cards add `snap-start`.
 *   Reuses the same scrollbar-hide utility as the chip bars for consistency.
 * - On desktop (>=sm) chevron buttons page the row by ~90% of its visible width;
 *   the left chevron only appears once scrolled, the right only while more remains.
 *   On mobile the chevrons are hidden — native swipe is the affordance.
 */
export default function RailScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    // 1px tolerance avoids sub-pixel rounding leaving a chevron stuck visible.
    setCanLeft(el.scrollLeft > 1)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update])

  const page = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <div className="group/rail relative">
      {/* Left chevron — desktop only, shown once scrolled. */}
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => page(-1)}
        className={`absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-md transition hover:bg-white hover:text-sky-700 sm:flex ${
          canLeft ? '' : 'pointer-events-none opacity-0'
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* The scrolling row. `overflow-x-auto` scrolls the ROW; the parent page stays
          overflow-hidden so there is zero PAGE overflow. Scrollbar is hidden. */}
      <ul
        ref={ref}
        className="-mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>

      {/* Right chevron — desktop only, shown while more remains. */}
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => page(1)}
        className={`absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-md transition hover:bg-white hover:text-sky-700 sm:flex ${
          canRight ? '' : 'pointer-events-none opacity-0'
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
