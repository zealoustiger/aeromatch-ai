# Spec — footer-browse-hubs

## Goal
Surface the two crawlable "browse all" hub pages (`/aircraft/browse`,
`/partnerships/browse`) in the global site footer so every page on the site links to
them in one hop — giving Google a sitewide one-hop crawl path to the hubs that, in
turn, link every live programmatic page (internal linking is the #2 INDEXING-stage
lever after backlinks).

## Lane
`[goal]` — internal-linking / crawl-reachability while STAGE=INDEXING. Last non-bug
cycle (cross-sell-live-count) was `[want]`, so `[goal]` is owed per the 1:1. This is a
repeatedly-noted open follow-up ("surfacing the /aircraft/browse + /partnerships/browse
hubs in the global footer for sitewide crawl reachability").

## Scope
- `src/components/Footer.tsx` — add the two browse-hub links to the existing `Explore`
  list. One file, presentational/link-only.

## Acceptance criteria
- The footer (which renders on every page) contains a link to `/aircraft/browse` and a
  link to `/partnerships/browse`, with clear distinct labels.
- Both hub pages still return HTTP 200 and are reachable from the footer on an unrelated
  page (e.g. `/`).
- No layout regression: footer renders cleanly at desktop 1280 + mobile 375, zero
  horizontal overflow, zero app-origin console errors.
- `npx next build` + typecheck green.
- No new component/color/dependency; no schema/DB/SQL; no FREEZE file touched.

## Out of scope
- Changing the hub pages themselves, the sitemap, or any other footer column.
- New footer styling/redesign.
