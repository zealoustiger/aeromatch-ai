'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { notifyVisitor, isLikelyHeadless } from '@/lib/analytics'
import EngagementTracker from '@/components/EngagementTracker'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // captured manually below so client-side navigations count
    capture_pageleave: true,
    // Keep automation out of the analytics. posthog-js already drops known
    // crawler UAs; add the AI-agent headless browsers it doesn't know about,
    // and drop every event from a page that admits to being automated
    // (`navigator.webdriver`) — the 2026-08-20 residential-proxy scraper put
    // ~270 fake "visitors" into one evening and swamped the real ~10. Our own
    // headless QA runs are dropped by the same check, which is also right.
    custom_blocked_useragents: ['Lightpanda', 'HeadlessChrome'],
    before_send: (event) => (isLikelyHeadless() ? null : event),
  })
}

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    notifyVisitor('$pageview')
    if (!POSTHOG_KEY) return
    let url = window.origin + pathname
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <EngagementTracker />
      {children}
    </>
  )
}
