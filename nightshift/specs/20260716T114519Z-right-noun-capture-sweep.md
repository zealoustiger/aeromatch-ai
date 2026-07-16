# right-noun-capture-sweep

## Goal
Add a right-noun `AlertSignup` capture box to the last 3 zero-capture public pages — `/about`, `/post`, `/listing-quality` — so every meaningful public page has an alert entry point (GOAL.md's "entry points everywhere").

## Scope
- `src/app/about/page.tsx` — add `AlertSignup sourcePath="/" source="about_page"` (generic, no noun override — about page isn't for-sale or partnership specific) in a new light section before the closing dark CTA section (the component's sky-50 card doesn't read well on the dark `bg-slate-900` CTA).
- `src/app/post/page.tsx` — add `AlertSignup noun="seeker" sourcePath="/partnerships/seeking" source="post_chooser"` below the 3 post-type choice cards. This page is owner/poster-facing (deciding what to post), so the honest alert is demand-side: tell them when a pilot starts looking — mirrors the `earnings_calculator` precedent.
- `src/app/listing-quality/page.tsx` — add `AlertSignup noun="seeker" sourcePath="/partnerships/seeking" source="listing_quality"` after the existing "For sellers" section, before the FAQ. Same demand-side rationale — this page is mostly read by people deciding whether/how to post a listing.

Each gets a unique `source` value so placement conversion is measurable, per the existing convention.

## Acceptance criteria
- All three pages render an `AlertSignup` box (verified in served HTML).
- `/about`'s box is in a light section (not on the dark CTA background) — no contrast/visual clash.
- `/post`'s box appears after the 3 choice cards, still inside the `ch-surface` container.
- `/listing-quality`'s box appears between "For sellers" and the FAQ.
- `npx next build` + `tsc --noEmit` pass clean.
- QA smoke (desktop 1280 + mobile 375) passes on all 3 pages: HTTP 200, zero app-origin console errors, zero horizontal overflow.
- A live submit on at least one of the three pages creates a real `alerts` row with the expected `source_path`/`source`, then the test row is deleted (prod DB is shared).

## Out of scope
- The other open `[P1][goal]` item (honest capture-time match count in `AlertSignup`) — separate cycle.
- Any new component, color, or dependency — reuse `AlertSignup` as-is.
