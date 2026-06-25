# Spec: hide-parts-wanted-listings

**UTC:** 2026-06-25T105149Z
**Goal:** Stop parts listings and wanted ads from reaching buyer-facing aircraft surfaces — both at ingest time and on the display layer for existing junk rows.

## Goal
Prevent non-aircraft listings (parts, components, "WANTED" ads) from appearing on buyer-facing pages (`/aircraft` browse, make+model pages, listing detail pages). Slice 1: strengthen the Barnstormers ingest-time filter + add a display-side title guard for existing junk rows (no schema change, no bulk deletes).

## Scope
- `scraper/adapters/barnstormers.mjs` — expand the title exclusion regex; add description-level WANTED/accepting-orders check
- `src/components/AircraftSaleList.tsx` — add narrow `.not('title', 'ilike', ...)` guards to `fetchAircraftPage` suppressing high-confidence junk-title patterns in existing rows

## Acceptance criteria
1. `parseCategory` in `barnstormers.mjs` drops titles containing: `assembly`, `wheel pant(s)`, `wheelpant(s)`, `cowling`, `fairing`, `for parts`, `accepting orders` — in addition to the existing `parts`, `engine only`, `prop only`, `avionics only`, `wanted`
2. `parseCategory` also drops listings whose first ~200 chars of description start with or contain `WANTED`, `WTB`, or `ACCEPTING ORDERS` (case-insensitive), catching wanted ads where the marker is in the body, not the title
3. `fetchAircraftPage` in `AircraftSaleList.tsx` excludes existing DB rows whose title contains (case-insensitive): `wanted`, `wheelpant`, `wheel pant`, or ` assembly` (space + assembly) — so junk already in the DB doesn't reach buyers
4. `npx next build` passes with no TypeScript errors
5. QA smoke: `/aircraft`, `/aircraft/cirrus/sr22`, `/aircraft` pass exit 0 at desktop 1280 + mobile 375 (HTTP 200, no app-origin console errors, no overflow)
6. No legitimate aircraft listings are excluded (false positives audited in QA)

## Out of scope
- Backfill / marking existing junk rows as `status='inactive'` (FREEZE: no bulk destructive ops, and no direct DB connection)
- Display-side guard on count queries (`countMakeModel`, `countForSaleState`) — minor count inaccuracy acceptable; fixing would require touching many queries
- Tightening the AircraftForSale / Hangar67 adapters (they have separate parsing; lower junk rate reported)
- The `[agent]` optional `category` column for bucketing parts (slice 2)
