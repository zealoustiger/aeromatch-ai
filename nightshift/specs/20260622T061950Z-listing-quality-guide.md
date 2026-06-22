# Spec — Listing-quality / trust badge legend page + badge links

**Slug:** listing-quality-guide
**Lane:** [want] — "Explain the trust/quality badges" ([P2][want], "Trust signals" section).
Owed this cycle: the last non-bug cycle (`forsale-state-faq`) was [goal], so [want] is up.
The human flagged this directly: *"The bare 'B' badge is unclear — hover tooltips per
badge + a 'what do these mean?' legend page linked from listings."*

## Goal
Make the listing-quality grade (A/B/C) and the trust-signal badges self-explanatory:
add a genuinely useful, indexable `/listing-quality` legend page that explains both
systems, and link the badges to it so the meaning is discoverable — including on mobile,
where the grade chip's only current explanation (a desktop `title` tooltip) never shows.

## Scope (small, additive)
- **New page** `src/app/listing-quality/page.tsx` (route `/listing-quality`):
  - Full metadata (title/description/self-canonical/OpenGraph/twitter), `Breadcrumbs`
    (Home › Listing quality), mobile-first, existing sky accent + `ch-surface`/`ch-panel`
    tokens. No new color/dependency.
  - **Listing quality grade (A/B/C)** section — three grade cards built from
    `gradeMeta('A'|'B'|'C')` (single source of truth) + the completeness signals from
    `QUALITY_SIGNALS` (label + points). Honest framing: it measures listing *completeness*,
    not aircraft condition or whether the price is fair.
  - **Trust signals** section — partnership signals (`TRUST_SIGNALS`) + aircraft-for-sale
    signals (`AIRCRAFT_TRUST_SIGNALS`), each label + "why it matters" hint, read straight
    from those tables so the page can never drift from the badges.
  - A short "for sellers — how to earn a higher grade" note linking to `/partnerships/new`.
  - A small FAQ block (`ModelFaq`) + `FAQPage` JSON-LD (`buildFaqPageJsonLd`) with 3
    genuine evergreen Q&As — visible answers == JSON-LD 1:1 (rich-result eligibility).
- **Link the badges to it (discoverability incl. mobile):**
  - `AircraftSaleCard.tsx` — wrap the grade chip in a `Link` to `/listing-quality`;
    tooltip becomes `"{Grade X} — {blurb}. What do these badges mean?"` + `aria-label`.
  - `TrustBadge.tsx` (checklist variant, partnership detail) — add a footer
    "What do these mean? →" link to `/listing-quality`.
  - `Footer.tsx` — add a "What the badges mean" link under the Guides group (sitewide,
    crawlable internal link).

## Acceptance criteria
1. `/listing-quality` returns HTTP 200 and renders the grade (A/B/C) explanation, both
   trust-signal sets, and the FAQ — content read from the existing signal tables.
2. Page carries a self-canonical (`/listing-quality`), OpenGraph, breadcrumb trail +
   BreadcrumbList JSON-LD, and exactly one valid `FAQPage` block whose answers appear
   verbatim in the visible DOM.
3. On `/aircraft`, the grade chip is now a link to `/listing-quality` with a descriptive
   tooltip + aria-label; the rest of the card is unchanged.
4. The partnership detail trust checklist and the site footer each link to
   `/listing-quality`.
5. QA smoke PASS (exit 0) at desktop 1280 + mobile 375 on `/listing-quality` and
   `/aircraft`: HTTP 200, zero app-origin console errors, zero horizontal overflow;
   screenshots look right.

## Out of scope
- No ranking/scoring changes (trust + grade scoring untouched).
- No schema/DB/SQL, no new dependency, no new color.
- No changes to how badges are computed; this is explanation + linking only.
- Not per-card link sprawl beyond the single grade chip; trust chips keep their tooltip.
