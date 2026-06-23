# Internal aircraft listing detail page — slice 1

## Goal
Give every for-sale aircraft its own rich, on-site detail page (photo gallery + full
specs + source CTA) so buyers stay on ClubHanger instead of bouncing straight out to
the source — the Zillow/Redfin pattern — and create a new genuinely-unique indexable
page family while STAGE=INDEXING.

## Scope (small)
- **New route** `src/app/aircraft/listing/[id]/page.tsx` — a server component that
  fetches one listing via the existing `getAircraftForSaleById(id)` helper, `notFound()`
  when missing, and renders: breadcrumb/back link, `PhotoGallery`, a header (title +
  year/make/model label + price + badges: source, quality grade, price-drop, New,
  registration), a full specs grid (TTAF, SMOH, engine, avionics, annual due, damage
  history, year, location/state, days-on-market), the description, a "View on {source}"
  CTA, and Save/Share buttons. Plus `generateMetadata` (title/description/canonical/OG
  with the listing's real photo).
- **Wire the main browse card to it** — in `src/components/AircraftSaleCard.tsx`, point
  the photo + title from the external source URL to the new internal `/aircraft/listing/[id]`
  page (same tab). Keep the explicit footer "View on {source}" external CTA unchanged so
  source attribution / outbound path is preserved.

## Acceptance criteria
- `/aircraft/listing/<real id>` returns HTTP 200 and renders the gallery, specs, price,
  description, and a working "View on {source}" outbound CTA.
- A bad/unknown id renders the 404 (notFound), not a 500.
- The detail page only ever shows real listing data; missing fields are simply omitted
  (no "null"/empty rows), and a photo-less listing shows the make placeholder + "Not
  actual plane photo" badge (PhotoGallery default).
- On `/aircraft`, a listing card's photo + title now navigate to the internal detail
  page; the footer "View on {source}" link still goes to the source.
- `npx next build` + typecheck green; qa-smoke exit 0 (HTTP 200, zero app-origin console
  errors, zero horizontal overflow) at desktop 1280 + mobile 375 on `/aircraft` and a
  listing detail page.

## Out of scope (later slices)
- Cost-to-own block, price-history chart, "similar listings" rail (slices 2-3).
- Vehicle/Offer JSON-LD + adding the family to `sitemap.xml` (slice 4).
- Wiring the homepage `AircraftRailCard` to the detail page (separate slice; noted in Next).
