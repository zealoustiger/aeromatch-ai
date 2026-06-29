# Spec: past-listings-relist

**UTC:** 20260629T092536Z  
**Branch:** night/past-listings-relist  
**Pillar:** Pillar 1 — Frictionless listing posting (lifecycle management)

## Goal
Sellers who deactivated a listing (sold their aircraft, closed a partnership, or stopped seeking) should be able to see their past listings on `/listings` and re-activate ("relist") them in one click — without re-entering all the data.

## Scope
- `src/app/actions.ts` — add `relistListing(type, id)` server action
- `src/components/RelistListingButton.tsx` — new client component (mirrors DeactivateListingButton)
- `src/app/listings/page.tsx` — add 3 past-listing queries, update StatusBadge, add collapsible "Past listings" section

## Acceptance criteria
1. `/listings` shows a collapsible "Past listings (N)" section at the bottom when the user has any closed/sold listings.
2. Each past listing shows its title, type badge (Sold / Closed), date closed, and a "Relist" button.
3. Clicking "Relist" shows a confirm dialog, then sets status back to `active` (and resets `posted_at` to now for partnerships so they re-appear at the top of the feed).
4. After relist, the listing moves from "Past listings" back to the active section on the same page (revalidatePath triggers a server-side refresh).
5. Active queries are unchanged — they still only show `['active', 'pending']` status.
6. No schema changes.

## Out of scope
- Editing a past listing before relisting (would require a full edit form)
- Hard-deleting a past listing
- Scraper-sourced listings (they never appear on `/listings` since they have no `poster_id`)
