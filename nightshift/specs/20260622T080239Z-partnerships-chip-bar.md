# Spec — Category quick-filter chip bar on `/partnerships`

**Slug:** `partnerships-chip-bar`
**Lane:** `[want]` — Etsy × Airbnb visual refresh **slice 3** ("category chip bar … at the
top of `/aircraft`, then partnerships"). The `/aircraft` half already shipped
(`AircraftChipBar`, commit 29f13aa); this completes the partnerships half. Owed `[want]`
this cycle: the last non-bug cycle (make-model-overview-prose) pulled `[goal]`.

## Goal
Add an Airbnb-style horizontally-scrolling row of quick-filter "chips" to the top of
`/partnerships` that set the page's existing filter URL params — mirroring the proven
`AircraftChipBar` — so pilots can one-tap-narrow co-ownership search (by make, share type,
budget) without opening the filter sidebar/drawer.

## Scope (small, additive)
- `src/lib/partnershipsQuery.ts` — add `getPartnershipMakes()`: one read-time aggregation
  over active `partnerships.make` (mirrors `getAircraftFacets`'s make logic), returning
  distinct makes ordered by listing count. Mock-data fallback when Supabase is unconfigured.
- `src/components/PartnershipChipBar.tsx` — NEW client component, modeled 1:1 on
  `AircraftChipBar`: make chips (top live makes), share-type chips (`share_type` param),
  price-band chips (`max_monthly` param). Toggling a chip preserves all other active params;
  clicking the active chip clears it. Horizontally-scrolling, 375px-first, sky accent.
- `src/app/partnerships/page.tsx` — fetch makes server-side, render `<PartnershipChipBar>`
  below `PartnershipTabs`, above the filters/list row.

## Acceptance criteria
- [ ] `/partnerships` renders a horizontally-scrolling chip row above the results at desktop
      1280 + mobile 375; no horizontal page overflow at either viewport.
- [ ] Make chips reflect makes that actually have active partnerships (no empty-make chips);
      tapping one sets `?make=…` and the results narrow.
- [ ] Share-type chips set `?share_type=…` and price chips set `?max_monthly=…`, preserving
      any other active filters; tapping an already-active chip clears that param.
- [ ] Chip selections stay in sync with the sidebar filters + the existing
      `PartnershipActiveFilterChips` removable chips (same URL params).
- [ ] `npx next build` + `tsc --noEmit` green (no new errors); QA smoke exit 0; screenshots
      look right (chips on-brand, no overlap/overflow).

## Out of scope
- No new filter params, no schema/DB/SQL, no new dependency or color.
- No changes to the aircraft chip bar or the sidebar filter components.
- No "near me" geolocation chip (the airport filter is free-text ICAO; out of scope here).
- No homepage rails (that's slice 4).
