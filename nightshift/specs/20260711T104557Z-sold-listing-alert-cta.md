# sold-listing-alert-cta

## Goal
Add an alert-capture box to the sold/removed aircraft listing page (`SoldListingPage`) — the highest-intent alert moment on the site (a buyer wanted *this exact plane* and it's gone) currently has zero on-site alert entry point.

## Scope
- `src/app/aircraft/listing/[id]/page.tsx` — `SoldListingPage` function only.
  - Render `<AlertSignup>` inside the amber "no longer for sale" card (below the existing CTAs), family-scoped when the sold aircraft's make/model resolves to a curated family (via the existing `resolveMakeModelFamily`), falling back to a bare `/aircraft` sourcePath + no context when it doesn't (honesty gate — never a listing-id-scoped alert that can't match anything).

## Acceptance criteria
- A sold/removed listing page (`/aircraft/listing/[id]` where the row is inactive) renders an `AlertSignup` box inside the "no longer for sale" card.
- When the sold listing's make/model resolves via `resolveMakeModelFamily`, the box reads "Get alerts for new {Make} {Model} listings" and submits with `sourcePath=/aircraft?make=...&model=...`.
- When it doesn't resolve, the box falls back to the generic (`context` omitted) copy and `sourcePath=/aircraft`.
- Submitting a valid email on the sold-listing alert box still calls the existing `subscribeToAlerts` action and emits `alert_subscribed` (component is reused as-is, no behavior change to `AlertSignup` itself).
- `npx next build` + typecheck pass; QA smoke passes (200, no console errors, no horizontal overflow) at desktop 1280 + mobile 375 on a sold-listing URL and one active-listing URL (regression check).
- No schema/DB change.

## Out of scope
- Social-proof alert count on this box (the `alertCount` prop) — the active-listing page's count is per-make/model already computed there; skip fetching it for the sold page this cycle to keep the change small.
- Any change to `getSoldAircraftForSaleById` or the active-listing branch.
