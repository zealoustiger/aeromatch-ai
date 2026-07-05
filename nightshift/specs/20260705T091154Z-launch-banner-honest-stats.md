# launch-banner-honest-stats

## Goal
Remove the two fabricated/inflated stats from `PartnershipLaunchBanner` (shown on 5
partnership pages to nudge alert-signup) so the copy only ever states real numbers —
closing the "copy-honesty smell" flagged in the `partnerships-hub-alert-signup`
(2026-07-05) CHANGELOG entry.

## Scope
- `src/components/PartnershipLaunchBanner.tsx` only. No other files, no schema/query
  change (the real `seekerCount` prop is already correctly sourced from `getSeekerCount()`
  by all 5 callers — untouched).

## What's dishonest today
1. `VISITOR_BASE = 1_247` + `visitorCount = VISITOR_BASE + charCodeAt(0) * 7` — a fully
   fabricated "X+ pilot visitors this month" number with zero backing data (no analytics
   query, no real count). Deterministic-looking (varies slightly per state initial) but
   invented.
2. `displaySeekers = Math.max(seekerCount, 12)` — the real seeker count is padded up to a
   floor of 12, so a genuinely small real number (e.g. 2) is misrepresented as "12".
3. The seeker clause claims these seekers are "in this location," but `getSeekerCount()`
   is a sitewide count, not scoped to `visitorState` — the location claim is inaccurate
   for that specific number.

## The fix
- Delete `VISITOR_BASE` and the `visitorCount` fabrication entirely; drop the "X+ pilot
  visitors" sentence.
- Use the real `seekerCount` with no artificial floor.
- Drop the false "in this location" scoping claim on the seeker count (it's sitewide);
  keep the genuine "beta near {area}" claim about the page context.
- Handle `seekerCount === 0` gracefully (omit the seeker clause rather than saying "0
  are actively seeking") and singular/plural phrasing for 1 vs. many.

## Acceptance criteria
- No hardcoded/derived-from-nothing numbers remain in the component.
- `seekerCount` is used as-is (no `Math.max` floor).
- Copy never claims something the data doesn't support (no fake location-scoping claim).
- Banner still renders and still has a working email-capture form (`subscribeToAlerts`
  unchanged) on all 5 existing call sites.
- `npx tsc --noEmit` and `npx next build` pass.
- QA smoke passes on all 5 pages that render this banner at desktop + mobile.

## Out of scope
- Building a real, location-scoped visitor-count metric (would need new analytics
  plumbing) — just remove the fabricated one; don't replace it with a new number.
- Any other Pillar 2 (signup) work (photo-upload-through-auth persistence, etc.).
