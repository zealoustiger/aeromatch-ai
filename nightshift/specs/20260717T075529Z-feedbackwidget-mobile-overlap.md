# feedbackwidget-mobile-overlap

## Goal
Fix the `[P1][bug]` filed by the `contactbar-watch-button` cycle: the global `FeedbackWidget`
(`fixed bottom-5 right-5`) sits on top of the rightmost button of every mobile fixed bottom bar
(`ContactBar` on `/partnerships/[id]`, `MobileStickyAlertBar` on `/aircraft` + `/partnerships` +
`/aircraft/listing/[id]`), stealing the real click at that screen position — a tap-target bug,
not just a visual nit.

## Scope
- `src/components/FeedbackWidget.tsx` only — reposition the floating trigger button on mobile
  (below the `lg` breakpoint, matching `ContactBar`'s own `lg:hidden` gate) so it never
  geometrically overlaps a bottom sticky bar's tap area. Desktop position (`lg:` and up)
  stays byte-identical — no sticky bottom bar is mobile-only-gated in a way that reaches
  desktop, so the reported overlap is mobile-only.
- Mirrors the precedent already proven one component below it in `layout.tsx`:
  `DraftResumeBanner` already raises itself on mobile (`bottom-20`) specifically so it
  doesn't collide with this same Feedback button, and repositions again at `sm:`. This cycle
  applies the same "raise on mobile, keep desktop" idea to `FeedbackWidget` itself.
- Out of scope: `CompareTray` / `DeviceSaveSync` (conditional, rare, not named in the filed
  bug) — not touched. No change to `ContactBar`/`MobileStickyAlertBar`/`SeekerContactBar`.

## Acceptance criteria
- On mobile viewport (375px), the Feedback button no longer overlaps `ContactBar`'s button
  row on `/partnerships/[id]` (verified via Playwright bounding-box comparison, not just eyeballing).
- On mobile viewport (375px), the Feedback button no longer overlaps `MobileStickyAlertBar`'s
  button row on `/aircraft` and `/aircraft/listing/[id]` once scrolled into view.
- A real (non-synthetic) click on the sticky bar's rightmost button still reaches that button,
  not the Feedback pill.
- Desktop (1280px) Feedback button position/behavior is unchanged (byte-identical classes at
  `lg:` and up).
- `npx next build` + typecheck pass; qa-smoke passes at desktop 1280 + mobile 375 with zero
  console errors and zero horizontal overflow on the affected pages.

## Out of scope
- Repositioning `CompareTray` or `DeviceSaveSync`.
- Any change to the sticky bars themselves (`ContactBar`, `MobileStickyAlertBar`, `SeekerContactBar`).
- A dynamic "is a sticky bar currently mounted" coordination mechanism — a static mobile offset
  large enough to clear the tallest known bar's default state is sufficient and much simpler.
