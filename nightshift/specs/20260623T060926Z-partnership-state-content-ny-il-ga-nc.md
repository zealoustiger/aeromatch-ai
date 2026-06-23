# Spec — partnership-state content parity: NY / IL / GA / NC

## Goal
Bring four more `/partnerships/state/{ny,il,ga,nc}` pages to content parity with the
for-sale state set by adding curated, co-ownership-focused overview prose + FAQs, so each
opens with genuinely-unique editorial depth instead of templated count-only boilerplate.

## Lane / why
- **[goal]** lane (last non-bug cycle `model-spec-tables` pulled [want]; no blocker).
- STAGE=INDEXING → lift existing programmatic hubs above thin boilerplate with real,
  unique, evergreen content (anti-thin-page leading-indicator win). NOT a tonight-pageview play.
- The `forsale-state-content-ny-il-ga-nc` cycle's explicit "Next" line: "bring the
  partnership-state set back to parity (add NY/IL/GA/NC to PARTNERSHIP_STATE_OVERVIEWS/FAQS)".
- Partnership-state content set is currently ca/tx/fl/az/co/wa; the for-sale set already
  added ny/il/ga/nc. This closes that gap.

## Scope (one file)
- `src/lib/seo.ts` — add `ny`, `il`, `ga`, `nc` entries to:
  - `PARTNERSHIP_STATE_OVERVIEWS` (2 narrative paragraphs each, co-ownership framing)
  - `PARTNERSHIP_STATE_FAQS` (3 Q&A each, co-ownership framing)
- No route/component change — `/partnerships/state/[state]/page.tsx` already conditionally
  renders both blocks (and the FAQPage JSON-LD) for any curated state.

## Acceptance criteria
- `/partnerships/state/{ny,il,ga,nc}` each render the "Co-owning an aircraft in {State}"
  overview (2 paragraphs) AND a 3-question co-ownership FAQ.
- Visible FAQ answers match the FAQPage JSON-LD 1:1 (3 Questions each) on those pages.
- Content is **co-ownership-focused** and **distinct in wording** from the for-sale
  `FORSALE_STATE_*` set for the same states (no near-duplicate; GOAL.md no-thin-page rule).
- No fabricated statistics, no live counts — evergreen, well-known GA facts only.
- A non-curated control state (e.g. `/partnerships/state/oh`) still renders NO overview/FAQ.
- `next build` + typecheck green; qa-smoke exit 0 (HTTP 200, zero app console errors, zero
  horizontal overflow) at desktop 1280 + mobile 375 on the four pages.

## Out of scope
- No new states beyond ny/il/ga/nc; no make/model/intersection content.
- No route, layout, component, schema/DB/SQL, or metadata-structure changes.
- No changes to the existing ca/tx/fl/az/co/wa entries.
