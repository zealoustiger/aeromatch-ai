'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { rateFacility } from '@/app/actions'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface Props {
  icao: string
  facilityName: string
  facilityType: 'fbo' | 'flying_club'
  /** Real aggregate (>= MIN_RATINGS_TO_SHOW), or null when too thin to show. */
  initialAverage: number | null
  initialCount: number
  /** The signed-in viewer's own prior rating, if any. */
  initialUserRating: number | null
}

export default function FacilityRatingWidget({
  icao,
  facilityName,
  facilityType,
  initialAverage,
  initialCount,
  initialUserRating,
}: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [average, setAverage] = useState(initialAverage)
  const [count, setCount] = useState(initialCount)
  const [userRating, setUserRating] = useState(initialUserRating)
  const [hovered, setHovered] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const authNext = (() => {
    const qs = searchParams.toString()
    const path = qs ? `${pathname}?${qs}` : pathname
    return `/auth?next=${encodeURIComponent(path)}`
  })()

  function handleRate(value: number) {
    if (!user || isPending) return
    const previousRating = userRating
    const previousAverage = average
    const previousCount = count

    // Optimistic recompute of the aggregate.
    setUserRating(value)
    if (previousRating == null) {
      const nextCount = previousCount + 1
      const nextSum = (previousAverage ?? 0) * previousCount + value
      setCount(nextCount)
      setAverage(nextSum / nextCount)
    } else if (previousAverage != null) {
      const nextSum = previousAverage * previousCount - previousRating + value
      setAverage(nextSum / previousCount)
    }

    startTransition(async () => {
      const result = await rateFacility(icao, facilityName, facilityType, value)
      if (result.error) {
        setUserRating(previousRating)
        setAverage(previousAverage)
        setCount(previousCount)
        return
      }
      track('facility_rated', { icao, facility_name: facilityName, facility_type: facilityType, rating: value })
    })
  }

  const displayRating = hovered ?? userRating ?? 0

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
      {user ? (
        <div
          className="flex items-center gap-0.5"
          role="radiogroup"
          aria-label={`Rate ${facilityName}`}
          onMouseLeave={() => setHovered(null)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={userRating === value}
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
              disabled={isPending}
              onMouseEnter={() => setHovered(value)}
              onClick={() => handleRate(value)}
              className="disabled:opacity-60"
            >
              <Star
                className={cn(
                  'h-3.5 w-3.5 text-slate-300 transition-colors',
                  value <= displayRating && 'fill-amber-400 text-amber-400',
                )}
              />
            </button>
          ))}
        </div>
      ) : (
        <Link href={authNext} className="text-sky-600 hover:text-sky-700">
          Sign in to rate
        </Link>
      )}
      {average != null && count >= 2 && (
        <span className="text-slate-400">
          {average.toFixed(1)} ({count})
        </span>
      )}
    </div>
  )
}
