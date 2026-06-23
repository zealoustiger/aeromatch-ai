# Spec — partnership-seo-alert-capture

## Goal
Put the new-listing email-alert capture box on the partnership make + state SEO
landing pages (it already lives on the aircraft make/model/state pages), so a
high-intent visitor on `/partnerships/make/cessna` or `/partnerships/state/ca` can
subscribe to alerts for new co-ownership listings — now that a real double-opt-in
send pipeline exists behind it.

## Lane
`[want]` (last non-bug cycle `content-hub-twitter-parity` pulled `[goal]`; last cycle
PASS so no blocker → `[want]` owed per the 1:1). Explicitly queued in the
`alerts-double-opt-in` cycle's "Next" line: *"add the alert-signup box to the
make/model/state pages that don't yet show it."* The aircraft side is done; the
partnership make/state hubs (priority-12 pages `/partnerships/make/{cessna,cirrus,piper}`
+ `/partnerships/state/{ca,tx,fl}`) are the gap.

## Scope (small)
- `src/components/AlertSignup.tsx` — add an optional `noun` prop (default `'aircraft'`)
  so the body copy reads naturally for partnerships ("new {context} partnership is
  listed" / "just relevant partnerships"). Backward-compatible: every existing aircraft
  caller is byte-identical because the default keeps the current wording.
- `src/app/partnerships/make/[make]/page.tsx` — render `<AlertSignup>` after the
  listings, `context={entry.name}`, `sourcePath="/partnerships/make/<slug>"`,
  `noun="partnership"`.
- `src/app/partnerships/state/[state]/page.tsx` — render `<AlertSignup>` after the
  listings, `context={name}`, `sourcePath="/partnerships/state/<code>"`,
  `noun="partnership"`.

## Acceptance criteria
- The alert box renders on `/partnerships/make/cessna` and `/partnerships/state/ca`,
  below the listings, with partnership-appropriate copy (no "aircraft" noun).
- Existing aircraft pages (`/aircraft/cessna`, etc.) render with identical copy — the
  `noun` default preserves the current wording exactly.
- `subscribeToAlerts(email, context, sourcePath)` is reused unchanged (it is already
  marketplace-agnostic — stores email + context + source_path).
- `npx next build` + typecheck pass.
- QA smoke (production build) exit 0 on `/partnerships/make/cessna` +
  `/partnerships/state/ca` at desktop 1280 + mobile 375: HTTP 200, zero app-origin
  console errors, zero horizontal overflow; screenshots look right.

## Out of scope
- No schema change (the `alerts` table + double-opt-in tokens already exist).
- No actual email send (still gated on `RESEND_API_KEY`; absent here = logged no-op).
- The weekly digest job (alerts slice 3) and `/partnerships/near/[icao]` capture — left
  as follow-ups.
- No visual change to the aircraft pages.
