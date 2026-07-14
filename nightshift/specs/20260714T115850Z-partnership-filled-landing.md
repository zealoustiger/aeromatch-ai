# Spec: "Filled" landing page for closed partnership listings + alert capture

## Goal
A closed/filled/pending partnership's detail URL currently dead-404s; give it a real
200+noindex landing page (mirroring aircraft's `SoldListingPage`) that acknowledges the
partnership is gone, points the visitor at similar active partnerships, and offers an
`AlertSignup` — turning a wasted click into a captured alert.

## Scope (files expected to touch)
- `src/lib/partnerships.ts` — new `getClosedPartnershipById(id)` using `createAdminClient()`
  (mirrors `getSoldAircraftForSaleById` in `src/lib/aircraftForSale.ts`), `.eq('id', id).neq('status', 'active').single()`.
- `src/app/partnerships/[id]/page.tsx`:
  - `generateMetadata`: when `getPartnership(id)` returns null, fall back to
    `getClosedPartnershipById`; if found, return `robots: {index:false, follow:true}` +
    self-canonical, title/description acknowledging the closure. Else keep "Listing not found".
  - Default page component: when `getPartnership(id)` returns null, fall back to
    `getClosedPartnershipById`; if found render new `FilledPartnershipPage` component instead
    of `notFound()`. Only a genuinely missing id still 404s.
  - New `FilledPartnershipPage({ p }: { p: Partnership })` function (same file, same pattern
    as `SoldListingPage`): breadcrumb ending `"{title} (filled)"`, amber card with honest copy
    ("This partnership has been filled or taken down" — partnerships close, they don't "sell"),
    CTA links to the make/model family partnerships search (when it resolves via
    `resolveMakeModelFamily`) and to `/partnerships`, an `AlertSignup` (`source="filled_partnership"`,
    `noun="partnership"`, family-scoped `context`/`sourcePath`, generic `/partnerships` fallback
    when no family resolves), then a `<SimilarListings current={p} />` rail.

## Acceptance criteria
1. A partnership row with `status` other than `'active'` (e.g. `'closed'`, `'pending'`) served
   at `/partnerships/[id]` returns HTTP 200 (not 404) with the new filled-landing UI.
2. `generateMetadata` for that same closed id returns `robots.index === false` and a
   self-referential canonical — confirmed via built HTML `<meta name="robots">` and `<link rel="canonical">`.
3. The filled page renders an `AlertSignup` with `source="filled_partnership"`, `noun="partnership"`,
   and (when make resolves to a family) a `/partnerships?make=..&model=..` `sourcePath` — no new
   analytics call needed (`AlertSignup` fires `alert_subscribed`/`alert_capture_viewed` internally).
4. A genuinely nonexistent id (no row at all) still calls `notFound()` → real 404 (unchanged).
5. An active partnership's detail page is completely unchanged (byte-for-byte same render path).
6. `npx tsc --noEmit` and `npx next build` both exit 0; `qa-smoke.mjs` passes desktop 1280 +
   mobile 375 (HTTP 200, zero console errors, zero horizontal overflow) on the closed-id URL,
   `/partnerships`, and an active partnership id.

## Out of scope
- No schema change (status values already exist: `'active' | 'pending' | 'closed'`).
- Not touching `getPartnershipById`'s RLS-scoped query or any other partnership list/query.
- Not adding a "why was this closed" reason field or owner-facing closing flow.
- Not touching the aircraft sold-listing page.
