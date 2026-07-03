# aircraft-url-prefill

## Goal
Let a seller paste a link to their existing listing (Barnstormers, Controller, TradeAPlane, etc.) into the "Prefill from your notes ✨" box on `/aircraft/new` and have the AI-draft flow read that page and fill the form — completing the "paste what you have OR a source URL" half of the Pillar-1 "paste & prefill" backlog item (the pasted-text half is already shipped).

## Scope
- `src/lib/urlFetchGuard.ts` (new) — SSRF guard: only `http(s)`, standard ports, rejects literal private/loopback/link-local/metadata IPs and hostnames whose DNS resolution lands in those ranges.
- `src/lib/htmlText.ts` (new) — strip a fetched HTML page down to readable text (title + meta description + body text, tags/scripts/styles removed) for feeding into the existing draft prompt.
- `src/app/actions.ts` — refactor `generateAircraftDraft` to share its Claude-call body with a new `generateAircraftDraftFromUrl(url)` action: `checkAiDraftAccess()` → guard the URL → fetch (timeout + byte cap) → extract text → run through the same extraction the pasted-text path uses. Reuses the existing 10/hr per-user rate limit, so this can't be used to run more requests than pasted-text prefill already allows.
- `src/components/PostAircraftForm.tsx` — `handleGenerate()` detects when the textarea contains nothing but a bare URL and calls the new action instead of the text one; update the box's helper copy to mention a listing link is accepted.

## Acceptance criteria
- Pasting a bare `https://...` URL into the aircraft-for-sale prefill box and clicking the button fetches that page server-side and fills make/model/year/ttaf/smoh/engine/price/airport/title/description exactly like pasted text does today (verified against a real reachable page in QA, or a graceful "couldn't read that page" error if the target blocks scraping — either is an acceptable pass as long as it doesn't crash or hang).
- Pasting free-text notes (the existing flow) is unaffected — still goes through the text path.
- URLs resolving to loopback/private/link-local/metadata addresses (e.g. `http://127.0.0.1`, `http://169.254.169.254/...`, `http://localhost`) are rejected client-usable-error, never fetched.
- Non-`http(s)` schemes (`file://`, `ftp://`, etc.) are rejected the same way.
- `npx next build` + typecheck pass clean.
- No new console errors on `/aircraft/new` at desktop 1280 / mobile 375; no horizontal overflow.

## Out of scope
- Applying URL-prefill to the partnership or seeker-listing forms (aircraft-for-sale is the one where sellers realistically have an existing external listing to link).
- Per-source structured scraping (schema.org/JSON-LD) like `listingPhotos.ts` does for photos — this feeds the whole page's visible text through the same general-purpose Claude extraction the text-paste path already uses, so it works on any site without a bespoke parser.
- Full DNS-rebinding-proof SSRF hardening (pinning the fetch to the exact resolved IP with a spoofed Host header) — the guard validates the resolved address at request time, which blocks the realistic cases (localhost/private ranges/cloud metadata IP); this is gated behind an authenticated user's existing 10/hr AI-draft quota, so the residual TOCTOU window is an accepted tradeoff for this cycle.
