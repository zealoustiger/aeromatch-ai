# seeker-share-metadata

## Goal
Close the last gap in BACKLOG.md's "[P2][goal/want] Shareable listing pages (OG / Twitter cards)" item: add rich Open Graph/Twitter metadata and the site's standard copy-link Share button to `/partnerships/seeking/[id]` (pilot-seeking listings) — the one listing type that still had neither, while aircraft-for-sale and partnership listings already have both.

## Scope
- `src/app/partnerships/seeking/[id]/page.tsx`:
  - Add a `generateMetadata` export mirroring the pattern already shipped on `src/app/aircraft/listing/[id]/page.tsx` and `src/app/partnerships/[id]/page.tsx`: title, description (from the seeker's own `title`/`description`, honest — no fabricated content), canonical URL, `openGraph`, `twitter`. Seeker listings have no photo (avatar is an inline SVG, not a static image), so use the site's `DEFAULT_OG_IMAGE` fallback — same convention the other two pages already use when a listing lacks a real photo.
  - Render `<ShareListingButton url={...} />` next to the existing `SaveListingButton` in the header, matching the exact layout used on `/partnerships/[id]`.
  - No PII in metadata: use the already-anonymized display convention (the page already shows "First L." — the raw `contact_name`/email/phone stay off this page entirely, unaffected by this change).

## Acceptance criteria
- `/partnerships/seeking/[id]` (both a mock-data seeker and, if reachable, a real one) serves `<meta property="og:title">`, `og:description`, `og:image`, `twitter:card` tags, and a canonical `<link rel="canonical">`.
- A "Share" (copy-link) button appears next to the save/heart button on the seeker detail page and copies the canonical URL on click.
- No change to `/aircraft/listing/[id]` or `/partnerships/[id]` (already shipped).
- `npx next build` + typecheck green.
- QA smoke passes (HTTP 200, zero console errors, zero horizontal overflow) at desktop 1280 + mobile 375 on `/partnerships/seeking/[id]`.
- No PII (raw name/email/phone) leaks into the new metadata or button.

## Out of scope
- A generated/dynamic OG image (text-over-photo) for any listing type — out of scope for this slice, matches existing precedent of using a real photo or `DEFAULT_OG_IMAGE`.
- JSON-LD structured data for seeker listings (separate, SEO-parked item).
- Any change to aircraft/partnership listing pages (already shipped).
