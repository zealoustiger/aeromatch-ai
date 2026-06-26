# Spec: partnership-desktop-message-button

**Timestamp:** 20260626T101603Z  
**Slug:** partnership-desktop-message-button

## Goal
Add a "Send Message" button to the desktop "Interested?" card on partnership listings (`/partnerships/[id]`), matching the mobile sticky `ContactBar` behavior. On desktop (≥ lg), users currently see only "Send Email" + phone; on mobile they get the "Message" button in the sticky bar. This asymmetry leaves desktop users unable to initiate on-site messaging without using mobile.

## Scope
- `src/components/ContactButtons.tsx` — add `posterId?: string | null` prop + auth-state check + message button
- `src/app/partnerships/[id]/page.tsx` — pass `posterId={p.poster_id}` to `ContactButtons`

## Acceptance Criteria
1. On desktop (≥ lg), the "Interested?" sidebar card on `/partnerships/[id]` shows a dark "Message" button when `poster_id` is set on the listing.
2. Clicking "Message" while signed in creates or opens the thread and navigates to `/messages/[threadId]` (same as mobile behavior).
3. Clicking "Message" while signed out redirects to `/auth?next=/partnerships/[id]`.
4. The Message button does NOT appear when the viewer IS the poster (viewer's user ID = posterId).
5. "Send Email" and phone remain visible below the Message button as secondary contact options.
6. The button matches the desktop visual design (full-width, dark background like the mobile bar).
7. `npx next build` exits 0, QA smoke passes on `/partnerships/[id]` at desktop 1280 + mobile 375.

## Out of Scope
- Mobile sticky ContactBar (already has Message button — no change)
- Seeker contact flow (already has SeekerContactBar — no change)
- Aircraft listing detail (no poster_id / messaging flow there)
- Email/phone removal or hiding (keep as secondary, per backlog: "keep Send Email as fallback")
