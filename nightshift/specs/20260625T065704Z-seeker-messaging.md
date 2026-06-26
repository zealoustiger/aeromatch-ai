# Spec: seeker-messaging

**UTC:** 2026-06-25T06:57:04Z  
**Slug:** seeker-messaging  
**Lane:** [want] — P1[want] (on-site messaging slice 1 for seeker listings)  
**Why now:** The `threads` schema already supports seeker threads (`partnership_id` nullable, `seeker_id uuid references partnership_seekers(id)` already migrated in `supabase/schema.sql`). The missing piece is entirely in the application layer.

---

## Goal

Replace the "Send Email" CTA on seeking-partner detail pages with a **"Send Message"** button that starts an on-site conversation in the existing `/messages` thread system — keeping aircraft owners' contact with pilots private and on-platform.

---

## Scope (files to touch)

- `src/app/actions.ts` — add `getOrCreateSeekerThread(seekerId, seekerOwnerId)` action
- `src/lib/types.ts` — update `Thread.partnership_id` to `string | null`, add optional `seeker_id`
- `src/components/SeekerContactBar.tsx` — NEW client component: "Send Message" primary button + email fallback for signed-in users; auto-redirects to auth when signed out
- `src/app/partnerships/seeking/[id]/page.tsx` — replace the current signed-in email CTA with `<SeekerContactBar />`, remove `signedIn` server check (the client component handles auth)
- `src/app/messages/page.tsx` — add `seeker:partnership_seekers(id, title)` to thread select; render seeker title when `partnership` is null
- `src/app/messages/[threadId]/page.tsx` — add `seeker:partnership_seekers(id, title)` to thread select; render seeker context in the header when `partnership` is null

---

## Acceptance criteria

1. On a seeking-listing detail page, a **"Send Message" button** is visible and uses the same sky styling as the existing "Send Email" button.
2. Clicking "Send Message" while **signed out** redirects to `/auth?next=/partnerships/seeking/[id]`.
3. Clicking "Send Message" while **signed in** (and not the listing owner) creates or reuses a seeker thread and navigates to `/messages/[threadId]`.
4. The **inbox (`/messages`)** correctly displays a seeker thread's title (from `seeker.title`) instead of "Deleted listing" when `partnership` is null.
5. The **thread view (`/messages/[threadId]`)** shows the seeker listing's title in the header (links to `/partnerships/seeking/[id]`) when `partnership` is null.
6. The existing email + phone CTAs are preserved as a fallback for signed-in users who prefer email contact (kept, not removed).

---

## Out of scope

- Email notification (Resend) for new messages — deferred to messaging slice 3
- Unread badge / count — deferred to messaging slice 4
- Messaging for aircraft-for-sale listings (different flow, different slice)
- Any change to partnership listing messaging (already works via `ContactBar`)
