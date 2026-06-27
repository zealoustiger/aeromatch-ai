# Spec: partnership-post-one-screen

**Goal:** Collapse the partnership posting form to one smart screen — put required fields first, everything optional behind a collapsible "More details" disclosure, and AI prefill prominent at the top.

**Scope:**
- `src/components/PostPartnershipForm.tsx` — restructure JSX (no logic changes)
- `src/app/actions.ts` — make `contact_email` optional (fall back to `user.email`)

**Acceptance criteria:**
1. The form opens showing: AI prefill box at top, then a single "Essentials" section with Make, Model, Home Airport, Share Type, Buy-In Price — that's all that's visible above the fold.
2. A "More details (optional)" collapsible (`<details>`) is below Essentials, closed by default. It contains: Year, N-Number, Photos, Title, Description, Monthly Fixed, Wet Rate, Contact Name, Contact Email, Contact Phone, Contact Method.
3. When AI prefill fills fields inside the closed "More details" section, the section auto-opens.
4. Submitting with only the 5 required fields filled (and "More details" closed) succeeds — the server action falls back to `user.email` for contact_email when the form field is blank.
5. No visual regressions on `/partnerships/new` at 375px or 1280px. All existing form controls still submit their values correctly.
6. Build passes clean (no TypeScript errors).

**Out of scope:**
- `/partnerships/seeking/new` (same treatment, future cycle)
- Changing DB schema or server action return shape
- Any changes to `/aircraft/new`
