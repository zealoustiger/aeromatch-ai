# aircraft-browse-hub-alert

## Goal
Add an alert-capture box to `/aircraft/browse` — a pure navigation index that today has zero
capture even though every page it links to (make pages, model pages, state pages) does.

## Scope
- `src/app/aircraft/browse/page.tsx` — import `AlertSignup`, render one instance
  (`noun="aircraft"`, `sourcePath="/aircraft"`, a distinct `source="browse_hub"` so placement
  conversion is measurable separately from the existing `/aircraft` browse-footer box) near the
  bottom of the page, after the last index section and before `ForSaleGuideLinks`.

## Acceptance criteria
- `/aircraft/browse` renders a working `AlertSignup` box (email field + submit) that was not
  there before.
- Submitting emits `alert_subscribed` with `source: 'browse_hub'` (inherited from `AlertSignup`
  itself — no new tracking code needed).
- `sourcePath="/aircraft"` is a real, digest-matchable route (bare `/aircraft` — same shape the
  `/aircraft` page's own footer box and other generic aircraft alert boxes already use).
- No layout regression on `/aircraft/browse` at desktop 1280 or mobile 375 (no overflow, no
  console errors).
- `npx tsc --noEmit` and `npx next build` both exit 0.

## Out of scope
- `/partnerships/browse` — on inspection it already has a capture point
  (`PartnershipLaunchBanner`, a "beta near {area}" waitlist box), so the batch-#3 backlog
  premise ("both hubs have zero capture") doesn't hold for it. That banner has its own gap
  (doesn't emit `alert_subscribed`) — a distinct, smaller follow-up, not bundled into this
  cycle to keep the change to one file/one page.
- No change to `AlertSignup` itself, no new analytics wiring, no schema change.
