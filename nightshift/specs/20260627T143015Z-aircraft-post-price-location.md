# Spec: aircraft-post-price-location

**UTC:** 2026-06-27T143015Z  
**Pillar:** Posting (Pillar 1) — surface the irreducible field set  
**Slug:** aircraft-post-price-location

## Goal
Move Asking Price and Based-at Airport out of the collapsed "More details" accordion on `/aircraft/new` and into the always-visible "The basics" section alongside Make and Model. Currently a seller who uses N-number autofill gets Make/Model/Year filled in — but Price and Location remain hidden below the fold, so many listings ship without them.

## Scope
- `src/components/PostAircraftForm.tsx` — move two field groups (price + airport) from the `<details>` block to the `<section>` "The basics" block.

## Acceptance criteria
1. `/aircraft/new` returns HTTP 200 at desktop 1280 and mobile 375 with zero app-origin console errors and zero horizontal overflow.
2. The always-visible "The basics" card shows N-number, Make, Model, **Asking Price**, and **Based at (airport)** — all visible without opening any accordion.
3. The "More details" collapsible retains Year, TTAF/SMOH, Title, Description, and Photos — no field is lost.
4. Asking Price and Based-at airport do NOT appear in both sections (no duplication).
5. N-number autofill (blur → FAA lookup → fills Make/Model/Year) still works correctly.
6. AI prefill ("Prefill from your notes ✨") still fills price, airport, title, description correctly via `fillFormField`.
7. Build compiles cleanly (`npx next build`, zero TypeScript errors).

## Out of scope
- Making "Asking Price" required (keep optional).
- Schema changes.
- Changes to `createAircraftListing` action.
- Changes to the partnership or seeking forms.
- Changes to the listing detail page.
