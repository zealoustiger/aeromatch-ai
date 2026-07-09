# seeker-crosssell-detail-pages

## Goal
Add the missing third leg of the "blend result types + cross-sell" backlog item
([P2][want], BACKLOG.md line ~1333): surface real pilots-seeking-a-partnership demand
on both the aircraft-for-sale detail page and the partnership detail page, so a visitor
sees all three marketplace types (for sale / partnerships / pilots seeking), not just two.

## Scope
- `src/lib/seekersQuery.ts` — new `getSeekerCrossSell(make, model?)` read-only query:
  active `partnership_seekers` whose `preferred_makes` includes `make` (case-insensitive),
  optionally narrowed to `model`-level matches via the existing `matchesModelFilter`
  helper (mirrors `getForSaleCrossSell`'s make→model-level fallback shape). Returns
  `{ count, modelLevel, samples }` (up to 3 samples, trust-ranked) or `null` when there
  are no matching active seekers (self-suppress).
- `src/app/aircraft/listing/[id]/page.tsx` — call `getSeekerCrossSell(p.make, p.model)`,
  render a new visitor-facing `SeekerCrossSellPanel` ("N pilots are looking to co-own a
  {label}") next to the existing `PartnershipCrossSellPanel`, linking to
  `/partnerships/seeking?make=…[&model=…]`, with a `SeekerRailCard` mini-rail of samples.
- `src/app/partnerships/[id]/page.tsx` — same query/panel, framed as "N other pilots are
  also looking for a {label} share," next to the existing `ForSaleCrossSellPanel`. This
  is distinct from the existing owner-only `MatchCountNudge` (which only the listing's
  owner sees) — the new panel is visible to every visitor, same as the other two
  cross-sell panels.
- Reuses `SeekerRailCard` (already built for `SimilarSeekers`), no new component library.

## Acceptance criteria
- `/aircraft/listing/[id]` for a listing whose make has ≥1 active matching seeker shows
  the new panel with an honest count + up to 3 real sample seeker cards + a working link
  to `/partnerships/seeking?make=…`.
- `/partnerships/[id]` shows the equivalent panel under the same conditions.
- Panel is fully absent (no empty box) when there are 0 matching active seekers for that
  make — verified against real DB counts, not assumed.
- No new dependency, no schema/DB change, no change to the existing owner-only
  `MatchCountNudge`.
- `next build` + `tsc --noEmit` clean; QA smoke passes (HTTP 200 / no console errors / no
  overflow) at desktop 1280 + mobile 375 on both affected detail pages.

## Out of scope
- Browse/search-results pages (`/aircraft`, `/partnerships`) — this slice is detail pages
  only, matching how the first two cross-sell directions were rolled out incrementally.
- Any change to the seeker detail page (`/partnerships/seeking/[id]`) itself.
- Any change to `MatchCountNudge` / the owner-only matching engine.
