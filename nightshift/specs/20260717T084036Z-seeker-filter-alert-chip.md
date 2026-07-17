# seeker-filter-alert-chip

**Goal:** Add the existing one-tap "🔔 Alert me for this search" chip to `/partnerships/seeking`'s
active-filter toolbar, matching the aircraft and partnerships browse pages.

**Scope:**
- `src/components/AlertMeChip.tsx` — add an optional `source` prop (default `'filter_toolbar'`,
  still overridden by the existing `shared_alert` share-link detection) so callers can tag their
  placement distinctly.
- `src/components/SeekerActiveFilterChips.tsx` — accept `alertContext`/`alertSourcePath` props
  (mirrors `PartnershipActiveFilterChips`) and render `<AlertMeChip source="filter_toolbar_seeking">`
  after the filter chips, only when `alertSourcePath` is set.
- `src/app/partnerships/seeking/page.tsx` — pass the page's already-computed `alertContext`/
  `alertSourcePath` into `<SeekerActiveFilterChips>`.

**Acceptance criteria:**
- On `/partnerships/seeking` with no filters active, nothing changes (chip bar renders nothing,
  same as today, since `SeekerActiveFilterChips` returns null with 0 chips).
- With at least one filter active (e.g. `?make=Cessna`), the chip bar shows the existing removable
  filter chips PLUS a new "Alert me for this search" chip, matching the visual style already used
  on `/aircraft` and `/partnerships`.
- Tapping the chip while signed out with no remembered email scrolls to and focuses the page's
  existing `#alert-email` field (the page's own `AlertSignup`).
- Tapping the chip while signed out with a remembered email one-tap subscribes and fires
  `alert_subscribed` with `source: 'filter_toolbar_seeking'` (verified by code read of the
  `effectiveSource` computation — not required to round-trip a real DB row for this).
- No change to `/aircraft` or `/partnerships`' existing chip behavior (their calls omit the new
  `source` prop, so they keep firing `filter_toolbar` exactly as before).
- Zero horizontal overflow at 375px on `/partnerships/seeking`; clean production build.

**Out of scope:**
- Mobile sticky alert bar on `/partnerships/seeking` (separate backlog item).
- Any change to the `/aircraft` or `/partnerships` chip source tagging.
- Backend/analytics-dashboard changes to consume the new `source` value.
