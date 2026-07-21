# alert-social-proof-hub-pages

## Goal
Wire the existing (but under-used) "N buyers get alerts for this" social-proof line into the
remaining aircraft/partnership hub pages that already pass `AlertSignup` a stable `context`
string but never pass `alertCount`.

## Background
`AlertSignup` (`src/components/AlertSignup.tsx`) has fully built, honesty-gated social-proof
copy — `showSocialProof` only renders `"{alertCount} buyers get alerts for {context}"` when
`alertCount >= MIN_ALERTS_TO_SHOW` (3), never a fabricated/padded number — and the counting
infra (`getAlertCounts()` in `src/lib/alertCounts.ts`, an admin-client read of `alerts` grouped
by exact `context`, fails soft to an empty map) already exists. Today only two of the ~40
`AlertSignup` call sites actually pass `alertCount`: `/aircraft/[make]/[model]/page.tsx` and
`/aircraft/listing/[id]/page.tsx`. Every other hub page with a real, stable `context` (make
pages, state pages, make+model+state pages, partnership make/state pages) renders the box with
no social proof at all, even when real subscriber counts exist. This is a pure "wire it up"
slice — reuse the identical pattern already shipped and proven on `/aircraft/[make]/[model]`.

## Scope
- `src/app/aircraft/[make]/page.tsx` — `context={entry.make}`
- `src/app/aircraft/for-sale/[state]/page.tsx` — `context={entry.name}`
- `src/app/aircraft/[make]/[model]/[state]/page.tsx` — `context={`${label} in ${st.name}`}`
- `src/app/partnerships/make/[make]/page.tsx` — `context={entry.name}`
- `src/app/partnerships/state/[state]/page.tsx` — `context={name}`

For each: import `getAlertCounts` from `@/lib/alertCounts`, call
`await getAlertCounts([context])` once alongside the page's other data fetches, and pass
`alertCount={alertCounts.get(context)}` into the existing `AlertSignup` call — no other prop
changes. No new component, no schema change, no new capture point (same `alerts` table, same
`alert_subscribed` event — this only makes the existing box show real social proof when it
clears the honesty floor).

## Acceptance criteria
- All 5 pages import and call `getAlertCounts` and pass `alertCount` into their `AlertSignup`.
- `npx next build` + `npx tsc --noEmit` pass clean.
- No visible change when a context's count is below `MIN_ALERTS_TO_SHOW` (3) — same as today.
- QA smoke (desktop 1280 + mobile 375) passes on at least one page from each of the two
  families (aircraft + partnerships) with HTTP 200, no console errors, no horizontal overflow.
- No prod rows created or needed for QA (read-only `getAlertCounts` call against real data).

## Out of scope
- Any other `AlertSignup` call site (mission pages, compare pages, seeking pages, guides,
  homepage, etc.) — a natural next slice, not this cycle's diff.
- Changing `MIN_ALERTS_TO_SHOW` or the social-proof copy itself.
- The `familyForSourcePath`/demand-family grouping concept mentioned in the original backlog
  item text — the shipped precedent (`[make]/[model]` page) uses exact-context matching via
  `getAlertCounts`, not family grouping, so this slice follows that same simpler, already-
  proven pattern for consistency.
