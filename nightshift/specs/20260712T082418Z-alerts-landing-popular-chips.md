# alerts-landing-popular-chips

## Goal
Honesty-gate the `/alerts` landing page's hardcoded "popular" interest chips (Cessna 172,
Cirrus SR22, etc.) against real live listing counts so a visitor never one-taps into an
alert that can never fire, and tag conversions from those specific chips distinctly from
the generic marketplace-type chips.

## Scope
- `src/app/alerts/page.tsx` — becomes an async server component; computes live match
  counts (via the existing `getAlertMatchCount` from `src/lib/alertMatchCounts.ts`) for a
  small curated candidate list (Cessna 172, Cirrus SR22, Piper Cherokee, Beechcraft
  Bonanza, Partnerships in California), drops any candidate with 0 live matches, passes
  the survivors as a `popularChips` prop.
- `src/components/AlertsLanding.tsx` — accepts `popularChips` prop; renders the 3 existing
  catch-all chips (All aircraft for sale / Partnership shares / Pilots seeking a
  partnership, unchanged, source `alerts_landing`) plus the server-verified popular chips
  interleaved, each tagged `source: 'alerts_landing_popular'` on its `AlertSignup` so
  conversions from this specific placement are distinguishable in PostHog from the
  broad/default chips.
- No schema change, no new server action — reuses `getAlertMatchCount` (already used by
  `/alerts/manage`) and the existing `AlertSignup`'s `source` prop (already threaded end to
  end by `alert-source-placement-tag`).

## Acceptance criteria
- `/alerts` renders with no console errors at desktop 1280 + mobile 375.
- A curated chip (e.g. Cessna 172) only appears when a live server-side count confirms
  >0 active matching listings/partnerships; if a candidate has 0 live matches it is
  silently omitted (no dead-end chip).
- Selecting a popular chip still one-tap prefills `AlertSignup`'s context/sourcePath
  exactly as the existing catch-all chips do (no new interaction pattern).
- Submitting an alert from a popular chip fires `alert_subscribed` with
  `source: 'alerts_landing_popular'`; submitting from a catch-all chip still fires with
  `source: 'alerts_landing'` (unchanged).
- `npx next build` + `tsc --noEmit` clean.
- `qa-smoke.mjs` passes on `/alerts` at desktop 1280 + mobile 375 (HTTP 200, 0 app-console
  errors, 0 horizontal overflow).

## Out of scope
- Changing the 3 existing catch-all chips' behavior/labels.
- Any change to `/alerts/manage`, the digest cron, or other alert surfaces.
- Adding more than one new candidate chip type (partnerships-in-CA) beyond honesty-gating
  the pre-existing 4 make/model chips.
