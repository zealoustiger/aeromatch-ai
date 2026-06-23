# partnerships-near-alert-capture

**Lane:** [want] (last non-bug cycle `hub-itemlist-jsonld` pulled [goal]; last cycle PASS → no blocker → [want] owed per the 1:1).

## Goal
Add the same no-account "Get alerts for new listings" email-capture box that the
partnership make- and state-hub pages already show to the third partnership geo
family — `/partnerships/near/[icao]` — so a visitor on a high-intent "partnerships
near {airport}" page can be notified when a new nearby co-ownership listing appears.

## Why this is the highest-value [want] this cycle
- Directly queued: the `partnership-seo-alert-capture` cycle's "Next" line names
  exactly this gap ("add the same capture box to `/partnerships/near/[icao]` (the
  third partnership geo family) for parity"). The aircraft side and the partnership
  make/state hubs are already done; the near-airport family is the remaining gap.
- A conversion / list-building win (value the pageview metric can't see tonight),
  feeding the same confirmed double-opt-in pipeline already shipped — safe and
  sendable the moment a Resend key is added; nothing sends now.

## Scope (small — one file)
- `src/app/partnerships/near/[icao]/page.tsx` — import `AlertSignup`, render it once
  between the results list and the cross-links block, with
  `context="{ICAO} area"`, `sourcePath="/partnerships/near/{icao}"`, `noun="partnership"`.

## Acceptance criteria
- [ ] `/partnerships/near/[icao]` renders the sky-blue `AlertSignup` box below the
      listings and above the cross-links section, on a page with real nearby inventory.
- [ ] The box reads with partnership wording ("a new {ICAO} area partnership is listed").
- [ ] Reuses the existing `AlertSignup` component + `subscribeToAlerts` action — no
      new component, no schema change, no new email send.
- [ ] `npx next build` + typecheck green.
- [ ] QA smoke exit 0 (HTTP 200, zero app-origin console errors, zero horizontal
      overflow) at desktop 1280 + mobile 375 on a real near-airport page.
- [ ] Thin-page guardrail unchanged: unknown / below-`MIN_NEARBY` ICAO still 404s
      (the box only renders on a real, inventory-backed page).

## Out of scope
- Any change to the for-sale or make/state alert boxes (they stay byte-identical).
- The weekly digest job / actually sending email (still gated on a Resend key).
- Any layout/content change to the near-airport page beyond inserting the box.
