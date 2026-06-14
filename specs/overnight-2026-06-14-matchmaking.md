# ClubHanger — Overnight Build Spec: Matchmaking & Depth (2026-06-14)

## Context
ClubHanger is a Next.js (App Router) + Supabase two-sided marketplace for aircraft co-ownership/partnerships. It already collects rich structured data on BOTH sides but does not yet *connect* them. This spec turns that data into the core product: matchmaking, trust, and listing depth.

Repo: `/Users/zealoustiger/Dropbox/Code/aeromatch-next` (remote `github.com/zealoustiger/aeromatch-ai`).

**Inspiration:** roomies.com (compatibility matching + verified profiles + new-match alerts), sharemyaircraft.com (cost/earnings calculators, comments/social proof), controller.com (deep specs, photo galleries, similar listings).

## Build order (each is ONE independent PR; do them in this order)
Value-first so a partial night still ships the best work:
1. **TASK-01 — Matching engine + new-match alerts** (hero; zero schema change)
2. **TASK-02 — Pilot profiles + trust** (profiles, self-attested + admin-verifiable badges, listing reviews)
3. **TASK-03 — Financial calculators** (cost + earnings; self-contained)
4. **TASK-04 — Listing depth** (specs/filters, photo gallery, similar listings)

## Global rules (same as the prior fix spec — do not skip)
- ONE branch + ONE PR per task. Branch names: `feat/matching-engine`, `feat/pilot-profiles`, `feat/financial-calculators`, `feat/listing-depth`. Do NOT merge anything.
- Verify against a PRODUCTION build: `npm run build` must pass; when checking UI, use `npm run start` (never `next dev` — Fast Refresh manufactures false bugs). Write screenshots/scratch to `/tmp`, never into the project tree.
- Scope-lock each PR to its task. No dependency bumps, no design-system rewrites, no unrelated refactors.
- **Schema changes:** matching (TASK-01) needs NONE. For tasks that need new tables/columns (TASK-02), write the SQL as a new file under `supabase/migrations/NNNN_<name>.sql` AND append to `supabase/schema.sql` for consistency. Do NOT apply migrations to the production database. The PR body must clearly state "Requires migration X to be applied before this feature works," and the UI/query code must fail soft (empty state, not a crash) if the new tables don't exist yet so `npm run build` and existing pages are unaffected.
- Reuse existing infra: `src/lib/airports.ts` + the `airports` table (has coordinates for ~16,885 airports), `src/lib/supabase-server.ts`, `saved_searches` + `waitlist` tables, the existing magic-link auth and `poster_id` ownership pattern, and the existing design tokens/components (PartnershipCard, SeekerCard, Nav, Footer).
- Each PR body: what & why, the approach, how verified (include build result), schema/migration notes, and any owner decisions needed.
- Final: write `/tmp/clubhanger-overnight-features-summary.md` — per task: branch, PR URL (or why skipped), build status, migration-required flag, open questions.

---

## TASK-01 — Matching engine + new-match alerts (HERO)
**Goal:** Connect the two sides. Given the data already in `partnerships` and `partnership_seekers`, compute a compatibility score and surface matches to both sides, with email alerts on new matches.

**No schema change.** Compute from existing columns only.

### Matching logic (`src/lib/matching.ts`, new)
Score a (seeker S, partnership P) pair 0–100. Split into HARD qualifiers (gate) and SOFT fit (score). Define a pure, unit-testable function `scoreMatch(seeker, partnership, airportCoords): { score: number, qualified: boolean, reasons: string[], blockers: string[] }`.

HARD qualifiers (if any fail, `qualified=false` but still return a score for transparency):
- **Geo:** great-circle distance (haversine) between S.home_airport and P.home_airport (resolve coords via the `airports` table / `airports.ts`) must be ≤ `S.willing_to_travel_nm` (default 50nm if null).
- **Ratings:** `P.ratings_required` ⊆ `S.ratings_held`.
- **Hours:** `S.total_hours >= P.min_hours` (treat null min_hours as 0).

SOFT fit (weighted, sum to 100 among applicable):
- Budget fit (40): each of buy-in/monthly/hourly where `P.value <= S.max_value` scores; partial credit if within 15% over.
- Geo proximity (25): closer = higher within the travel radius.
- Aircraft preference (15): `P.make` ∈ `S.preferred_makes`, model overlap with `S.preferred_models`.
- Share-type preference (10): `P.share_type` ∈ `S.preferred_share_types`.
- Mission/usage alignment (10): overlap heuristic between `S.intended_use` and P description/share_type.

`reasons` = human-readable why-it-matched bullets ("Within 22nm of your home airport", "Buy-in $28k under your $35k max", "You hold IFR as required"). `blockers` = why not qualified.

