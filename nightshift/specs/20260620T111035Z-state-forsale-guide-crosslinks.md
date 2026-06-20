# state-forsale-guide-crosslinks

UTC: 2026-06-20T11:10:35Z
Lane: [goal] — SEO internal linking graph (deliberate fall-through; prior non-bug
cycle `forsale-guide-crosslinks` was [goal], [want] lane blocked this run).
Scoreboard at orient: 61 pageviews/7d.

## Goal

Extend the existing tasteful sky-blue "Buying a plane?" related-guides cross-link
block to the third and final for-sale surface — the by-state for-sale pages
`/aircraft/for-sale/[state]` — completing the internal-linking story across all
three for-sale surfaces (`/aircraft`, `/aircraft/[make]/[model]`, and now
by-state).

## Scope (small — reuse, do not rebuild)

- REUSE the existing `src/components/ForSaleGuideLinks.tsx` AS-IS (no fork, no
  restyle; sky-blue accent only).
- EDIT `src/app/aircraft/for-sale/[state]/page.tsx` — import and render
  `<ForSaleGuideLinks className="mt-4" />` once, placed consistently with the
  other two surfaces (immediately after the existing "Aircraft for sale in other
  states" cross-links rail).

## Acceptance criteria (QA grades against these)

1. The "Buying a plane?" block renders on a real by-state page that has listings
   (e.g. `/aircraft/for-sale/california`) at desktop (1280) and 375px mobile.
2. The three linked guide routes resolve HTTP 200:
   `/guides/aircraft-pre-purchase-inspection`,
   `/guides/cost-of-aircraft-co-ownership`, `/guides`.
3. No horizontal overflow at 375px on the state page.
4. No new console / hydration errors on the state page (production build, desktop
   + 375px).
5. `npx next build` green and `npx tsc --noEmit` shows only the 3 pre-existing
   `.test.ts` baseline errors — no NEW errors in touched files.
6. Sky-blue accent only — no emerald, no new palette (component reused unchanged).

## Out of scope

- Do NOT touch `/aircraft` or `/aircraft/[make]/[model]` pages again.
- Do NOT modify `ForSaleGuideLinks.tsx` styling.
- NO new pages, NO schema/DB/SQL change.
