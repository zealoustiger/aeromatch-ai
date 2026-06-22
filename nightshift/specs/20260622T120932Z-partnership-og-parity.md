# Spec — partnership-og-parity

## Goal
Bring the partnership **make** (`/partnerships/make/[make]`) and **state** (`/partnerships/state/[state]`) programmatic page families up to full Open Graph + Twitter card parity with the aircraft families and the homepage, so shared links unfurl with a real card (title/description/url/image) and crawlers get a complete, canonical-consistent social-meta block. These are priority index seed pages #5/#6/#7 (make) and #8/#9/#10 (state).

## Scope (small, metadata-only)
- `src/app/partnerships/make/[make]/page.tsx` — `generateMetadata` only: add `url`, `type`, `siteName`, `images` to the existing `openGraph` block + add a `twitter` summary_large_image block. Add `SITE_NAME`, `DEFAULT_OG_IMAGE` to the existing `@/lib/seo` import.
- `src/app/partnerships/state/[state]/page.tsx` — same treatment.

Mirror the existing aircraft-family pattern exactly (`src/app/aircraft/[make]/page.tsx`).

## Acceptance criteria
- Both pages' served HTML carries a complete `og:url` (absolute, matching the self-canonical), `og:type=website`, `og:site_name=ClubHanger`, `og:image` (DEFAULT_OG_IMAGE 1200×630-style default), plus `twitter:card=summary_large_image` + `twitter:title`/`twitter:description`/`twitter:image`.
- `og:url` equals the page's existing `alternates.canonical` (no mismatch).
- No change to the visible page, title, description text, JSON-LD, or canonical.
- `npx next build` + `tsc --noEmit` green (no new errors in touched files).
- QA smoke exit 0 (HTTP 200, zero app console errors, zero horizontal overflow) at desktop 1280 + mobile 375 on a curated make (cessna) and a curated state (ca).

## Out of scope
- Airport pages (`/airports/[icao]`) — also have minimal OG, but most are now `noindex` after the thin-page prune; defer to a follow-up cycle.
- Any new OG image generation (use the existing DEFAULT_OG_IMAGE).
- Any content/layout/JSON-LD/schema/DB change.
