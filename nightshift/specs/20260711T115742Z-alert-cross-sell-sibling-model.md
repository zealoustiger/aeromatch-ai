# alert-cross-sell-sibling-model

## Goal
On `/alerts/status`, after confirming an aircraft alert for a model with a curated
"step-up" sibling (e.g. Cessna 172 → 182), suggest that sibling model instead of
the generic same-make counterpart cross-sell — a more specific, higher-value
one-click alert.

## Scope
- `src/lib/alertCrossSell.ts` — parse `model` off the confirmed alert's
  query-string `source_path`; add a small curated `SIBLING_MODELS` map keyed by
  `resolveMakeModelFamily`'s `makeSlug/modelSlug`; `getCrossSellSuggestion` tries
  the sibling-model suggestion first (aircraft alerts with a mapped model), falls
  back to the existing make-counterpart (aircraft ↔ partnerships) suggestion
  otherwise. No change to `partnership`/`seeker` branches.
- No changes to `AlertCrossSell.tsx`, `/alerts/status/page.tsx`, or
  `subscribeToConfirmedAlert` — the existing one-click accept/dismiss UI and
  action already handle any `{context, sourcePath, noun, label}` suggestion.

## Acceptance criteria
- Confirming a `/aircraft?make=Cessna&model=172` alert now offers "Also want
  alerts for the Cessna 182?" (sourcePath `/aircraft/cessna/182`) instead of the
  generic partnerships counterpart.
- Confirming a `/aircraft?make=Cirrus&model=SR20` alert offers the SR22 sibling.
- Confirming an aircraft alert with a model that has NO curated sibling (e.g.
  Cessna 150) falls back to the existing "Also want alerts for {make}
  co-ownership partnerships?" suggestion — unchanged from today.
- Confirming an aircraft alert with no `model` at all keeps today's
  make-counterpart behavior — unchanged.
- Partnership-alert confirmations keep suggesting the aircraft counterpart —
  unchanged.
- One-click accept still creates a `status='confirmed'` alert for the same email
  and fires `alert_subscribed` with `source: 'cross_sell'` (existing action/UI,
  untouched).
- `npx next build` + typecheck pass; `/alerts/status` smoke-tests clean.

## Out of scope
- Showing multiple simultaneous suggestions.
- The other deferred suggestion type ("nearby state").
- Normalizing/expanding the sibling map beyond a small, defensible curated set.
