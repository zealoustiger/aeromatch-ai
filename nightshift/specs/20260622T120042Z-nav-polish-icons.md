# Nav polish — icons on nav items + move About to footer

**Lane:** [want] (alternates from last non-bug cycle `home-guides-tools-rail` = [goal]).
Backlog item: **[P3][want] Nav polish** — "Add icons to Partnerships, Planes-for-Sale,
Guides (Tools already has one); move **About** out of top nav into the footer."

## Goal
Tighten the primary navigation: give every top-nav item a small leading icon for visual
parity (Tools already has one) and declutter the bar by moving **About** out of the top
nav into the footer (where it already lives), exactly as the human requested.

## Scope (small)
- `src/components/Nav.tsx` only:
  - Import `Users` (Partnerships) and `BookOpen` (Guides) from `lucide-react`.
  - Add `icon` to the `links` entries: Partnerships → `Users`, Planes for Sale → `Plane`,
    Guides → `BookOpen`. Tools keeps its existing `Calculator`.
  - Remove the `/about` entry from the `links` array (drives both desktop + mobile nav).
- No Footer change needed — `src/components/Footer.tsx` already links About ClubHanger.

## Acceptance criteria
- Desktop nav shows Partnerships, Planes for Sale, Tools, Guides — each with a leading icon;
  **About is no longer in the top nav**.
- Mobile menu mirrors the same four items, each with a leading icon; no About entry.
- About remains reachable from the footer ("About ClubHanger" link).
- The `/about` page itself is unchanged and still loads (200).
- No console errors / hydration warnings; no horizontal overflow at 1280 + 375px.
- `next build` + typecheck green.

## Out of scope
- No reordering of the remaining nav items (FREEZE: no IA restructure beyond the
  human-approved About move).
- No footer redesign, no logo/brand change, no new routes, no schema/DB/SQL.
- No change to the Post-a-Listing CTA, ProfileMenu, sign-in, or mobile auth header.
