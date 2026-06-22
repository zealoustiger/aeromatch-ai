# Per-state FAQ blocks + FAQPage JSON-LD on partnership state pages

**Slug:** partnership-state-faq
**Lane:** [goal] (owed — last non-bug cycle `aircraft-filter-chips` was [want]). STAGE=INDEXING.

## Goal
Give the partnership-by-state hub pages `/partnerships/state/[state]` genuinely
unique, evergreen content + FAQPage structured data — extending the proven FAQ
pattern (per-model → per-make for-sale → partnership-make) to the state level,
covering the priority index pages #8/#9/#10 (`ca`, `tx`, `fl`).

## Scope (small, additive)
- `src/lib/seo.ts` — add a `PARTNERSHIP_STATE_FAQS` map keyed by **lowercase USPS
  code** (mirrors `PARTNERSHIP_MAKE_FAQS`) + a `getPartnershipStateFaqs(code)` helper.
  Curate a set of high-GA-activity states with genuinely state-specific co-ownership
  Q&As: **CA, TX, FL** (priority) + AZ, CO, WA (distinctive GA states). 3 Q&As each.
- `src/app/partnerships/state/[state]/page.tsx` — import `getPartnershipStateFaqs`
  + `buildFaqPageJsonLd` + `ModelFaq`; emit FAQPage JSON-LD `<script>` and render
  `<ModelFaq>` below the listings / above cross-links, **only when curated**.

## Acceptance criteria
- Curated states (`/partnerships/state/ca`, `/tx`, `/fl`) render a visible 3-Q&A FAQ
  accordion AND emit exactly one valid `FAQPage` JSON-LD whose answers match the
  visible DOM 1:1 (Google parity).
- A non-curated state (e.g. `/partnerships/state/wy`) returns 200 with NO FAQ and is
  otherwise unchanged.
- Content is genuinely state-specific + evergreen — no fabricated stats, no live counts.
- `next build` + typecheck green; QA smoke exit 0 at desktop 1280 + mobile 375 on the
  3 priority states (HTTP 200, zero app console errors, zero horizontal overflow).
- No new component (reuse `ModelFaq`), no new color, no new dependency, NO schema/DB/SQL.

## Out of scope
- All 50 states (templated boilerplate = GOAL.md guardrail violation). Curated only.
- Per-state aircraft FAQ variants (`/aircraft/for-sale/[state]`) — a later cycle.
- Any change to listings, query, layout, or other page families.
