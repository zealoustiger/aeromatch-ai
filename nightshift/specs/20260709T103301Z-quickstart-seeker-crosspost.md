# quickstart-seeker-crosspost

## Goal
When a signed-up pilot completes the `/searches` "What are you looking for?" quick-start
for **Partnerships**, offer a one-tap cross-post nudge to also post themselves as a pilot
seeking a partnership — turning demand-side signal into supply-side (seeker listings).

## Scope
- `src/app/searches/page.tsx` — in the populated ("My Saved Searches" list) branch,
  render a persistent "Also post yourself as looking for a share?" nudge card, gated on:
  (a) the user has at least one saved search on the partnerships marketplace
  (`path === '/partnerships'`), and (b) the user has not already posted a
  `partnership_seekers` row themselves (`poster_id = user.id`).
- No schema change, no new server action — a read-only existence check + additive UI.

## Revised approach (mid-cycle)
Originally scoped as a transient prompt inside `QuickStartSearchForm`'s post-submit
"done" state. Live QA found that state is not actually visible in practice: `saveSearch`
already calls `revalidatePath('/searches')`, which causes Next.js to re-render the parent
Server Component (and swap from the quick-start branch to the populated-list branch)
essentially immediately after the action resolves — before a user could read a transient
confirmation. That's a pre-existing characteristic of the already-shipped
`searches-quickstart-onboarding` confirmation card too, not something introduced this
cycle. Moved the nudge to the persistent, always-rendered list view instead, so it's
actually visible.

## Acceptance criteria
- A signed-in user with ≥1 saved partnerships-marketplace search AND no seeker listing of
  their own sees the nudge card at the top of their saved-searches list on `/searches`.
- A user with a saved partnerships search who HAS already posted a seeker listing does
  NOT see the nudge (it's not a useful repeat ask).
- A user whose only saved searches are aircraft-for-sale / seeking marketplace does NOT
  see the nudge (partnerships-specific).
- The card links to `/partnerships/seeking/new`, styled consistent with existing
  `/searches` cards, 375px-first, no horizontal overflow.
- `npx tsc --noEmit` and `npx next build` stay clean.
- QA smoke passes on `/searches` at desktop 1280 + mobile 375 (HTTP 200, zero console
  errors, zero overflow); end-to-end verified against a real throwaway account.

## Out of scope
- Prefilling the seeker form with the make/airport from any saved search (a separate
  slice).
- Any change to `PostSeekerListingForm` or `/partnerships/seeking/new` itself.
- Fixing the pre-existing `QuickStartSearchForm` confirmation-flash timing issue (noted
  above, but out of scope for this cycle — flagged in the CHANGELOG `Next:` line instead).
