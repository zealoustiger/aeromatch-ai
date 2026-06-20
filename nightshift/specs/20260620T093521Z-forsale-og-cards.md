# forsale-og-cards

## Goal
Extend the per-page Open Graph + Twitter-card metadata pattern (shipped tonight on `/partnerships/[id]`) to the two top-traffic programmatic for-sale page families, so shared links unfurl into rich cards (referral traffic; GOAL.md lever "Open Graph for shareable listing pages"). Lane `[goal]`; scoreboard at orient = 60.

## Scope (small, additive)
- `src/app/aircraft/[make]/[model]/page.tsx` — EXTEND the existing `generateMetadata` to add a full `openGraph` block (title, description, `url`, `type:'website'`, `siteName`, `images`) and a `twitter` block (`card:'summary_large_image'`, title, description, image). Reuse `label`/`count`/`path` already computed in that function.
- `src/app/aircraft/for-sale/[state]/page.tsx` — same extension, reusing `entry.name`/`count`/`path` already computed.
- Reuse `DEFAULT_OG_IMAGE` from `src/lib/seo.ts` (the SAME site default `/og-default.png` that `/partnerships/[id]` falls back to). No new image, no dynamic OG image.
- Import `SITE_NAME` + `DEFAULT_OG_IMAGE` from `@/lib/seo` (both files already import `SITE_URL` from there).

## Acceptance criteria (QA grades against these)
1. `npx next build` is green and `npx tsc --noEmit` introduces NO new errors in the two touched files (only the 3 pre-existing `.test.ts` baseline errors remain).
2. Rendered `<head>` of a real `/aircraft/cessna/172` has page-specific `og:title`, `og:description`, `og:url` (= canonical), `og:type=website`, `og:image` (= `/og-default.png`), and `twitter:card=summary_large_image` + `twitter:title`/`twitter:description`/`twitter:image`.
3. Rendered `<head>` of a real `/aircraft/for-sale/[somestate]` has the same set, page-specific to that state.
4. REGRESSION: the pre-existing `<title>`, `<link rel="canonical">`, and the ItemList JSON-LD are STILL present and unchanged on both pages.
5. No new console / hydration errors at desktop (1280) + 375px mobile; no 375px horizontal overflow.

## Out of scope
- No dynamic/per-aircraft OG image (use the shared default only).
- No schema/DB change, no new pages, no visible UI change.
- No changes to `/partnerships/[id]` (already shipped) or any other route.
- No Share button on these pages (this cycle is metadata only).
