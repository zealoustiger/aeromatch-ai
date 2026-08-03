# alert-capture-focus-confirmation

## Goal
When a visitor subscribes via `AlertSignup`, move keyboard focus to the confirmation
heading so keyboard/screen-reader users are taken to the success message instead of
being silently dropped to `<body>` (the submit button/form they were on unmounts).

## Scope
- `src/components/AlertSignup.tsx` only — add a ref + `tabIndex={-1}` to the confirmation
  `<h2>` headings and a `useEffect` that focuses it when a subscribe just completed.

## Acceptance criteria
- On a successful subscribe (typed, one-tap, or signed-in path), focus programmatically
  moves to the confirmation heading (`role="status"` panel's `<h2>`).
- The heading receives focus without a persistent/ugly outline for mouse users, but shows
  a visible focus ring when appropriate; it is not a tab stop in normal tab order
  (`tabIndex={-1}`).
- Focus only moves as a result of the user's subscribe action — NOT for the
  already-subscribed states (`existingAlert` / `locallySubscribed`) that render on mount,
  which would steal focus on page load.
- `npx next build` + `npx tsc --noEmit` pass clean.
- `qa-smoke.mjs` on the affected page (e.g. `/alerts`) passes: HTTP 200, zero app-console
  errors, zero horizontal overflow at desktop 1280 + mobile 375.
- No new console errors, no hydration mismatch, no visual regression to the box.

## Out of scope
- No aria-live changes (already shipped across the capture + manage components).
- No changes to `/alerts/manage` row actions, forms, or any other component.
- No copy, schema, analytics, or subscribe-logic changes.
- No new capture point.
