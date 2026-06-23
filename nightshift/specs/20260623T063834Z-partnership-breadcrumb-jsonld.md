# Spec — partnership-breadcrumb-jsonld

## Goal
Add BreadcrumbList structured data (rich-results + site-hierarchy signal) to the
partnership make + state programmatic families — priority seed pages #5–#10 — by
replacing their hand-rolled breadcrumb trails with the shared `<Breadcrumbs>`
component that already emits `application/ld+json` BreadcrumbList everywhere else.

## Lane / why
`[goal]` lane (last non-bug cycle `days-on-market-label` pulled `[want]`; no blocker
outstanding). STAGE=INDEXING. The aircraft programmatic families all use the shared
`Breadcrumbs` component (crawlable `<a>` trail **+** BreadcrumbList JSON-LD), but the
partnership make/state families hand-roll a links-only trail with **no** structured
data. Unifying them gives Google a valid BreadcrumbList on the six priority seed
pages (#5 cessna / #6 cirrus / #7 piper make hubs; #8 ca / #9 tx / #10 fl state hubs)
— a leading-indicator win (structured data + consistent internal-link trail), not a
tonight-pageview play.

## Scope (small)
- `src/app/partnerships/make/[make]/page.tsx` — swap hand-rolled `<nav>` breadcrumb
  for `<Breadcrumbs items={[{Home,/},{Partnerships,/partnerships},{<make> name}]} />`.
- `src/app/partnerships/state/[state]/page.tsx` — same swap (current crumb = state name).
- Add the `Breadcrumbs` import to each; drop now-unused `Link` import only if nothing
  else uses it (it's used elsewhere in both — keep).

## Acceptance criteria
- Both pages render a visible breadcrumb trail identical in labels to before
  (Home / Partnerships / {Make|State}), with Home + Partnerships as real links.
- Each page's HTML now contains a `BreadcrumbList` `application/ld+json` block with
  three correctly-ordered `ListItem`s (Home, Partnerships, current) and absolute
  `item` URLs on the two linked crumbs.
- `npx next build` + typecheck pass.
- QA smoke (desktop 1280 + mobile 375) on `/partnerships/make/cessna` and
  `/partnerships/state/ca`: HTTP 200, zero app-origin console errors, no horizontal
  overflow; screenshots look right.

## Out of scope
- The partnership detail (`/partnerships/[id]`) and airport (`/airports/[icao]`)
  pages, which have NO breadcrumb at all — note as the next slice.
- Any content/metadata/layout change beyond the breadcrumb swap.
