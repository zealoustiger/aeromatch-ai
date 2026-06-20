# Spec — Shareable partnership listings: OG/Twitter card meta + copy-link Share button

**Slug:** listing-og-share
**Branch:** night/listing-og-share (off staging)
**Lane:** [want] — Backlog `[P2][goal/want]` "Shareable listing pages", slice 1 (SAFE part only)
**Scoreboard at orient:** 60 pageviews/7d

## Goal
Make partnership detail pages (`/partnerships/[id]`) shareable: emit rich per-listing
Open Graph + Twitter card metadata so links unfurl into real cards, and add a tasteful
copy-link "Share" button so a visitor can grab the canonical URL in one click.

## Scope (files expected to touch)
- `src/app/partnerships/[id]/page.tsx` — EXTEND existing `generateMetadata` with full
  `openGraph` (title/description/url/type/images) + `twitter` (summary_large_image) and
  keep the existing title/canonical. Mount the new Share button in the detail header.
- `src/components/ShareListingButton.tsx` — NEW client component: copy canonical URL to
  clipboard via Web Clipboard API with a graceful `document.execCommand('copy')` fallback,
  brief "Copied!" confirmation, sky-blue accent.
- `src/lib/seo.ts` — NEW small helper `DEFAULT_OG_IMAGE` constant (absolute URL to the
  new default OG asset) so the fallback is shared/honest.
- `src/app/layout.tsx` — add the default OG image to the site-wide `openGraph`/`twitter`
  so every page (not just listings) has a real default card image too.
- `public/og-default.png` — NEW real 1200x630 branded site default OG image (generic
  ClubHanger card, NOT a fabricated listing photo). Used as the graceful fallback when a
  listing has no real photo.

## Acceptance criteria (QA grades against these)
1. The rendered `<head>` of a real `/partnerships/[id]` contains unique `og:title`,
   `og:description`, `og:image`, `og:url`, `og:type` and `twitter:card=summary_large_image`
   reflecting THIS listing (make/model/location/share), reusing data already fetched.
2. A listing WITH a real photo uses that photo as `og:image`/`twitter:image`; a listing
   WITHOUT a real photo (no images, or placeholder image) falls back to the site default
   OG image `og-default.png` (a real 1200x630 image, never broken/empty).
3. `alternates.canonical` is present and points at the listing's canonical URL (was
   already present — keep it).
4. A "Share" button in the detail header copies the canonical listing URL to the clipboard
   on a real click and shows a brief "Copied!" confirmation. Sky-blue accent only.
5. Mobile-first: zero horizontal overflow at 375px on the detail page; no console/hydration
   errors at desktop + 375px.
6. `npx next build` + `npx tsc --noEmit` pass (only the 3 pre-existing `.test.ts`
   import-extension baseline errors allowed; no new errors in touched files).

## Out of scope (will NOT do)
- NO dynamic/per-listing OG image generation (`opengraph-image` route, @vercel/og). The
  default OG image is a single static branded asset only.
- NO native Web Share API / share sheet — copy-link only.
- NO schema/DB change. NO touching aircraft for-sale listings or their pages.
- NO change to existing title/canonical behavior beyond extending it.
