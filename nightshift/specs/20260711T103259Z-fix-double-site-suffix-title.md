# fix-double-site-suffix-title

## Goal
Fix the `<title>` tag on 4 pages rendering "... | ClubHanger | ClubHanger" (a
double site-name suffix) because their `generateMetadata`/static `metadata`
set `title` as a plain string that already ends in `| ${SITE_NAME}`, which
then gets the root layout's `title.template: '%s | ClubHanger'` applied on
top. Flagged as a known `[bug]` in the most recent CHANGELOG entry
(`seeker-share-metadata`, 2026-07-11T10:22:05Z).

## Scope
- `src/app/aircraft/listing/[id]/page.tsx` — `generateMetadata` (both the
  "sold" branch and the normal branch): wrap the document `title` in
  `{ absolute: title }` so it bypasses the parent template. Leave the
  `openGraph.title`/`twitter.title` fields (which don't go through the
  layout template) using the same suffixed string as-is — unaffected.
- `src/app/partnerships/seeking/[id]/page.tsx` — same fix in
  `generateMetadata`.
- `src/app/account/page.tsx` — static `metadata.title`: wrap in
  `{ absolute: ... }` (no openGraph on this private/noindex page).
- `src/app/alerts/manage/page.tsx` — static `metadata.title`: wrap in
  `{ absolute: ... }` (no openGraph on this private/noindex page).

Per `node_modules/next/dist/docs/.../generate-metadata.md`: `title.absolute`
"provides a title that ignores `title.template` set in parent segments" —
the documented, correct way to set a fully-formed title string.

## Acceptance criteria
- `npx next build` + typecheck pass.
- Served HTML `<title>` on `/aircraft/listing/[id]` (an active listing) reads
  exactly one `| ClubHanger` suffix, not two.
- Served HTML `<title>` on `/partnerships/seeking/[id]` reads exactly one
  `| ClubHanger` suffix.
- `openGraph:title`/`twitter:title` meta tags on both pages are unchanged
  (still carry the `| ClubHanger` suffix — those never went through the
  template, so this was never their bug).
- No other page's title regresses (spot-check `/`, `/aircraft`,
  `/partnerships`, `/account`, `/alerts/manage`).
- qa-smoke passes (HTTP 200, no console errors, no overflow) on the affected
  paths at desktop 1280 + mobile 375.

## Out of scope
- Any other metadata/SEO field.
- The `aircraft/browse`, `partnerships/browse`, `aircraft/compare/[comparison]`
  pages — already correctly use `title: { absolute: ... }`, not affected.
- The `partnerships/[id]` listing page — its title has no manual `| SITE_NAME`
  suffix today, so it isn't double-suffixed; not touched.
