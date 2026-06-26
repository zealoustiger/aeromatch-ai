# Spec: post-form-375-cream-polish

**Goal:** Apply 375px micro-polish and the `.ch-surface` cream visual treatment to both
posting forms (`/partnerships/new` and `/partnerships/seeking/new`), making them look
consistent with the rest of the marketplace (which already uses the cream design token).

**Scope:**
- `src/app/partnerships/new/page.tsx` — add `.ch-surface` outer wrapper
- `src/app/partnerships/seeking/new/page.tsx` — add `.ch-surface` outer wrapper
- `src/components/PostPartnershipForm.tsx` — section padding `p-4 sm:p-6`, AI button
  `w-full sm:w-auto`, DraftIndicator wrap handle long text
- `src/components/PostSeekerListingForm.tsx` — same section padding + AI button fix

**Acceptance criteria:**
1. Both `/partnerships/new` and `/partnerships/seeking/new` show the cream `.ch-surface`
   background (off-white/warm) rather than plain white — consistent with `/aircraft`,
   `/partnerships`, `/airports/[icao]`.
2. Form section cards (`rounded-xl border bg-white`) have `p-4 sm:p-6` padding so mobile
   (375px) shows 16px side padding inside cards instead of 24px, giving fields more room.
3. The "Generate with AI ✨" buttons on both forms are `w-full sm:w-auto` — full-width
   tappable target on mobile, auto-width on desktop.
4. No horizontal overflow at 375px on either form (verified by smoke).
5. No console errors; `npx next build` exits 0.

**Out of scope:**
- Schema changes, new form fields, new pages, logic changes.
- The page wrappers' `max-w-2xl` constraint and overall layout — just the background + inner padding.
- Changing form behavior, server actions, or copy.
