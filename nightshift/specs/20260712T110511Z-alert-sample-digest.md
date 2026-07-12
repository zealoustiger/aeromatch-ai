# Spec: "Send me a sample digest" on /alerts/manage

## Goal
Let a subscriber on `/alerts/manage` send themselves a real, honestly-labeled preview
of their alert digest email (built from their alert's live matching listings), so they
can confirm the alert works without waiting for the cron to fire.

## Scope
- `src/lib/email.ts` — add optional `sampleNote?: string` to `buildAlertDigestEmail`'s
  opts: when set, prefixes the subject with `Sample: ` and renders an on-brand "Sample
  email" banner at the top of the HTML/text bodies. No change to existing callers
  (param is optional, omitted everywhere else).
- `src/lib/alertMatchCounts.ts` — add exported `getAlertDigestPreview(sourcePath, limit)`
  returning `{ count, noun, samples: AlertDigestSample[] } | null`, mirroring the
  existing `getAlertMatchCount` parser/target shape but selecting full card columns
  (photo/year/price/location/etc.) for up to `limit` current active matches instead of
  a head-only count. Deliberately reuses this file's own parser (not the cron's), same
  precedent as the existing `getAlertMatchCount`.
- `src/app/actions.ts` — new owner-scoped `sendSampleDigest(id, token?)` action:
  resolves ownership via the existing `resolveOwnerEmail`, requires the alert be
  `confirmed` (a pending alert has no "real digest" yet — resend-confirmation already
  covers that case), rate-limited via the existing `last_confirm_sent_at` column/10-min
  cooldown pattern (safe to share: that column is only ever touched for a `pending`
  alert's confirm-resend, this only ever touches a `confirmed` one, so the two states
  never collide on the same row), builds the email via `buildAlertDigestEmail` using
  `getAlertDigestPreview`'s live count/samples as a stand-in for "what's currently
  matching," and sends it to the owner's own email only via the existing `sendEmail`.
- `src/components/SendSampleDigestButton.tsx` (new) — small client button + inline
  success/error state, rendered next to each confirmed alert row on `/alerts/manage`.
- `src/app/alerts/manage/page.tsx` — render the new button on each `status === 'confirmed'`
  row.

## Acceptance criteria
- A confirmed alert row on `/alerts/manage` shows a "Send me a sample" (or similar)
  action; a pending/paused row does not.
- Clicking it calls `sendSampleDigest`, which sends a real email (via the existing
  `sendEmail`/Resend path) to the alert's own owner email, built from
  `buildAlertDigestEmail` with the alert's live matching listings as samples, clearly
  labeled as a sample (subject prefixed `Sample:`, an on-brand banner in the body
  stating the real cadence, e.g. "your real weekly digest arrives automatically when
  there's a genuine match").
- Never fabricates a match — an alert with 0 live matches sends a sample showing "0
  matches" honestly (same honesty floor as the rest of the alert surfaces), not a fake
  listing.
- Rate-limited (10 min) using the existing `last_confirm_sent_at` cooldown mechanism;
  a second click within the window shows a clear "please wait" message, no duplicate send.
- `next build` + typecheck pass; QA smoke clean on `/alerts/manage`.
- No live Resend send triggered during QA (same precedent as every prior email-touching
  cycle) — verified via unit tests on the new `sampleNote` banner behavior plus a
  temporary dev-preview-route fixture, not a real click-through send.

## Out of scope
- A "deal-only" or other criteria toggle on this button (that's the existing edit form).
- Sample sends for pending/paused alerts.
- Any schema change (reuses `last_confirm_sent_at`, already-existing and already
  gracefully-degraded).
