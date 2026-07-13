# aircraft-card-watch-alert

## Goal
Add a one-tap "watch this listing's price" bell affordance to `AircraftSaleCard` (the
`/aircraft` browse grid, deals page, rails, etc.) — the last big listing surface with no
alert entry point at all — by reusing the exact `AlertSignup watchOnly` machinery already
shipped on the listing detail page, not forking new logic.

## Scope
- `src/components/WatchAlertButton.tsx` (new) — small icon-only toggle button, styled to
  match `SaveListingButton`'s `variant="icon"` circular treatment, stacked below the heart
  in the card's photo overlay.
- `src/components/AircraftSaleCard.tsx` — render `WatchAlertButton` in the top-right photo
  overlay icon stack; on toggle, expand/collapse an inline `<AlertSignup watchOnly>` panel
  (same `sourcePath={/aircraft/listing/<id>?watch=price}` shape the alert-digest cron and
  match-count helper already resolve — zero new matching logic) below the card's title/
  description block.

## Acceptance criteria
- A bell icon renders on every `AircraftSaleCard`, visually paired with (below) the
  existing heart, without disturbing the photo/heart layout or causing 375px overflow.
- Clicking the bell toggles an inline watch-alert panel open/closed; it is not rendered
  (no extra DB fetch, no layout weight) until a visitor actually clicks — so the browse
  grid's default render is unaffected.
- The panel is the real `AlertSignup` component in `watchOnly` mode — signed-in visitors
  get the existing one-click confirmed-subscribe path; signed-out visitors get the
  existing compact email-only capture — identical behavior/copy to the detail page's
  watch box, because it's the same component and props shape.
- Clicking the card photo/title still navigates to the listing detail page; clicking the
  bell (or the panel) never navigates (event propagation stopped, same pattern as the
  heart button).
- Submitting the panel fires the existing `alert_subscribed` event (via `AlertSignup`
  itself) with `source: 'card_watch'` so this placement's conversion is attributable
  separately from `listing_watch` (the detail-page box).
- No new capture logic, no schema change, no new dependency.

## Out of scope
- Partnership cards (natural follow-up per BACKLOG.md).
- Any change to the cron / match-count matching logic (already fully honors this
  `source_path` shape).
- Persisting "already watching" state back into the card across page loads (the panel's
  own `AlertSignup` already checks `getExistingAlertForSourcePath` once expanded for
  signed-in visitors).
