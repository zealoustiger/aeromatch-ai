# Damage-history buyer read (Pillar 3 — proprietary buyer analysis)

## Goal
Turn the buried `damage_history` boolean (today shown only as a one-line "Yes / None
reported" spec row) into an honest, structured buyer-analysis panel on the aircraft
detail page that tells a shopper what the flag means and what to ask — never fabricating
a cost or asserting anything beyond what the listing states.

## Why (pillar + friction/value)
Pillar 3 (proprietary, honest buyer analysis). Damage history is one of the top concerns
when buying a used aircraft, yet a non-expert buyer sees only a raw "Yes" with no context.
We already extract the flag; synthesizing it into a calm what-it-means / what-to-ask read
(linked to our own pre-purchase-inspection guide) is value the spec-dump sites don't offer.
Rotation: most recent cycles were P1 (partnership-model-suggestions), P3, P1, P3 — most
recent was P1, so Pillar 3 is due. Pillar 2's headline items (Google OAuth, email-only
form) remain human-blocked behind the frozen `/auth`.

## Scope (small)
- New `src/lib/damageHistory.ts` — pure `computeDamageHistory(damage_history)` →
  result | null (self-suppresses on `null`). Mirrors the `annualStatus.ts` shape.
- New `src/lib/damageHistory.test.ts` — node:test unit tests (suppression + both states).
- `src/app/aircraft/listing/[id]/page.tsx` — compute it, add a `DamageHistoryPanel`
  component (mirroring `AnnualStatusPanel`), render it in the analysis column.

## Acceptance criteria
- [ ] `computeDamageHistory(null)`/`undefined` returns `null` (panel never renders without data).
- [ ] `false` → a "None reported" read; `true` → a "Reported" read; both with honest
      verify-in-logbooks / what-to-ask copy and NO fabricated dollar figure.
- [ ] Panel renders on the detail page only when `damage_history != null`; matches the
      existing `ch-panel` styling and uppercase header pattern of the sibling panels.
- [ ] Panel links to the existing `/guides/aircraft-pre-purchase-inspection` guide.
- [ ] `npx next build` + typecheck pass; the new unit test passes.
- [ ] QA smoke (HTTP 200 / no app console errors / no horizontal overflow at 1280 + 375)
      passes on an affected `/aircraft/listing/[id]` page; screenshots look correct.

## Out of scope
- No change to how `damage_history` is extracted/populated (frozen parser).
- No insurance-premium / repair-cost estimate (would be fabrication — honesty floor).
- The raw spec row stays (the panel complements it; not a rename/removal).
- No other panels, no data-model/migration changes.
