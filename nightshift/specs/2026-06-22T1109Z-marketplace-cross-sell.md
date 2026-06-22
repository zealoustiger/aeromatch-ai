# Spec — Marketplace cross-sell (Blend result types, slice 1)

**Lane:** `[want]` (last non-bug cycle `partnership-state-overview-prose` was `[goal]` PASS,
no blocker → `[want]` owed per the 1:1). Item: `[P2][want] Blend result types + cross-sell`
(Search results UX, BACKLOG). This is **slice 1** — a contextual cross-sell card between the
two marketplaces. The full "blend results / side panel with live results" is a later slice.

## Goal
On each of the two main results pages, add one tasteful, make-aware cross-sell card pointing
to the *other* marketplace type (partnerships ↔ planes-for-sale), so a visitor who wants the
other ownership model finds it — and so crawlers get one more internal link between the two
biggest hubs (a small INDEXING-stage win on top of the product value).

## Scope (small)
- New `src/components/MarketplaceCrossSell.tsx` — a single reusable, make-aware card.
  - `from="partnerships"` → promotes **buying outright** → `/aircraft` (carries `?make=` when set).
  - `from="aircraft"` → promotes **co-ownership** → `/partnerships` (carries `?make=` when set).
- Render it at the bottom of the listings column on `src/app/partnerships/page.tsx` and
  `src/app/aircraft/page.tsx`, passing the active `make` param through.

## Acceptance criteria
- `/partnerships` shows a card linking to `/aircraft`; with `?make=Cirrus` the card links to
  `/aircraft?make=Cirrus` and the copy names the make.
- `/aircraft` shows a card linking to `/partnerships`; with `?make=Cessna` the card links to
  `/partnerships?make=Cessna` and the copy names the make.
- Real data / links only — no live counts, no fabricated figures (slice 1 keeps it static).
- Both pages: HTTP 200, zero app-origin console errors, zero horizontal overflow at 1280 + 375.
- Card is reversible/additive — nothing else on either page changes.

## Out of scope
- Live counts of the other type, blended/interleaved result lists, a sticky side panel,
  the "pilots" third type, and any backend/DB/query change.