### Surfaces
- **Seeker → partnerships:** On a seeker's own listing/dashboard and a new route `GET /matches` (auth required), show ranked qualified partnerships with a match % badge and the top 2 `reasons`. Reuse `PartnershipCard`; add a small match-score pill.
- **Owner → seekers:** On a partnership detail page (when viewed by its `poster_id` owner) and on `/matches`, show "N pilots match this listing" with ranked qualified seekers (reuse `SeekerCard` + score pill).
- **Match pill component:** `src/components/MatchScore.tsx` — a compact badge (e.g. "92% match") with an accessible tooltip listing reasons.
- **Homepage hook (logged-out friendly):** if a seeker listing or saved search exists, show "X partnerships match you" CTA.

### Alerts (extend existing infra, don't build new email infra)
- When a new partnership is created that qualifies for existing seekers (or vice versa), queue a "new match" notification. Reuse the `saved_searches`/`waitlist` notification pattern already in the repo. If actual email sending isn't wired, implement the match-detection + a `match_notifications` queue row and log/no-op the send, leaving a clear TODO in the PR for the email provider. Do NOT add a new paid email dependency.

### Acceptance criteria
- `scoreMatch` is pure and covered by a few unit tests (Vitest/Jest if present; otherwise a small `src/lib/matching.test.ts` runnable via `node`/`tsx` — note in PR how to run).
- `/matches` renders ranked, qualified results with score pills and reasons for a signed-in user who has a seeker listing; empty state when none.
- Owner viewing their own partnership sees matching seekers.
- `npm run build` passes; no hydration warnings introduced (use the UTC date helper already added in `utils.ts`).

---

## TASK-02 — Pilot profiles + trust
**Goal (roomies trust model):** a real pilot identity behind listings, plus social proof.

### Data (new — deliver as migration, fail-soft if absent)
- `profiles` table: `user_id` (FK auth.users, PK), `display_name`, `home_airport`, `total_hours`, `ratings_held text[]`, `mission text`, `bio`, `avatar_url`, `verified boolean default false`, `verified_ratings text[]` (admin-set), timestamps.
- `listing_reviews` table: `id`, `target_type` ('partnership'|'seeker'), `target_id`, `author_user_id`, `rating int` (1–5, optional), `body text`, `created_at`, `status` ('visible'|'hidden'). One review per author per target.

### Surfaces
- `GET /pilots/[userId]` public profile page: identity, ratings (verified badge if `verified_ratings` includes it), hours, mission, bio, and their active listings.
- Profile edit at `/profile` (auth): self-attested fields. Verification is admin-only (badge set in `/admin`), never self-granted — make that explicit in UI copy ("Verified by ClubHanger").
- Show author identity + verified badge on listing cards/detail (link to profile).
- **Reviews/comments** (sharemyaircraft social proof): a reviews section on partnership + seeker detail pages; signed-in users can post; owner cannot review their own listing; basic profanity/length guard.

### Acceptance criteria
- Profile view/edit works; verified badge renders only from admin-set `verified_ratings`.
- Reviews post and render; self-review blocked; empty state present.
- Migration file present + schema.sql updated; pages fail soft if tables missing; `npm run build` passes.

---

## TASK-03 — Financial calculators
**Goal (sharemyaircraft):** decision tools that double as SEO/lead-gen. No schema change.

- **Cost Calculator** `/tools/cost-calculator`: inputs buy-in, monthly fixed, hourly wet, hours/month, share fraction → outputs all-in monthly cost, annual cost, true cost/hour, and cost vs. renting/full ownership comparison. Embed a compact version on partnership detail pages prefilled from that listing's numbers.
- **Earnings Calculator** `/tools/earnings-calculator`: for owners — inputs aircraft fixed costs, expected hours rented/shared, share price → outputs expected monthly offset/earnings and break-even. Embed a compact version on the post-partnership flow.
- Standalone pages get proper SEO metadata (reuse `src/lib/seo.ts`) and a footer link under a new "Tools" group.

### Acceptance criteria
- Both calculators compute correctly (include a couple of worked examples in the PR), are mobile-friendly, embedded variants prefilled from listing data, `npm run build` passes.

---

## TASK-04 — Listing depth
**Goal (controller.com):** make listings feel substantial.

- **Photo gallery on detail pages:** render `partnerships.images[]` (already in schema) as a gallery with a lightbox; graceful placeholder when empty (coordinate with whatever the prior fix-run decided for ISSUE-004 — do not fight it).
- **Richer specs + filters:** surface/parse additional spec fields where available (TTAF/SMOH/avionics/useful load) for `aircraft_for_sale`; add corresponding filters to the existing `PartnershipFilters` where the data exists. Only add filters backed by real data.
- **"Similar listings" module** on detail pages: same make or same home-airport region, ranked, excluding the current listing.

### Acceptance criteria
- Gallery renders from `images[]` with lightbox + placeholder fallback; similar-listings module returns sensible results; new filters work and don't break existing query params; `npm run build` passes.

---

## Notes for the owner (morning review)
- TASK-01 ships without any DB change — safe to merge first.
- TASK-02 ships a migration you must review + apply before profiles/reviews go live.
- Email sending for match alerts is intentionally stubbed (no new paid dependency) — decide the email provider separately.
