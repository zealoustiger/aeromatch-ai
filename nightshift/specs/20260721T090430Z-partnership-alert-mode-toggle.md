# partnership-alert-mode-toggle

**Goal:** Extend the existing aircraft-only "New / Drops / Both" alert-mode toggle to partnership search alerts, so partnership subscribers can also mute new-listing matches and get drops-only digests.

**Scope (files expected to touch):**
- `src/app/api/cron/alert-digest/route.ts` — the `newListingOptOut` gate (currently `target.type === 'aircraft' && ...`) also honors `partnership` targets. `priceDropOptIn` is already generic; `countRecentPartnershipPriceDrops`/`fetchPartnershipPriceDropSamples` already exist and are already wired in — no new query needed.
- `src/app/alerts/manage/page.tsx` — render `AlertModeToggle` for `target.type === 'partnership'` rows too, not just `'aircraft'`.
- `src/components/SavedSearchAlertButton.tsx` — broaden the `isAircraft` gate prop into a more accurate `showModeToggle` prop (aircraft OR partnership).
- `src/app/searches/page.tsx` — update the `SavedSearchAlertButton` caller to pass the broadened prop, computed from `s.path` (aircraft path, or the default/`/partnerships` path — excluding `/partnerships/seeking`, which has no price to drop).
- `src/components/AlertModeToggle.tsx` — update the stale doc comment (currently says "aircraft-type alerts only").

**Acceptance criteria:**
1. On `/alerts/manage`, a confirmed partnership-type alert row now renders the New/Drops/Both toggle (previously hidden), and clicking it persists via the existing `updateAlertMode` action (unchanged, already type-agnostic).
2. On `/searches`, a saved partnership search's `SavedSearchAlertButton` (once subscribed) shows the same toggle; a saved seeker search (`/partnerships/seeking`) still does NOT show it (no price to drop).
3. The digest cron (`alert-digest/route.ts`): a partnership alert with `new_listing_opt_out=true` now skips the new-listing count/samples and only reports price drops (mirrors existing aircraft behavior) — verified by reading the updated conditional, not a live cron run.
4. Aircraft alert behavior is byte-identical to before (regression check) — the aircraft branch of every changed conditional is unchanged.
5. `npx next build` + typecheck pass; QA smoke on `/alerts/manage`, `/searches`, `/aircraft`, `/partnerships` (desktop 1280 + mobile 375) is clean.
6. No schema change (columns are already generic booleans per code investigation).

**Out of scope:**
- Seeker-type alerts (no price field — toggle stays aircraft/partnership only).
- The `target.type === 'all'` combined-alert branch (not mentioned in the backlog item; leave its current behavior untouched).
- Any new capture point / `alert_subscribed` event (this is a management-surface + digest-honoring fix, not a new placement).
