# Curate Diamond DA42 + DA20 model pages

## Goal
Upgrade the Diamond **DA42** (twin) and **DA20** (trainer) `/aircraft/[make]/[model]`
pages from thin auto-generated count-only pages to fully curated, uniquely-valuable
indexable pages — mirroring the `model-curate-diamond-da40` cycle (the explicit "Next"
it queued). Closes the Diamond family curation (DA40 done; DA42 + DA20 are the remaining
high-inventory Diamond models).

## Scope
- `src/lib/seo.ts` ONLY:
  - Add two `SEO_MAKE_MODELS` entries (`diamond/da42`, `diamond/da20`) with `specs` +
    `costToOwn` blurbs.
  - Add `MODEL_FAQS`, `MODEL_OVERVIEWS`, `MODEL_SPECS`, `MODEL_HIGHLIGHTS` entries for
    both, keyed `diamond/da42` and `diamond/da20`.
- No route, component, schema, or DB change. Pure curated-data addition (same shape the
  page already renders for DA40).

## Acceptance criteria
- `/aircraft/diamond/da42` renders: key-specs table, "What's different" highlights,
  3-question FAQ (visible + FAQPage JSON-LD 1:1), "About" prose — all genuine, well-known
  facts (no fabricated figures), built around its real live inventory.
- `/aircraft/diamond/da20` renders the same curated sections, likewise from genuine facts.
- Both pages keep their existing real listings (DA42 ≥7 active, DA20 ≥5 active confirmed)
  and unique `generateMetadata` (canonical/OG); web addresses unchanged → no duplicate URL.
- `npx next build` + typecheck green.
- QA smoke exit 0 on both routes at desktop 1280 + mobile 375 (HTTP 200, zero app console
  errors, zero horizontal overflow); screenshots look right.

## Out of scope
- Other Diamond models (DA62, DA50, HK36) — lower/no inventory; not this cycle.
- Any change to the model page route/template, comparisons, or sitemap logic (the entries
  flow into existing prebuild + cross-link rails automatically).
- DB casing normalization of stored Diamond model variants.
