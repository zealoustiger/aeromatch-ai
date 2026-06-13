# Overnight Spec — ClubHanger fixes (2026-06-12)

Audience: an autonomous dev agent running unattended overnight.
Source: QA audit `.gstack/qa-reports/qa-report-clubhanger-2026-06-12.md`.
Base branch: `main`. One PR per task. Do not merge — leave PRs open for morning review.

## Operating rules (read first)

1. **Verify-before-fix.** Before changing anything for a task, reproduce the issue on a **production build** (`npm run build && npm run start`), NOT `next dev`. Dev-mode Fast Refresh de-hydrates the page and manufactures false "dead UI" bugs (that is exactly how the now-retracted ISSUE-001 happened). If you cannot reproduce, STOP that task and write `COULD NOT REPRODUCE` in the PR description instead of guessing.
2. **Never write screenshots or reports into the project tree** while a dev/prod server is watching it. Write QA artifacts to `/tmp/clubhanger-qa/`. (Writing into the repo triggers rebuilds that corrupt test results.)
3. **One PR per task.** Branch name `overnight/<task-id>-<slug>`. PR title `[overnight] <task-id>: <summary>`. PR body: what changed, files touched, how you verified (commands + before/after), and any decisions or uncertainty.
4. **Scope lock.** Touch only the files listed under each task (plus obvious direct dependencies). If a fix needs broader changes, stop and write it up in the PR as `NEEDS DECISION` rather than expanding scope.
5. **Gate to open a PR:** `npm run build` passes AND `npx tsc --noEmit` clean AND the issue is verified fixed on a prod build. If any fails, push the branch anyway but mark the PR title `[overnight][DRAFT]` and explain.
6. **Do NOT touch the hero search / SignUpGate.** ISSUE-001 is retracted — the search works as designed (search → "Save your search?" gate → Skip → `/partnerships?airports=…`). Leave `HeroSearch.tsx` and `SignUpGate.tsx` alone.

---

## TASK-02 — Fix hydration mismatch from locale date formatting (Medium-High)

**Problem:** `new Date(p.created_at).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })` formats in the *runtime's* timezone. Server (UTC) and client (local TZ) can land on different calendar days, producing a React hydration mismatch warning ("a tree hydrated but some attributes… didn't match").

**Files:**
- `src/app/partnerships/[id]/page.tsx:135` (Listed date)
- `src/components/SeekerCard.tsx:86` (Posted date)
- `src/app/partnerships/seeking/[id]/page.tsx:87` (Posted date)

**Fix:** Format these dates deterministically. Add `timeZone: 'UTC'` to each `toLocaleDateString` options object (cheapest correct fix), or factor a shared `formatListedDate(iso)` helper in `src/lib/utils.ts` that pins the timezone. Use the helper everywhere a stored timestamp is rendered as a date.

**Acceptance:**
- On a prod build, load `/partnerships` and 3 detail pages; the React hydration warning no longer appears in the browser console.
- Dates still render as e.g. "June 9, 2026".

**Verify:** `npm run build && npm run start`; open the pages, capture console (to `/tmp/clubhanger-qa/`), confirm zero hydration warnings.

---

## TASK-03 — Rank incomplete captured listings last + de-emphasize (High)

**Decision (from Brian):** Do NOT hide incomplete listings. Keep them published and SEO-indexable, but **sort them below complete listings** and **visually de-emphasize** them. Keep any external source link as a fallback (see TASK-05).

**What "incomplete" means:** a listing missing real make/model (stored as "Unknown"/null), or with `image_is_placeholder = true`, or with no price (buy-in/monthly). Define a single `isCompleteListing(p)` predicate in `src/lib/utils.ts` and reuse it.

**Files (listing sources that currently `.order('created_at', desc)`):**
- `src/components/FeaturedListings.tsx:20` (homepage "Newest partnerships")
- `src/components/PartnershipList.tsx:57` (browse + state/make SEO pages)
- `src/app/airports/[icao]/page.tsx:30`

**Fix:** Apply a two-key sort: complete listings first (by `created_at` desc), incomplete last (by `created_at` desc). Supabase `.order` can't express "computed completeness," so either (a) add a derived/generated column, or (b) fetch then stable-sort in JS by `isCompleteListing` before render. Prefer (b) for an overnight change — no migration. For de-emphasis, in `PartnershipCard.tsx` apply a muted treatment (e.g. lower opacity / "Details pending" tag) when `!isCompleteListing(p)`.

**Acceptance:**
- Homepage "Newest partnerships" leads with complete listings (real make/model, price); "Unknown Unknown" cards appear after them.
- Incomplete cards are visually distinct (muted) from complete ones.
- No complete listing is ever ranked below an incomplete one.

