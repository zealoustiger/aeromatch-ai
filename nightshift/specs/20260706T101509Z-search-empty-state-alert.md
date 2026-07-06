# Spec: search-empty-state-alert

## Goal
When a filtered search on `/aircraft`, `/partnerships`, or `/partnerships/seeking` returns zero
results, lead with an inline "Get alerted when one lists" capture instead of a dead end —
the next open 🔔 GOAL.md `[P1][goal]` alert-experience slice ("Alert prompt in empty/zero-result
search states").

## Scope
- `src/components/AlertSignup.tsx`: add an optional `className` prop (default `'my-10'`, the
  current hardcoded value) so callers embedding it inside a tighter empty-state container can
  override the vertical margin without touching the component's own styling.
- `src/components/AircraftSaleList.tsx`: thread new optional `alertContext`/`alertSourcePath`
  props from the exported `AircraftSaleList` component down to its internal `renderList`, and
  render `<AlertSignup>` inside the zero-results branch (page 1 only — the "out of range page"
  branch is unaffected).
- `src/app/aircraft/page.tsx`: pass the already-computed `alertContext`/`alertSourcePath` into
  `<AircraftSaleList>`.
- `src/components/PartnershipList.tsx`: same threading — new optional `alertContext`/
  `alertSourcePath` props on `PartnershipList`, rendered in its zero-results branch.
- `src/app/partnerships/page.tsx`: pass the already-computed `alertContext`/`alertSourcePath`
  into `<PartnershipList>`.
- `src/components/SeekerList.tsx`: thread the same two props into `SeekerEmptyState`, rendering
  `<AlertSignup noun="seeker">` under the existing "Post Seeking Listing" CTA (both the filtered
  and unfiltered branches).
- `src/app/partnerships/seeking/page.tsx`: pass its already-computed `alertContext`/
  `alertSourcePath` into `<SeekerList>`.

All three pages already compute `alertContext`/`alertSourcePath` for their existing
below-the-list `<AlertSignup>` — this reuses those exact values, so the empty-state alert
matches the same filters `alert-digest`'s `parseSourcePath` already understands. No new query,
no schema change.

## Acceptance criteria
- `/aircraft?make=DoesNotExist123` (or any filter combo with 0 matches) renders an inline
  "Get alerts for new … listings" capture inside the empty-state card, above/alongside the
  existing "Try widening your search" copy.
- `/partnerships?make=DoesNotExist123` — same, partnership-flavored copy (`noun="partnership"`).
- `/partnerships/seeking?make=DoesNotExist123` — same, seeker-flavored copy (`noun="seeker"`),
  alongside the existing "Post Seeking Listing" CTA and (if any) the available-partnerships
  fallback rail.
- The unfiltered "nothing posted yet" empty states (no listings in the DB at all) also get the
  alert box — it's still a dead end for that visitor.
- No existing functionality (result rendering, pagination, out-of-range page state, existing
  below-the-list `<AlertSignup>`) changes when there ARE results.
- Each empty-state alert box fires the same `alert_subscribed` PostHog event on submit (no new
  analytics code needed — reuses `AlertSignup` as-is).
- `npx next build` + `npx tsc --noEmit` clean.

## Out of scope
- The homepage alert band (`[P2][goal]`) — separate backlog item.
- Any change to `alert-digest`, `subscribeToAlerts`, or the `alerts` table/schema.
- Restyling the existing below-the-list `AlertSignup` placements (untouched).
