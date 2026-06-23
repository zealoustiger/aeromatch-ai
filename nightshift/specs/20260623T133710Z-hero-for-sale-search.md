# Spec — Homepage hero: add "Planes for sale" search mode

**Slug:** `hero-for-sale-search`
**Lane:** `[want]` (last non-bug cycle `mission-page-faqs` pulled `[goal]`; last cycle PASS so no blocker → `[want]` owed per the 1:1)
**Backlog item:** `[P2][want] Homepage free-text search box` — "put it on the homepage beside the airport search" (non-AI slice: free-text routes to the existing `/aircraft?q=` search; no ANTHROPIC dependency).

## Goal
Let homepage visitors search the **planes-for-sale** marketplace from the hero — today the hero only searches partnerships, even though "{make} for sale" is the documented #1 search demand and the homepage is the #1 page.

## Scope
- `src/components/HeroSearch.tsx` only (one client component).
- Add a top-level search-type segmented control: **Partnerships** (current behavior, default) ↔ **Planes for sale** (new).
- "Planes for sale" mode: a single free-text input (make / model / keyword) + Search button → routes to `/aircraft?q=<encoded>` (or `/aircraft` when empty). Plus 2–3 example-query chips that route directly. **No sign-up gate** — `/aircraft` browse is already public.
- Partnerships mode: render exactly the existing UI (airports / radius sub-toggle, sign-up gate, → `/partnerships`). Unchanged.

## Acceptance criteria
- [ ] The hero shows a Partnerships / Planes for sale toggle; Partnerships is selected by default and the existing partnership search works exactly as before (airports + radius sub-modes, gate for logged-out, → `/partnerships?…`).
- [ ] Selecting "Planes for sale" reveals a text input + Search; submitting "Cessna 172" navigates to `/aircraft?q=Cessna%20172` and shows matching for-sale listings (no auth gate).
- [ ] Empty for-sale search routes to `/aircraft`. Example chips route to `/aircraft?q=…`.
- [ ] Works at 375px and desktop 1280 with no horizontal overflow and no app-origin console errors.
- [ ] `next build` + typecheck pass; QA smoke (HTTP 200 / no console errors / no overflow) passes on `/` and `/aircraft`.

## Out of scope
- Real AI/NL parsing (the `[P2]` AI-search item) — this is the honest free-text slice only.
- Airport/geo search for for-sale (for-sale isn't airport-geo-indexed the way partnerships are).
- Any change to `/aircraft`, `/partnerships`, or the gate flow itself.
