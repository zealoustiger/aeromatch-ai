# Spec: searches-page-seeker-label

**Goal:** Make the Saved Searches page correctly label and describe seeker searches — currently they show as "Partnerships" with a partnership-flavored description, which is misleading.

**Background:** The `seeker-save-search` cycle added SaveSearchButton to `/partnerships/seeking` with seeker-specific auto-naming. But `/searches/page.tsx` was not updated: its `marketplaceLabel()` returns "Partnerships" for any non-aircraft path (including `/partnerships/seeking`), and `describeSearch()` calls `describePartnershipSearch` for seeker searches — which reads `airports`, `make`, `share_type`, `max_monthly`, `max_buyin` but not the seeker-specific params (`rating`, `min_hours`).

**Scope:**
- `src/app/searches/page.tsx` only (1 file)

**Acceptance criteria:**
1. A saved search with `path = '/partnerships/seeking'` shows the badge **"Pilot Seekers"** (not "Partnerships").
2. A saved search with `path = '/aircraft'` still shows "Planes for Sale".
3. A saved search with `path = '/partnerships'` (or null/legacy) still shows "Partnerships".
4. The description line for a seeker search reads seeker params: airports → "near KPAO", make → "Cessna seekers", ratings → "PPL,IFR", min_hours → "250+ hrs". Falls back to "All seeker listings" when no filters set.
5. The "View" link for seeker searches opens `/partnerships/seeking?…` (already works — `s.path` is used; verify it's correct).
6. `next build` + typecheck pass clean.
7. Smoke: `/searches` returns HTTP 200 / no errors / no overflow at desktop + mobile.

**Out of scope:**
- Adding a description for the `/partnerships/seeking` path in `autoNameSearch` (already done in `savedSearchName.ts`).
- Updating any database schema.
- Any change to `/account` or the seeker browse page.
