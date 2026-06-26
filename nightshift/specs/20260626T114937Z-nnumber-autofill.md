# Spec: N-Number Autofill on Aircraft Post Form

**Timestamp:** 20260626T114937Z  
**Slug:** nnumber-autofill  
**Lane:** [want] (P2)

## Goal
When a seller types their FAA N-number on the "Post an Aircraft for Sale" form and clicks "Look up", auto-fill Make, Model, and Year from the public FAA Aircraft Registry — reducing friction and improving listing accuracy.

## Scope
- **New:** `src/app/api/faa-lookup/route.ts` — GET `?n=N12345` → fetches FAA Aircraft Inquiry, parses make/model/year/registrant type, returns `{found, make, model, year, registrantType}` or `{found: false}`. Graceful fallback on any error (no 500s).
- **Modified:** `src/components/PostAircraftForm.tsx` — add "Look up →" button next to the N-Number field; on success, DOM-fills Make/Model/Year (same pattern as the AI draft autofill); shows "Found: {year} {make} {model}" or "Not found" feedback.

## Acceptance Criteria
1. `/aircraft/new` renders correctly with no console errors (auth-gated, same as before).
2. The N-Number field has a "Look up →" button; clicking it shows a loading spinner.
3. On a valid N-number, Make/Model/Year fields auto-populate (Make matched against the MAKES dropdown; if no match, Make stays empty).
4. On a not-found or FAA-error, a brief "Not found — fill in manually" message appears near the field; all fields remain editable.
5. The `/api/faa-lookup?n=N12345` route returns HTTP 200 (with `{found:false}` if FAA is unreachable — never 500).
6. Smoke test: HTTP 200, zero app-origin console errors, zero overflow at desktop 1280 + mobile 375 on `/aircraft/new`.

## Out of Scope
- Bulk FAA CSV import / `faa_aircraft` DB table (slice 2 of the backlog item)
- N-number validation (format checking) — just try the lookup and handle the "not found" case
- Applying the same lookup to the partnership post form (the N-number there is already optional)
- Rate-limiting the `/api/faa-lookup` route (low traffic; add later if needed)
- Owner name display (privacy — only show registrant type: Individual / LLC / Trust)
