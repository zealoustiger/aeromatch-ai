# alert-confirm-send-cap

## Goal
Cap confirmation emails per address so `subscribeToAlerts` can't be used to bomb a
victim's inbox by resubmitting the same email with a varying `source_path` (each
insert looks like a "new" alert today, so each gets its own uncapped confirm send).

## Scope
- New pure module `src/lib/alertConfirmCap.ts` (+ `alertConfirmCap.test.ts`): a
  window/count check, same "pass `nowIso` explicitly, no `Date.now()` inside"
  convention as `alertSnooze.ts`/`alertFrequency.ts`.
- `src/app/actions.ts`'s `subscribeToAlerts`: before sending the confirm email on a
  genuinely-new insert, count this email's `alerts` rows created in the last hour
  (admin client — anon has no SELECT on this table) and skip only the *send* when
  at/over the cap. The row itself is always inserted (or left as the idempotent
  23505 no-op) — the visitor still sees the normal "check your email" success panel
  either way, so a suppressed send is never leaked to the submitter.
- Fail-soft: if the count query errors for any reason, treat it as under-cap (still
  send) — this is an anti-abuse ceiling, not a feature the product depends on, so it
  must never block a legitimate signup.

## Acceptance criteria
- `isOverConfirmSendCap` pure function is unit-tested: under cap → false, at/over
  cap → true, timestamps outside the window don't count, boundary is inclusive on
  the "over" side, empty input → false.
- `subscribeToAlerts` calls the admin client to count recent same-email rows and
  skips `sendEmail` when over cap, on the genuinely-new-insert path only (the 23505
  revive branch is unchanged — it already has its own per-row resend cooldown).
- A capped 4th+ submission within the window still returns `{ ok: true, ... }` —
  identical shape/success panel as an uncapped one.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- Full `node --test` suite passes, including the new test file.
- No new capture point, no schema change, no visual change to any page.

## Out of scope
- Capping *resends* (`sendConfirmationResend`) — already rate-limited per row via
  `last_confirm_sent_at`; this item is specifically about the varying-`source_path`
  gap on new inserts.
- Any UI/copy change — this is a pure backend guard.
