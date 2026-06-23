# Spec — Stop loading source "noimage" placeholder photos (fix /aircraft 400s)

**Slug:** fix-source-noimage-photos
**Lane:** `[bug]` blocker — preempts the would-be `[want]` pick. Discovered during QA of this cycle: `/aircraft` (priority page #2) logs app-origin console **400** errors at both desktop + mobile, failing the QA smoke gate.

## Root cause
Some aggregated for-sale listings have their first `images[]` entry pointing at the *source site's own* "no photo" graphic — `https://static.aircraftforsale.com/bundles/faffrontend/images/noimage-300x225.webp`. Two problems:
1. `static.aircraftforsale.com` is **not** in `next.config.ts` `images.remotePatterns` (only `cdn.aircraftforsale.com` is), so `/_next/image` rejects it → **HTTP 400 `"url" parameter is not allowed`** on every card showing one.
2. Even if it loaded, it's the source's *noimage* placeholder — showing it as the plane photo (with no "Not actual plane photo" badge) is misleading.

Correct fix: treat such source-placeholder URLs as **not a real photo**, so we fall back to our own per-make placeholder + the existing "Not actual plane photo" badge. This removes the 400 AND is the honest UX. (We deliberately do NOT allowlist `static.aircraftforsale.com` — we don't want to display the source's noimage graphic.)

## Scope (small, centralized)
- `src/lib/aircraftPhotos.ts`: add `isUsablePhoto(url)` (rejects falsy + known source-placeholder URLs, e.g. those containing `noimage`/`no-image`/`no_image`/`placeholder`) and `pickRealPhoto(images)` (first usable photo or `null`).
- Swap the `images?.[0]` / `images.filter(Boolean)` photo-selection in the consumers to use the helper: `AircraftSaleCard`, `FeaturedListingCard`, `PartnershipCard`, `PhotoGallery`, and the two hero pages (`/aircraft/[make]`, `/aircraft/[make]/[model]`). Purely a selection change — a genuine real photo passes through unchanged.

## Acceptance criteria
- `/aircraft` at desktop 1280 + mobile 375 logs **zero** app-origin console errors (the `static.aircraftforsale.com` 400s are gone).
- Cards whose only image was a source-noimage now render our per-make placeholder **with** the "Not actual plane photo" badge.
- Listings with a genuine real photo are unchanged (still show the real photo, no badge).
- `next build` + typecheck pass; QA smoke passes on `/aircraft` (and `/partnerships`, `/` spot-checked).
- No next.config / schema / data changes.

## Out of scope
- Re-ingesting or cleaning the stored `images` data (front-end selection only).
- Allowlisting new image hosts.
- The deferred days-on-market label (separate `[want]` slice for a future cycle).
