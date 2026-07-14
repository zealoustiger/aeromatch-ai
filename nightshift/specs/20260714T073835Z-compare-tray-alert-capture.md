# compare-tray-alert-capture

## Goal
Add alert-capture (`AlertSignup`) to the user-driven `/compare` tray page (up to 3
aircraft-for-sale or partnership listings, ids-based, noindex) — today it has zero
alert capture even though a visitor comparing listings is at peak purchase intent.

## Scope
- `src/app/compare/page.tsx` — after the comparison table (before or alongside the
  existing per-column "View listing" bottom links), render one `AlertSignup` box per
  *deduped* make/model family among the compared items (up to 3, but usually fewer
  after dedup since people often compare same-family listings).
  - Aircraft type: resolve each listing's make/model via `resolveMakeModelFamily`
    (existing helper in `src/lib/seo.ts`). When it resolves to a curated family, use
    the same `/aircraft/{makeSlug}/{modelSlug}` sourcePath shape the curated
    `/aircraft/compare/[comparison]` page already uses. When it doesn't resolve but a
    raw make exists, fall back to `/aircraft?make=...&model=...` (matches the
    sold-listing-alert-cta / listing-detail convention). When no make at all, fall
    back to the generic `/aircraft` sourcePath.
  - Partnership type: no curated make/model page family exists, so always use
    `/partnerships?make=...&model=...` when a make exists, else generic `/partnerships`.
  - Dedup key = the resulting `sourcePath` itself (two listings that produce the same
    sourcePath are the same alert — render only one box for them).
  - Each box gets `source="compare_tray"` (new placement tag, so PostHog can
    attribute this capture point distinctly per GOAL.md's "prove it converts").
- No schema/migration change. No change to `resolveMakeModelFamily`, `AlertSignup`,
  or any digest-cron parsing.

## Acceptance criteria
- `/compare?type=aircraft&ids=<2-3 curated-family ids>` renders one `AlertSignup` per
  distinct resolved family (not one per listing) with correct headline copy
  ("Get alerts for new {Make} {Model} listings").
- `/compare?type=aircraft&ids=<2 same-family ids>` renders exactly ONE alert box (dedup
  works), not two identical ones.
- `/compare?type=partnership&ids=<2-3 ids>` renders one `AlertSignup` per distinct
  make/model combo using the `/partnerships?make=...` sourcePath shape.
- A listing with no make (rare/legacy row) falls back to the generic no-context box,
  and multiple no-make listings dedup to a single generic box, not N identical ones.
- Submitting an alert on `/compare` fires `alert_subscribed` with `source: "compare_tray"`.
- `next build` + typecheck pass; QA smoke passes at desktop 1280 + mobile 375 with no
  console errors and no horizontal overflow; existing comparison table + bottom links
  are visually unchanged.

## Out of scope
- `matchCount` / live match-count line on these boxes (optional prop, skipped to keep
  this slice small — the curated `/aircraft/compare/[comparison]` page already has one
  via a separate `countMakeModel` query; this tray page can pick it up as a follow-up).
- Any change to the curated `/aircraft/compare/[comparison]` SEO page (already has
  alert capture, shipped earlier as `compare-page-alert-capture`).
- Social-proof (`alertCount`) line on these boxes.
