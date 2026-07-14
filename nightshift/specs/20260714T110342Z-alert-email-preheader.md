# Preheader text on alert emails

## Goal
Add a hidden preheader line to every alert email so inbox list views (Gmail, Apple Mail,
etc.) show an honest, useful preview instead of leftover header boilerplate ("ClubHanger").

## Scope
- `src/lib/email.ts` — add a small `preheaderHtml()` helper and call it right after
  `<body ...>` in `buildAlertConfirmEmail`, `buildAlertDigestEmail`,
  `buildCombinedAlertDigestEmail`, and `buildPriceDropEmail`. Preheader copy is derived
  from data already passed into each builder (counts, context, price) — never a new
  fabricated figure.
- `src/lib/email.test.ts` — add unit tests: preheader present in HTML, correctly escaped,
  phrased from real counts, and the plain-text body stays byte-identical (preheader is an
  HTML-inbox-preview concept only, not a text-part concept).

## Acceptance criteria
- Each of the 4 email builders' HTML output contains a hidden (`display:none`,
  zero-height) preheader `<div>` immediately after `<body>`, with escaped, honest text
  summarizing the send (e.g. digest: "3 new Cessna 172 listings this week"; price drop:
  "10% price drop — ... now $180,000 (was $200,000)."; confirm: mentions live match count
  when a preview was passed, generic "start getting alerts" copy otherwise).
- No new fabricated numbers — every count/price used in the preheader is one already
  passed into the function.
- The `text` part of every builder's return value is unchanged (no preheader in plain text).
- `npx tsc --noEmit` and `npx next build` both pass.
- `node --experimental-strip-types --test src/lib/email.test.ts` passes with new tests
  covering all 4 builders' preheaders.
- No visible UI change — this is an email-body change only, not a page. QA is the
  non-visual smoke gate (build/typecheck/unit tests); screenshots not required to be read.

## Out of scope
- `buildManageLinkEmail`, `buildAlertEmailChangeConfirmEmail`, `buildNewMessageEmail`,
  `buildSeedInquiryEmail`, `buildListingUnavailableEmail`, `buildMatchAlertEmail` — not
  named in the backlog item; leave untouched.
- Any change to send paths, cron logic, or subject-line logic.
- The "honor avionics in alert matching" item — separate backlog entry.