**Verify (prod build):** screenshot homepage + `/partnerships` to `/tmp/clubhanger-qa/`; confirm ordering and muted styling.

---

## TASK-04 — INVESTIGATE: no aircraft image on detail pages (Medium, investigate-first)

**This is an investigation, not a blind fix.** Open question: do listings carry a usable image URL, or only placeholders?

**Do:**
1. Inspect `src/lib/types.ts` (listing shape — `image_url`? `image_is_placeholder`), `src/lib/aircraftPhotos.ts` (`getPlaceholderPhoto`), and `src/app/partnerships/[id]/page.tsx` (does it render any image?).
2. Determine: does the detail page omit the image entirely while cards show one? Is real image data ever present, or always placeholder?

**Then:** If the fix is low-risk and obvious (detail page should show the same photo the card does, with the "Not actual plane photo" badge when `image_is_placeholder`), implement it as its own PR. If it depends on missing data or a product decision (e.g. should we show placeholders on detail at all), DO NOT implement — write findings + a recommendation in a PR titled `[overnight] TASK-04: investigation only` with no code change.

**Acceptance:** either a working detail-page image (matching card behavior) OR a clear written investigation with a recommendation.

---

## TASK-05 — "Send Email" dead-ends on captured listings (Medium)

**Problem:** Facebook-captured listings store `contact_email: 'facebook-noreply@clubhanger.com'` (`src/app/admin/review/actions.ts:54`). The detail page still renders an "Interested? → Send Email" CTA pointing at a noreply address — a guaranteed dead-end.

**Decision (from Brian):** Keep the external source link as a fallback when there's no real on-platform contact, so the listing stays actionable.

**Files:** `src/app/partnerships/[id]/page.tsx`, `src/components/ContactButtons.tsx` and/or `src/components/ContactBar.tsx` (whichever renders the "Send Email" CTA), `src/lib/types.ts` (check for a `source_url`).

**Fix:** When `contact_email` is the noreply sentinel (or otherwise non-routable), do NOT show a "Send Email" button that goes nowhere. Instead, if the listing has a `source_url`, show a "View original listing" link (fallback). If neither a real email nor a source URL exists, show no CTA rather than a broken one.

**Acceptance:**
- A captured listing no longer shows a "Send Email" that targets `facebook-noreply@…`.
- If `source_url` exists, a "View original listing" fallback link is shown.
- A real (non-captured) listing with a genuine `contact_email` is unchanged.

---

## TASK-06 — Seeking empty-state copy (Low)

**Problem:** `src/components/SeekerList.tsx:32` shows "No seeking listings match your filters." even when no filters are applied.

**Fix:** Show "No seeking listings match your filters." only when filters are actually set; otherwise "No seeking listings yet." Keep the existing "Be the first — post a seeking listing!" line (SeekerList.tsx:33).

**Acceptance:** `/partnerships/seeking` with no query params reads "No seeking listings yet."; with a filter applied it reads the "match your filters" copy.

---

## TASK-07 — Seeking loading skeleton flashes 3 fake cards (Low)

**Problem:** `/partnerships/seeking` renders three full skeleton cards, then collapses to a one-line empty state — a mild bait-and-switch when there's no data.

**Files:** `src/components/SeekerList.tsx` (loading/skeleton path).

**Fix:** Reduce the skeleton to a lighter loading indicator, or render it only briefly. Low priority — keep the change small and self-contained.

**Acceptance:** No jarring 3-card skeleton → empty-state flip on a cold load.

---

## TASK-08 — Repeated stock photos + "Not actual plane photo" noise (Low / cosmetic)

**Problem:** Every card reuses a few stock images each stamped "Not actual plane photo." Honest but visually monotonous and noisy.

**Files:** `src/lib/aircraftPhotos.ts`, `src/components/PartnershipCard.tsx`, `src/components/FeaturedListingCard.tsx`.

**Fix (judgment):** Lowest-risk improvement only — e.g. vary placeholder by make so identical photos don't stack, and/or make the badge less obtrusive. Do NOT invent fake photos. If unsure, ship as investigation-only.

**Acceptance:** Less visual repetition on a listing grid; badge still honestly present on placeholders.

---

## Out of scope / do not touch
- Hero search & `SignUpGate` (TASK-001 retracted — works as designed).
- Auth, messaging, saved-search, and admin pipeline logic (not audited this round; no session).
- Any database migration unless a task explicitly calls for it (none do; prefer JS-side changes).

## Morning review checklist (for Brian)
- [ ] TASK-02 hydration — console clean on prod build?
- [ ] TASK-03 ranking — do good listings lead the homepage?
- [ ] TASK-04 — investigation or fix? read the writeup
- [ ] TASK-05 — no dead "Send Email"; fallback link present?
- [ ] TASK-06 / 07 / 08 — quick visual confirm
