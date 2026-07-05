# seeker-cost-panel

## Goal
Show a "what this could cost you" flying-cost breakdown on the pilot-seeking-a-partnership detail page, by reusing the existing `PartnerShareCostPanel` component against the seeker's own stated max budget figures — closing the last unaudited Pillar 3 (buyer-analysis) gap: aircraft-for-sale and partnership listings both already answer "what will this cost me per hour," seeker listings never do despite having the exact same shape of inputs (`max_buy_in`/`max_monthly`/`max_hourly`/`hours_per_month`/`preferred_share_types`) sitting unused for this purpose.

## Scope
- `src/app/partnerships/seeking/[id]/page.tsx` — import `PartnerShareCostPanel`, render it in the sidebar (directly after the existing Budget card / `SeekerBudgetCheck` block), passing:
  - `buyInPrice={s.max_buy_in}`
  - `monthlyFixed={s.max_monthly}`
  - `hourlyWet={s.max_hourly}`
  - `shareType={s.preferred_share_types?.length === 1 ? s.preferred_share_types[0] : null}` (matches the existing single-preference pattern already used in this file for `make`)
  - no `reservePerHour`/`engineFamily` (seekers have no known airframe — component already treats these as optional and omits the reserve line when absent)
- A one-line intro heading directly above the panel clarifying these figures are projected from the seeker's own *stated maximums*, not a live quote (keeps the honesty framing accurate — the component's own copy doesn't distinguish "your budget" from "your actual cost").
- No changes to `PartnerShareCostPanel.tsx` itself (it already self-suppresses via `hasData` when both `monthlyFixed` and `hourlyWet` are null/0 — exactly the honesty-gate behavior this pillar requires).
- No schema change, no new query, no new component.

## Acceptance criteria
- `/partnerships/seeking/[id]` renders the flying-cost panel in the sidebar for any seeker record with `max_monthly` or `max_hourly` set, showing the same annual/per-hour/break-even math the partnership detail page already shows.
- When a seeker record has neither `max_monthly` nor `max_hourly` set, no panel (and no broken/empty card) renders — matches the component's existing self-suppress behavior, no fabricated numbers.
- The intro line above the panel makes clear the figures are based on the seeker's stated budget, not an actual/confirmed cost.
- `npx next build` + typecheck pass clean.
- QA smoke passes on `/partnerships/seeking/[id]` (a real seeder record) and `/partnerships/seeking` at desktop 1280 + mobile 375: HTTP 200, zero console errors, zero horizontal overflow.
- No regression to the existing Budget card, `SeekerBudgetCheck`, or Aircraft Preferences sidebar blocks.

## Out of scope
- Changing `PartnerShareCostPanel`'s copy/props/math itself.
- Adding cost panels anywhere else (browse cards, rail cards) — this is the detail-page slice only.
- Engine-life/annual/damage signals on seeker listings (confirmed N/A — seekers have no airframe fields at all).
