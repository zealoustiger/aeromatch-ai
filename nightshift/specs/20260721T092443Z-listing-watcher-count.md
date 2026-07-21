# listing-watcher-count

## Goal
Show a real, honesty-gated "N pilots are watching this listing" count next to the
"watch this listing's price" alert box on aircraft and partnership detail pages, so
the existing watch-capture points get social proof (BACKLOG Plan-pass batch #16,
`[P1][goal]`).

## Scope
- New `src/lib/alertWatcherCounts.ts` — `getWatcherCount(sourcePath): Promise<number>`,
  a service-role count of `alerts` rows with `status='confirmed'` and an exact
  `source_path` match (the listing's own `?watch=price` path). Mirrors
  `saveCounts.ts`/`alertCounts.ts`'s fail-soft-to-0 convention.
- `src/components/AlertSignup.tsx` — new optional `watcherCount` prop, rendered only
  when `watchOnly` is true and the count is >= 1 ("1 pilot is watching this listing" /
  "N pilots are watching this listing"), styled like the existing `showSocialProof`
  line.
- `src/app/aircraft/listing/[id]/page.tsx` — compute the count for `watchSourcePath`,
  pass into the watch-only `AlertSignup`.
- `src/app/partnerships/[id]/page.tsx` — same, for its own watch-only `AlertSignup`.

## Acceptance criteria
- A listing with 0 confirmed watch alerts renders no count line (no fabrication).
- A listing with >=1 confirmed watch alerts on its exact `?watch=price` source_path
  renders "N pilot(s) are watching this listing" next to/inside the watch box.
- Count is aggregate only — no emails/identities exposed.
- No new schema, no new capture point, no change to existing `alert_subscribed`
  wiring or the family-alert box above the watch box.
- `next build` + typecheck clean; QA smoke passes on both listing detail pages at
  desktop 1280 + mobile 375 with zero console errors / zero overflow.

## Out of scope
- Multi-airport criterion Edit/Duplicate item (sibling batch #16 item, separate cycle).
- Watcher counts anywhere other than the two single-listing watch boxes (e.g. no
  count on browse cards).
