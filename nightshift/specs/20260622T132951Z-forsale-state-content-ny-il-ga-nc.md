# Spec — For-sale state content depth: NY, IL, GA, NC

## Goal
Add genuinely-unique, evergreen editorial content (a 2-paragraph "Buying an aircraft
in {State}" overview + a 3-question buying FAQ) to four more high-GA for-sale state
pages — New York, Illinois, Georgia, North Carolina — so these pages rank on the #1
autocomplete pattern (`aircraft for sale {state}`) with real depth instead of
templated, count-only boilerplate. (`[goal]` lane, INDEXING stage.)

## Scope (small — one family, pure data)
- `src/lib/seo.ts` only: extend `FORSALE_STATE_OVERVIEWS` and `FORSALE_STATE_FAQS`
  with entries keyed `ny`, `il`, `ga`, `nc`.
- No page/component changes — `/aircraft/for-sale/[state]/page.tsx` already renders
  both the overview and the FAQ (with FAQPage JSON-LD) for any curated state and
  nothing for non-curated states.

## Acceptance criteria
- `/aircraft/for-sale/new-york`, `/illinois`, `/georgia`, `/north-carolina` each return
  HTTP 200 and render a "Buying an aircraft in {State}" overview section with 2 unique
  paragraphs + a 3-Q&A FAQ accordion, with a valid `FAQPage` JSON-LD whose questions
  match the visible answers 1:1.
- Each state's prose is genuinely distinct (state-specific GA hubs, climate, tax,
  basing realities) — no fabricated statistics, no live listing counts, not a
  near-duplicate of another state or of the same page's overview vs. FAQ.
- A non-curated state (e.g. `/aircraft/for-sale/ohio`) still returns 200 and renders
  NO overview/FAQ (no regression).
- `npx next build` + typecheck green; qa-smoke exit 0 (HTTP 200, zero app-origin
  console errors, zero horizontal overflow) at desktop 1280 + mobile 375.

## Out of scope
- The partnership-state counterpart (`PARTNERSHIP_STATE_*` for these states) — natural
  next slice; kept out to stay one-family-per-cycle and keep prose quality high.
- Any layout/styling/JSON-LD-helper change; any schema/DB change.
