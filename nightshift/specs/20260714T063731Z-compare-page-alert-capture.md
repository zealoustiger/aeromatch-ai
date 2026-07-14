# compare-page-alert-capture

## Goal
Add email-only alert capture to the curated aircraft comparison pages
(`/aircraft/compare/[comparison]`, e.g. "Cessna 172 vs Cirrus SR22") so a visitor
comparing two families can subscribe to new-listing alerts for either one without
leaving the page — closing the last browse-family surface site-wide that has no
`AlertSignup`.

## Scope
- `src/app/aircraft/compare/[comparison]/page.tsx` — add a "Get alerts" section
  with one `AlertSignup` box per compared family, reusing the page's own
  already-computed `aPath`/`bPath` (identical sourcePath shape the make/model
  pages already use — proven, recognized by the digest cron's `parseSourcePath`)
  and `aCount`/`bCount` (already-fetched live inventory counts — no new query).
  `source="compare_page"`.
- No changes to `src/components/AlertSignup.tsx` (used as-is, same props shape as
  `make/model` page's call site).

## Acceptance criteria
- Each curated comparison page (e.g. `/aircraft/compare/cessna-172-vs-cirrus-sr22`
  — check `aircraftComparisons.ts` for real slugs) renders two `AlertSignup` boxes,
  one per compared family, each with the correct `context` (e.g. "Cessna 172"),
  the correct `sourcePath` (`/aircraft/{makeSlug}/{modelSlug}` — same as that
  family's own make/model page), and the real live `matchCount`.
- Live-verify end to end against the real DB on one comparison page: submit two
  real throwaway `@example.com` alerts (one per family box), confirm the
  resulting `alerts` rows carry the right `source_path`/`context`/`source`, then
  delete both test rows.
- No changes to any other page's `AlertSignup` call sites.
- `npx tsc --noEmit` and `npx next build` both pass.
- QA smoke passes (HTTP 200, zero console errors, zero horizontal overflow) at
  desktop 1280 + mobile 375 on at least one comparison page.

## Out of scope
- The user compare tray page (`/compare`, ids-based, noindex utility page) —
  different sourcePath shape needed (per-listing make/model dedup across up to 3
  arbitrary items, plus both aircraft/partnership types); left as the next slice.
- Any change to the digest cron / `parseSourcePath` (the sourcePath shape used
  here is already handled).
- Any change to `AlertSignup.tsx` itself.
