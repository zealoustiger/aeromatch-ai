# homepage-subscriber-band

## Goal
Give a returning known alert-subscriber a third, highest-priority homepage capture-band
state — "You're covered — N active alerts on this device" — instead of re-pitching them
the same generic "Not ready to browse yet?" capture form.

## Scope
- New client component `src/components/KnownSubscriberBand.tsx`: reads the existing
  device-local alert record (`isAlertSubscriber()` from `alertSubscriberFlag.ts`,
  `getLocalSourcePaths()` from `alertLocalSubscriptions.ts` — the same trust level
  `Nav.tsx`'s "My alerts" swap already uses). When this device has ≥1 remembered
  source_path, renders "You're covered — N active alert(s) on this device" with
  "Manage alerts" (`/alerts/manage`) and "Add another" (`/alerts`) links. Otherwise
  renders its `fallback` prop untouched.
- `src/app/page.tsx`: wrap the existing homepage capture section (the
  `RecentlyViewedAlertBanner` → generic-`AlertSignup`-fallback chain, ~line 261-281)
  in `<KnownSubscriberBand fallback={...}>` so the new state takes priority over both
  existing states, and both existing states remain byte-identical when the local
  record is empty.

## Acceptance criteria
- A browser with no device-local alert record sees the homepage band exactly as before
  (recent-views banner, or the generic "Not ready to browse yet?" capture) — zero
  behavior change for the common case.
- A browser with a local alert record (simulated via `localStorage` in QA) sees the new
  "You're covered — N active alerts on this device" band instead, with working links to
  `/alerts/manage` and `/alerts`.
- No new capture point, no new analytics event, no schema/DB change (purely reads
  existing localStorage keys already written by `AlertSignup`/`ContactBarWatchButton`/etc).
- `npx tsc --noEmit` and `npx next build` stay clean.
- QA smoke passes on `/` at desktop 1280 + mobile 375 (HTTP 200, no console errors, no
  horizontal overflow).

## Out of scope
- Server-side/authenticated alert counts (device-local only, honesty-gated to what the
  browser actually knows, same precedent as the Nav pill).
- Distance-line digest cards, multi-match subject lines, home-field one-tap refinement
  (separate P2 backlog items in the same batch).
