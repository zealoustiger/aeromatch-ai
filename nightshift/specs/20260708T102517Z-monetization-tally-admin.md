# monetization-tally-admin

## Goal
Give the human a real, honest readout of which "coming soon" revenue-path CTA
(`MonetizationIntent`, 7 placements shipped across the last 3 cycles) is getting the
most opt-in interest, so they can pick which business model to actually build —
closing slice 4 of the "Monetization — intent signals" backlog item.

## Scope
- New `src/lib/monetizationTally.ts`: a `MONETIZATION_PATHS` map (the 7 known `path`
  values → human-readable label) and `getMonetizationTally()` — queries the existing
  `waitlist` table (admin/service-role client, same pattern as `bayAreaCoverage.ts`),
  groups rows by `source` restricted to the known monetization paths, returns counts
  sorted descending + a total.
- New `src/app/admin/monetization/page.tsx` — admin-only page (reuses the existing
  `AdminLayout` auth gate, untouched) rendering a simple bar-style list: path label,
  count, share of total. Honest framing: this counts **email opt-ins from the modal**
  (the only server-queryable signal), NOT raw "coming soon" button clicks — the modal
  open itself fires a `monetization_intent` PostHog event we don't query here. Say so
  explicitly in the copy so the human doesn't over-read the numbers.
- New tab entry in `src/components/AdminTabs.tsx` ("Revenue Signals" or similar, MapPin
  or DollarSign icon).

## Acceptance criteria
- `/admin/monetization` renders for a signed-in admin, shows one row per known
  monetization `path` (broker, financing, insurance, escrow, prebuy,
  partnership_formation, co_ownership_management) with a real count from `waitlist`,
  sorted highest first, with a % share.
- Zero-state (no opt-ins yet for a path) renders "0", not hidden — no fabricated
  numbers.
- Page explicitly states the number is opt-ins, not raw clicks (honesty guardrail).
- New admin tab links to the page and highlights when active, matching existing tabs.
- `npx tsc --noEmit` and `npx next build` both pass.
- QA smoke (desktop 1280 + mobile 375) on `/admin/monetization`: HTTP 200 (as an
  authed admin — smoke test note: page redirects to sign-in when logged out, which is
  expected/correct, not a failure), zero console errors, zero horizontal overflow.

## Out of scope
- Querying PostHog directly for real click-through counts (would need a new PostHog
  server API integration/secret — separate, larger piece).
- Any change to admin auth/gating logic (`getAdminEmail`, `src/app/admin/layout.tsx`'s
  auth check) — untouched, per FREEZE.md.
- The still-open "seller upgrade CTAs" (Feature this listing / Get it vetted) in the
  post-listing flow — a separate placement, left for a follow-up cycle.
