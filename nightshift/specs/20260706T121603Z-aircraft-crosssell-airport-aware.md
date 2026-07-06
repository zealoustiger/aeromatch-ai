# aircraft-crosssell-airport-aware

## Tier
`[P2][want]` (BACKLOG.md "Cross-link aircraft search → partnerships") — human-inputted, outranks `[goal]` work per GOAL.md's strict cascade.

## Goal
Make the existing `/aircraft` → partnerships cross-sell card location-aware, not just make-aware, so a visitor searching aircraft near a specific airport sees a partnership count/samples/link scoped to that same airport (not the whole country) — the exact ask in the backlog item: "N {make} partnerships are available near {airport}."

## Context
`MarketplaceCrossSell` (`src/components/MarketplaceCrossSell.tsx`), wired at `src/app/aircraft/page.tsx:352-358`, already renders a make-aware cross-sell banner ("Want to split the cost? See N {make} co-ownership partnerships…") below the aircraft results. It ignores the visitor's active `airport` filter entirely — a search for `Cessna` near `KAUS` shows the nationwide Cessna-partnership count, not the local one. `getPartnershipListings` (`src/lib/partnershipsQuery.ts`) already supports combined `make` + `airport` + `radius` filtering (via the existing `resolveAirportList` radius expansion), but `countActivePartnerships` is make-only.

## Scope
- `src/lib/partnershipsQuery.ts`: export `resolveAirportList`; extend `countActivePartnerships` to accept an optional `{ airport?: string; radius?: string }` second argument and apply the same airport-list filter `getPartnershipListings` uses (both the live-Supabase path and the mock-data fallback).
- `src/components/MarketplaceCrossSell.tsx`: add an optional `nearAirport?: string` prop. When set: (a) append "near {ICAO}" to the body copy, (b) add `airport=<ICAO>&radius=100` to the cross-link href alongside any `make` param.
- `src/app/aircraft/page.tsx`: pass `params.airport` through as `nearAirport`, and pass `{ airport: params.airport, radius: params.airport ? '100' : undefined }` into both the `countActivePartnerships` and `getPartnershipListings` calls feeding the cross-sell card.
- No schema change. No change to `/partnerships` → aircraft direction's default behavior (that direction still isn't airport-filtered from partnerships' own airport filter — out of scope, see below).

## Acceptance criteria
- `/aircraft?make=Cessna` (no airport) renders identically to today (nationwide count/samples/link) — no regression.
- `/aircraft?make=Cessna&airport=KAUS` (or any airport with nearby partnership inventory) shows a partnership count narrowed to within 100mi of KAUS, with "near KAUS" in the body copy, and the CTA link carries `?make=Cessna&airport=KAUS&radius=100` through to `/partnerships`.
- `/aircraft?airport=KAUS` (no make) still shows the airport-scoped count/copy without a make term.
- `npx tsc --noEmit` and `npx next build` pass clean.
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) at desktop 1280 + mobile 375 on `/aircraft`, `/aircraft?make=Cessna`, `/aircraft?make=Cessna&airport=KAUS`.

## Out of scope
- The reverse direction (`/partnerships` → aircraft cross-sell airport-awareness) — same card component, different call site; a natural follow-up slice, not required by this backlog line which is specifically "aircraft search → partnerships."
- The "Dynamic-location seed seeking personas" `[want]` item — separate backlog line, not touched this cycle.
- Adding a human-friendly airport name (e.g. "near Austin, TX") instead of the raw ICAO — the raw code matches the backlog's literal "near {airport}" phrasing and avoids an extra DB round-trip/latency in a component already on the critical results-page render path.
