// Shared HogQL predicate that keeps known headless-scraper traffic out of the
// Night Shift's PostHog numbers (traffic-report, metrics-digest, scoreboard).
//
// On 2026-08-20 a residential-proxy scraper swept clubhanger.com: ~270 PostHog
// "visitors" in two hours, one hit per IP, ten canned 2023-era UAs, and every
// single hit at 1920×1080 screen / 1280×720 viewport with no referrer — the
// headless-browser default window. That fingerprint matched ZERO pageviews in
// the 90 days before, so excluding it costs nothing real and stops one bot
// evening from reading as a 20× traffic spike. The client now also drops
// `navigator.webdriver` sessions before they reach PostHog (PostHogProvider),
// so this is mostly a backstop for history and for stealth-patched bots.
//
// Null-safe on purpose: in ClickHouse `NOT (NULL)` is NULL, which WHERE treats
// as false — so a pageview missing $screen_width would vanish from the counts
// without the ifNull() guards.

export const NOT_BOT = `NOT (
  ifNull(properties.$raw_user_agent ILIKE '%lightpanda%', 0)
  OR ifNull(properties.$raw_user_agent ILIKE '%headless%', 0)
  OR (
    ifNull(toInt(properties.$screen_width), 0) = 1920
    AND ifNull(toInt(properties.$screen_height), 0) = 1080
    AND ifNull(toInt(properties.$viewport_width), 0) = 1280
    AND ifNull(toInt(properties.$viewport_height), 0) = 720
    AND ifNull(properties.$referring_domain, '') = '$direct'
  )
)`.replace(/\s+/g, ' ')

/** `event = '$pageview'` with the bot fingerprint excluded — drop-in for WHERE. */
export const PV = `event = '$pageview' AND ${NOT_BOT}`
