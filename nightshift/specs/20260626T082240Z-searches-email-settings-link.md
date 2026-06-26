# Spec: searches-email-settings-link

**UTC**: 2026-06-26T08:22:40Z
**Slug**: searches-email-settings-link
**Lane**: [want] — last 3 non-bug cycles: aircraft-mission-twin-stol [goal], cream-surface-sweep [want], aircraft-for-sale-ai-draft [want] → not all 3 [want] → [want] owed per the 3:1 policy.

## Goal
On the Saved Searches page (`/searches`), add a clear link/CTA to the email-notification
settings hub (`/account`) so a pilot managing their saved searches can jump straight to
controlling the email alerts those searches drive.

## Why this lane / why this item
Closes the `[P3][want] Link to email settings from Saved Searches` backlog item. Saved
searches on `/searches` ARE the alert subscriptions managed on `/account` (the account page
literally says "saved searches are the alert subscriptions"), but the two pages have no
cross-link today — a user on `/searches` has no obvious path to manage delivery. This is the
cleanest, lowest-risk, no-schema, fully-reversible `[want]` item available: staging has no
user-generated listings, so every messaging/poster-dependent `[want]` feature has zero live
data to render or verify this cycle.

## Scope
- `src/app/searches/page.tsx` only — add a single clear CTA link to `/account` in the page
  header (renders in both the empty-state and the populated-list states). Add the `Bell` icon
  to the existing `lucide-react` import.

## Acceptance criteria
1. The `/searches` page header shows a clear, tappable link/CTA to `/account` labelled around
   "Manage email notification settings".
2. The link uses the page's existing sky link styling + an icon, and is visible whether or not
   the user has any saved searches yet (it lives in the header, above the conditional).
3. Clicking it navigates to `/account` (the email-alerts hub).
4. No change to the saved-search list, rename/delete/view actions, or the auth gate.
5. `npx next build` passes (no TypeScript errors); QA smoke exit 0 on `/searches` + `/account`
   at desktop 1280 + mobile 375 (HTTP 200 / no app-origin console errors / no horizontal overflow).

## Out of scope
- Any change to email-alert delivery, the `/account` page, or saved-search data/schema.
- A real persisted email on/off toggle (needs an additive `profiles` column — separate item).
- Reverse link (`/account` → `/searches`) — already present on `/account`.

## QA note (non-visual cycle)
`/searches` is auth-gated and redirects unauthenticated requests to `/auth?next=/searches`,
so the link is not visible to a headless/unauthenticated smoke run; the smoke gate
(HTTP 200 / no console errors / no overflow) is the sufficient gate here and the link itself
is verified by code review. Treated as a content/link cycle — screenshots saved for the audit
trail but not read.
