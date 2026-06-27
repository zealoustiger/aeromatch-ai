# Spec: aircraft-post-one-screen

**UTC timestamp:** 2026-06-27T091336Z
**Slug:** aircraft-post-one-screen
**Pillar:** Frictionless listing posting (Pillar 1)

## Goal
Collapse the "Sell Your Aircraft" form (`/aircraft/new`) to one smart screen: AI prefill box at the top, two required fields visible immediately (Make + Model), everything else inside a "More details (optional)" disclosure closed by default. A seller can publish with just Make + Model in under 10 seconds.

## Background
The partnership and seeking post forms both had this one-screen treatment applied in prior cycles (`partnership-post-one-screen`, `seeking-post-one-screen`). The aircraft form still has 4 fully-expanded sections: Aircraft Details / Photos / Listing Details / Price & Location. The AI prefill box is buried in section 3. The form already has: AI prefill for all fields, N-number FAA lookup, airport autocomplete, autosave, and deferred auth gate — all the UX improvements from prior cycles are present. What's missing is the progressive disclosure that puts the simplest path first.

## Scope — one file changed
- **`src/components/PostAircraftForm.tsx`** — restructure JSX:
  1. Move the violet "Prefill from your notes ✨" AI box to the very top (above all sections).
  2. Collapse the form to a single "The basics" section with only Make (required) and Model (required).
  3. Move everything else — Year, N-Number/Lookup, TTAF, SMOH, Photos, Title, Description, Asking Price, Based at — into a "More details (optional)" `<details>` disclosure with a chevron toggle, closed by default.
  4. When AI prefill populates any field inside the disclosure, auto-open it (same pattern as partnership/seeking forms).

## Acceptance criteria
1. `/aircraft/new` loads showing: the violet AI prefill box, then "The basics" with Make + Model, then a closed "More details (optional)" disclosure, then the submit button — all visible without scrolling on desktop 1280px.
2. A user can select Make + Model and hit "Post Aircraft for Sale" (or "Sign in to Publish →" for guests) without opening "More details."
3. The "More details" disclosure contains all optional fields: Year, N-Number + lookup button, TTAF, SMOH, Photos, Title (optional label), Description, Asking Price, Based at.
4. When AI prefill fills a field inside the closed disclosure, the disclosure auto-opens.
5. `npx next build` compiles with zero TypeScript errors.
6. QA smoke exits 0 on `/aircraft/new` + `/aircraft` at desktop 1280 + mobile 375.
7. `/aircraft` browse page is unaffected.

## Out of scope
- Adding new fields (e.g. annual_due, engine_type) to the form.
- Changing the server action or data model.
- One-screen treatment on any other form (already done for partnership + seeking).
