# Recently-viewed smart alert suggestion

## Goal
Suggest an alert on `/aircraft` and `/partnerships` browse pages when a visitor's own
recent listing-detail views (device-local, no account) cluster on one make/model, so
someone who's browsed several Cessna 172s without saving a search still gets a one-tap
path to "alert me for this."

## Scope
- `src/lib/recentlyViewed.ts` (new) — SSR-safe localStorage log of `{make, model, noun}`
  written on listing detail views, capped at last 20 entries.
- `src/lib/savedAlertContext.ts` — export the existing `topByPlurality` helper for reuse
  (no behavior change).
- `src/lib/recentlyViewedAlertContext.ts` (new) — derives a make/model suggestion from
  the log using the same plurality/tie-break rule as `deriveSavedAlertContext`, requiring
  the winning make to have **≥3** clustered views (not just ≥3 total entries).
- `src/components/RecentlyViewedTracker.tsx` (new, client, renders null) — logs a view on
  mount; mounted on `/aircraft/listing/[id]` and `/partnerships/[id]`.
- `src/components/RecentlyViewedAlertBanner.tsx` (new, client) — dismissible banner
  rendering the existing `AlertSignup` scoped to the derived make/model. Honesty-gated:
  fetches a live match count via a new server action before ever rendering; skipped
  entirely when the derived context matches the page's own active-filter context
  (would just repeat the existing "browse_footer" box); dismiss persists per-context in
  localStorage.
- `src/app/actions.ts` — new server action `getAlertMatchCountForSourcePath` (thin
  wrapper around the existing `getAlertMatchCount`, needed because the banner is a
  client component with no server-side match-count fetch of its own).
- `src/app/aircraft/page.tsx`, `src/app/partnerships/page.tsx` — mount the banner above
  the results, passing the page's own `alertContext` as `currentContext`.

## Acceptance criteria
- Viewing 3+ aircraft-listing detail pages for the same make (no account) makes
  `/aircraft` render a "You've been looking at {make}..." banner with a working
  `AlertSignup` box, IF that make has live matches right now.
- The banner never renders when there are fewer than 3 clustered views, when the
  make is ambiguous (tied), when the derived context already equals the page's active
  search, when the live match count is 0/null, or when previously dismissed for that
  context (persists across reloads).
- New capture point emits `alert_subscribed` with `source: 'recent_views'` (inherited
  from `AlertSignup`'s existing tracking — no new event-shape code needed).
- No PII, no listing id, no account required — only make/model/type strings persist,
  mirroring `localSaves.ts`'s honesty precedent.
- `next build` + typecheck pass; QA smoke clean on `/aircraft`, `/partnerships`,
  `/aircraft/listing/[id]`, `/partnerships/[id]` at 1280 + 375px.

## Out of scope
- The digest-email cross-sell suggestion (separate backlog item).
- Seeker-listing views (recently-viewed log only tracks aircraft/partnership, matching
  `deriveSavedAlertContext`'s existing precedent of excluding seekers).
- Cross-device sync (this is a device-local signal by design, same as `localSaves.ts`).
