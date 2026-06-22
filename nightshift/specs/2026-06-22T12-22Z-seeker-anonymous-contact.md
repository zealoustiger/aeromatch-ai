# Spec — Anonymous-by-default seeker listings (slice 1: public anonymization + gated contact)

**Lane:** `[want]` (last non-bug cycle `partnership-og-parity` pulled `[goal]`; last cycle PASS, no blocker → `[want]` owed per the 1:1).
**Backlog item:** `[P1][want] Anonymous-by-default seeker posts` — "Show seeker as 'First L.' with NO contact info; owners reach out through on-platform messaging only. Removes the 'I don't want my info public' barrier." (BACKLOG §C — get pilots to post as "seeking").

## Goal
Honor the seeker form's own on-page promise ("**Not shown publicly — inquiries routed through us**") by making a pilot's "seeking a share" listing **anonymous by default**: show them as **"First L."** and keep their raw email/phone out of the publicly-crawlable page, so posting carries no "my personal info is now public" cost.

## Why this is the right slice now
The seeker **post form** explicitly tells pilots their email is "Not shown publicly" (`PostSeekerListingForm.tsx:308`), but the seeker **detail page** currently publishes the full `contact_name`, a raw `mailto:` email link, and a `tel:` phone link directly into server-rendered HTML (`seeking/[id]/page.tsx:204-228`), and the card footer shows the full `contact_name` (`SeekerCard.tsx:87`). That's a broken promise / PII leak on a priority seed page (#4 `/partnerships/seeking`).
The full backlog item also wants on-platform messaging, but the `threads` table is hardcoded to a NOT-NULL `partnership_id` FK — wiring seeker threads needs an additive schema change + RLS, which is a separate cycle. This slice ships the no-schema half (anonymization + private-by-default contact) cleanly now.

## Scope (small)
- `src/lib/utils.ts` — add a pure `anonymizeName(name)` helper → "First L." (idempotent on already-short names/handles).
- `src/components/SeekerCard.tsx` — footer shows the anonymized name.
- `src/app/partnerships/seeking/[id]/page.tsx` — anonymize the contact-card name AND **server-side gate** the contact details on auth: logged-out (incl. crawlers) see a "Sign in to contact this pilot" CTA + a privacy note and **no** email/phone in the HTML; signed-in users see the existing email/phone contact actions with the anonymized name.

Gating is done server-side (the page is already dynamic — it reads cookies via `createServerSupabaseClient`), NOT via a client component, so the email/phone never enter the RSC payload / HTML for logged-out viewers.

## Acceptance criteria
1. `anonymizeName('John Smith')` → `'John S.'`; single token / handle (`'Alex'`, `'Alex R.'`) returned unchanged; empty/null → null. Unit-checkable pure function.
2. On `/partnerships/seeking/[id]` while **logged out**: the served HTML contains **no** `mailto:`/`tel:` link and **no** raw `contact_email`/`contact_phone` string; the contact card instead shows a "Sign in to contact this pilot" link to `/auth?next=/partnerships/seeking/[id]` plus a short privacy note.
3. On `/partnerships/seeking/[id]` while **signed in**: the contact actions render as today (Email / Phone where the seeker chose them), addressed to the anonymized "First L." name.
4. The `SeekerCard` footer and the seeker detail contact card show the anonymized "First L." name, never a full last name.
5. `/partnerships/seeking` and a seeker detail page both return HTTP 200, zero app-origin console errors, zero horizontal overflow at 1280 + 375; layout/visual unchanged except the contact card.
6. `npx next build` + typecheck pass.

## Out of scope
- On-platform seeker messaging / `threads` schema change (next slice).
- Changing what the post form collects, or the `createSeekerListing` action / DB columns (no schema change).
- The partnership (owner-side) `ContactBar` — owners are businesses advertising a share; unchanged.
- Email relay / sending (human tests email later).
