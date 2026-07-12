# alert-signup-already-subscribed

## Goal
When a signed-in visitor already has a live (confirmed) alert for the exact search/context an `AlertSignup` block is offering, show "✓ You already get {weekly|daily} alerts for this — Manage" instead of the misleading "Alert me — we'll email {email}" button, so the one-click path never renders a silent no-op capture action.

## Scope
- `src/lib/savedSearchAlerts.ts` — reuse `getAlertDetailsBySourcePath(email)` as-is (no change).
- `src/app/actions.ts` — add one new server action `getExistingAlertForSourcePath(sourcePath: string)`: resolves the signed-in user via `createServerSupabaseClient()`, returns `null` if not authenticated, else `getAlertDetailsBySourcePath(user.email).get(sourcePath) ?? null`.
- `src/components/AlertSignup.tsx` — add an `existingAlert` state, populated via a `useEffect` (fires once `signedInEmail` resolves truthy) that calls the new action with the component's existing `sourcePath` prop. Add a new render branch (checkmark icon + "You're already getting alerts" headline/subcopy + a `Link` to `/alerts/manage`) that takes priority over the signed-in one-click button and the price-drop/frequency controls.

Deliberately NOT touching any of the 17 Server Component call sites (`/aircraft`, `/partnerships`, listing pages, make/model/state/airport pages, etc.) — the existing-alert check is entirely client-driven, mirroring how this same file already does its `signedInEmail` session check client-side. This keeps the change to two files.

## Acceptance criteria
- A signed-in user who already has a `status='confirmed'` alert whose `source_path` exactly matches the `AlertSignup` instance's `sourcePath` sees the new "✓ You're already getting {frequency} alerts for this — Manage alerts" state on page load (no click required), linking to `/alerts/manage`.
- A signed-in user with NO existing alert for that `sourcePath` still sees the current "Alert me — we'll email {email}" one-click button, unchanged.
- A signed-out visitor still sees the current email-capture form, unchanged.
- The new state never fires `alert_subscribed` (no insert happens — it's a read-only display + a plain link).
- No schema/migration change — reuses the existing `alerts` table and the existing `getAlertDetailsBySourcePath` helper.
- `npx tsc --noEmit` and `npx next build` both exit 0.

## Out of scope
- Any change to the 17 pages that render `<AlertSignup>` (no new props threaded server-side).
- Treating a `paused` alert as "already subscribed" (only `confirmed`, matching `getAlertDetailsBySourcePath`'s existing filter).
- Inline editing of frequency/price-drop from this new state (that's `/alerts/manage`'s job — this is a read + link only).
- The separate `[P1][goal]` "placement `source` tag on every `alert_subscribed` event" backlog item.
