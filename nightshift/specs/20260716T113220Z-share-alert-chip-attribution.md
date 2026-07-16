# share-alert-chip-attribution

## Goal
Complete shared-alert attribution so a visitor who arrives via a `?share=alert` link and
subscribes through `AlertMeChip` (filter-toolbar chip) or `MobileStickyAlertBar` (mobile
sticky bar) is tagged `source: 'shared_alert'` in analytics/DB, matching what the footer
`AlertSignup` already does — instead of being silently bucketed under `filter_toolbar` /
`sticky_bar` like an ordinary, unattributed conversion.

## Scope
- `src/components/AlertMeChip.tsx`
- `src/components/MobileStickyAlertBar.tsx`

Both already import `subscribeToAlerts`/`subscribeSignedInAlert`/`track`; reuse the same
client-side detection pattern `AlertSignup.tsx` already uses (`isSharedLink` state, set
from `window.location.search` in a `useEffect` so it starts `false` server-side — no
hydration mismatch), and the same visible "A ClubHanger member shared this alert with
you — set up your own below." note copy/style. No new dependency, no schema/DB change —
`subscribeToAlerts`/`subscribeSignedInAlert` already strip `share=alert` from the stored
`source_path` server-side (`stripShareParam`) and already accept a `source` argument.

## Acceptance criteria
- Loading a page with `AlertMeChip` or `MobileStickyAlertBar` mounted (e.g.
  `/aircraft?make=Cessna`) at `?share=alert` shows the existing "shared with you" note
  near the chip / inside the sticky bar, above the button, before the visitor has
  subscribed.
- Without `?share=alert`, neither component renders the note (unchanged from today).
- A subscribe (one-tap remembered-email, signed-in, or scroll-to-form fallback) started
  from a `?share=alert` page tags `alert_capture_viewed` / `alert_capture_opened` /
  `alert_subscribed` PostHog events and the `subscribeToAlerts`/`subscribeSignedInAlert`
  `source` argument as `'shared_alert'` instead of `'filter_toolbar'`/`'sticky_bar'`.
- Without the share param, both components' analytics/source values are byte-identical
  to today (`'filter_toolbar'` / `'sticky_bar'`).
- No change to the stored `source_path` (already stripped server-side) or to any other
  chip/bar behavior (existing-alert check, remembered-email one-tap, dismiss, scroll-depth
  gate, etc.).
- `next build` + typecheck clean; QA smoke passes on `/aircraft` and `/partnerships` (both
  render `ActiveFilterChips`/`PartnershipActiveFilterChips` → `AlertMeChip`, and
  `MobileStickyAlertBar` at mobile width) at desktop 1280 + mobile 375.

## Out of scope
- Any change to `AlertSignup.tsx` itself (already has this).
- Any change to the `alerts` table / `source` column / migration state.
- The other two open batch-#3 items (right-noun sweep on `/about`+`/post`+`/listing-quality`;
  honest capture-time match count) — separate cycles.
