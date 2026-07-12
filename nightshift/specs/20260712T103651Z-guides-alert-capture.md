# Alert capture on the /guides pages

## Goal
Add a partnership-alert capture point to every `/guides/*` article and the `/guides` index, since these pages currently render zero `AlertSignup` despite readers of e.g. "flying club vs co-ownership" being hot partnership prospects.

## Scope
- `src/app/guides/aircraft-co-ownership/page.tsx`
- `src/app/guides/aircraft-partnership-agreement/page.tsx`
- `src/app/guides/aircraft-pre-purchase-inspection/page.tsx`
- `src/app/guides/aircraft-title-escrow-and-closing/page.tsx`
- `src/app/guides/cost-of-aircraft-co-ownership/page.tsx`
- `src/app/guides/flying-club-vs-co-ownership/page.tsx`
- `src/app/guides/how-to-find-aircraft-partners/page.tsx`
- `src/app/guides/leaseback-vs-co-ownership/page.tsx`
- `src/app/guides/page.tsx` (the guides hub/index)

Each gets `<AlertSignup noun="partnership" sourcePath="/partnerships" source="guide_page" className="mt-10" />` — mirrors the existing `/tools/cost-calculator` precedent exactly (same props, same reasoning: `sourcePath` must be a real matchable route so the digest cron can actually fire, hence the bare `/partnerships` path rather than the guide's own URL). No `context` prop, so it renders the general "get new-listing alerts" copy (a guide reader isn't scoped to one make/model).

## Acceptance criteria
- All 8 guide article pages render an `AlertSignup` (partnership noun) right before the closing disclaimer's `</article>`, after the CTA content.
- The `/guides` index renders the same `AlertSignup` after its existing CTA panel.
- Submitting the form on any of these pages fires `alert_subscribed` with `source: 'guide_page'` (inherited from the component, no code needed beyond passing the prop).
- No new component, no schema change, no metadata change.
- `next build` + typecheck pass; QA smoke passes (200, no console errors, no horizontal overflow) at desktop 1280 + mobile 375 on a sample of guide pages + the index.
- Existing page content/JSON-LD is unchanged.

## Out of scope
- Any other alert-experience backlog item (e.g. `/saved` capture, `/alerts/status` enrichment, sample-digest email).
- New guide pages or SEO/metadata changes (SEO is parked).
