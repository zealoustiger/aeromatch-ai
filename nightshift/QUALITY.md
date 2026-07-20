# Night Shift — Code Quality Log

Newest first. The drain spot-checks ~25% of PASSed cycles on the strong model
(Opus) to grade code quality the automated gate can't see. Scores 1-5.

## 2026-07-20T11:59:13Z — alert-delete-undo — score 3/5
- Strengths: Genuinely thoughtful edge-case handling — the deliberate no-revalidate-on-delete + client-side row hide (AlertRowVisibility) correctly avoids the token-anchor visit revalidating itself into the sign-in wall and unmounting its own toast; verbatim id-preserving re-insert, 23505 duplicate handling, clean a11y (role=status/aria-live, disabled "Restoring…"), toast anchored left to dodge the FeedbackWidget, all densely and accurately documented; matches the file's run-style transition + graceful-fallback conventions.
- Weaknesses / risks: restoreAlert's primary auth path `token != null && alert.unsubscribe_token === token` compares two fully client-supplied values against each other (both the snapshot and token come from the caller) — an attacker calling the server action directly can set them equal and have the admin/service-role client insert an arbitrary alert row (any email/status), an auth bypass the original deleteAlert (which resolves ownership via a real DB token lookup) did not have.
- Follow-up: Harden restoreAlert path (1) — instead of trusting the snapshot's own unsubscribe_token, re-derive authorization from a server-side anchor (e.g. verify the URL token matched a real row at delete time, or require resolveOwnerEmail/session), so a forged snapshot+token pair can't insert arbitrary rows.

## 2026-07-20T10:51:50Z — seeker-post-subscriber-count — score 5/5
- Strengths: Closes the trilogy exactly on-spec — `matchesSeekerListing` mirrors the cron's `countNewSeekers` semantics precisely (make = case-insensitive array membership NOT substring, model = exact-token reuse of `matchesModelFilter` semantics, state exact, icao home_airport OR additional_airports, no radius), and the deliberate divergence (bare `/` "all" returns null so a homepage alert never counts a seeker) is documented against the real `route.ts` countNew branch and asserted in tests; clean pure/IO split identical to the two sibling counters, honest null/≥1 render gate, justPosted-only DB touch, and thorough unit tests covering every dimension incl. substring non-match, empty preferred_models, icao-null, and cross-type path rejection.
- Weaknesses / risks: `matchesSeekerModelFilter` is a local re-implementation of `seekerModelFilter.ts`'s `matchesModelFilter` (behavior-identical, justified & documented by the node-test-runner import constraint that governs the whole file); the shared full-`alerts`-table-scan-then-filter-in-JS pattern persists across all three counters (pre-existing, not introduced here).
- Follow-up: none

## 2026-07-20T09:28:50Z — partnership-post-subscriber-count — score 4/5
- Strengths: Reversed match predicate exactly mirrors the digest cron's ilike/eq/in/radius query semantics (verified against the real query); honest null/zero gate never fabricates a count; clean pure/IO split with thorough unit tests covering every spec dimension incl. non-match + null home_airport.
- Weaknesses / risks: `PARTNERSHIP_MAKE_SLUGS` is a hand-maintained local duplicate of `seo.ts`'s make table — if a curated make is added there, this drifts and that make's alert path silently returns null (undercount); also fetches all `alerts` rows and filters LIVE_STATUSES in JS rather than a DB `.in`.
- Follow-up: none

## 2026-07-20T07:35:20Z — admin-alerts-repermission-block — score 4/5
- Strengths: On-spec and cleanly scoped — new `getRepermissionRollup` faithfully lifts the inline funnel computation into a shared helper (identical `row.status || 'unknown'` normalization and `LIVE_STATUSES` set, so funnel field shapes/values are provably unchanged), reuses the exact optional-col retry-drop degrade pattern with honest `sentAtMigrated`/`frequencyChangedAtMigrated` flags, a clear JSDoc on the never-fabricate contract, and a three-honest-states admin panel (unmigrated / zero-sent / real counts) that mirrors the email copy and wraps for mobile.
- Weaknesses / risks: The weekly funnel path now issues two full `alerts` table scans (its own + the helper's) where it previously fetched those columns in one query — the price of sharing logic-not-query; runs in parallel so latency is unaffected, only DB load. `LIVE_STATUSES` remains duplicated across the two files (pre-existing).
- Follow-up: none

## 2026-07-20T07:16:27Z — alert-confirm-deliverability-copy — score 4/5
- Strengths: Hits every acceptance criterion exactly; new line matches surrounding `ch-muted`/`&rsquo;` conventions, margins re-tuned (20px→16px/8px) for sensible spacing, and both html+text plus position-aware tests added.
- Weaknesses / risks: "Primary tab" copy is Gmail-centric (Outlook/Apple Mail have no such tab), mitigated by the universal "add us to your contacts" fallback; nothing material.
- Follow-up: none

## 2026-07-20T06:14:54Z — digest-gmail-clip-guard — score 4/5
- Strengths: Faithful, well-scoped spec execution — cores renamed to `*Core` and wrapped by pure trim-and-rebuild loops that are true no-ops under budget (byte-identical output preserved), trimming only sample cards so the honest "See all N matches" count/CTA stays truthful; combined builder spreads the cut by always trimming the heaviest section, both loops terminate via real guards (`samples.length===0` / `heaviestIdx===-1`); `trimmedSamples` cleanly omitted unless it fired; cron logs `console.warn` with identifying ids per convention; route's `'trimmedSamples' in digestEmail` correctly discriminates the price-drop vs digest union; 3 targeted tests (no-trim byte-identity, oversized single, combined fair-trim with lighter section untouched) + full 197-test suite green.
- Weaknesses / risks: none material — trim loop rebuilds the entire HTML from scratch per removed card (O(n²) on huge sets), but only fires on the rare oversized fail-soft path where cost is negligible; single builder always trims the last card rather than by weight, which is fine for one section.
- Follow-up: none
- Strengths: Textbook parity work — the new `/api/alerts/snooze` route, `resumeAlertsByToken` action, the two email-footer edits, the `snoozed` landing state and its `SnoozeUndo` component each mirror an existing sibling (`/api/alerts/frequency`, `snoozeAlertByToken`'s exact drop-and-retry degrade loop, the `frequencyUrl` footer conditional, the `fewer` state) so the diff reads as if it were always there; honest resume-date handling (server re-reads `paused_until`, `formatResumeDate` returns null → generic copy, never fabricates a date on the still-unmigrated column); token-list scoped so a combined digest's several alerts snooze/resume in one click; both builders get present/absent tests in html+text, and the full round-trip (snooze GET → undo click → row flipped back) was live-verified against a throwaway row.
- Weaknesses / risks: none material — undo isn't idempotent (a second "Undo" click hits the `.eq('status','paused')` guard and surfaces "This link is no longer valid" rather than a soft success — minor UX nit), and the new `resumeAlertsByToken` has no direct unit test (action-level, live-verified only), consistent with the spec's stated coverage approach.
- Follow-up: none

## 2026-07-19T10:30:03Z — alert-dormant-repermission — score 5/5
- Strengths: Meets every acceptance criterion cleanly — the honesty gate is exactly right (early-returns `[]` before any per-address query when candidates are empty or `email_engagement_events` has zero rows anywhere, so a never-tracked address is never mislabeled dormant, then treats a candidate's own zero rows as real signal once tracking is live); pure `isDormancyAgeAndSendEligible` is correctly split into its own no-DB module for `node --test` unit coverage (age/send-count/already-sent/null-confirmed_at branches all tested); `markDigestSent` correctly per-row increments (can't bulk-increment) and drop-column-retries so an un-migrated `digest_sends_count` never blocks the pre-existing `last_digest_at` stamp; both send paths refactored through it; `repermission_sent_at` stamped on success guarantees one-time; `buildRepermissionEmail` mirrors `buildWidenSuggestionEmail`, escapes `context` (h1 + preheader via `preheaderHtml`), reuses `/alerts/manage` instead of inventing a no-op endpoint, and extends the `withUtm` campaign union; 6 email tests cover subject/fallback/links/CTA/escaping.
- Weaknesses / risks: none material — per-candidate engagement counts are N sequential head-count queries (bounded by the strict ≥90d/≥8-send/not-yet-sent pre-filter and a cap of 25, so trivially small), and the `.lte('confirmed_at', cutoff)` query can't reach the pure helper's null-`confirmed_at`→`created_at` fallback (unreachable-but-tested defensive branch, harmless since confirmed/active rows always have `confirmed_at`).
- Follow-up: none

## 2026-07-19T09:12:47Z — alert-monthly-cadence — score 4/5
- Strengths: Complete and honest — widens `AlertFrequency`/`INTERVAL_DAYS`/`normalizeFrequency` at the source, extends the unit tests with the right boundary cases (20/28/40-day), threads `monthly` through every copy surface (status page, signup, email periodLabel + zero-match "checks run monthly", cron), refactors `FrequencyToggle`'s binary ternaries into clean CYCLE/LABEL/CLASSES records, and gates the recovery/narrow-nudge monthly options correctly (`showMonthlyOption` / `frequency !== 'monthly'`); the additive CHECK-constraint migration is human-apply-flagged and its reasoning is verified correct — the existing `error.message.includes('frequency')` drop-and-retry loop covers the `alerts_frequency_check` violation, so it fails soft identically to prior `alerts.*` migrations.
- Weaknesses / risks: minor — until the human applies the CHECK migration, a "switch to monthly" click reports success but silently keeps the prior cadence (documented, matches the weekly precedent); weekly & monthly recovery buttons share the same Calendar icon and weekly's muted gray styling reads oddly for the current default.
- Follow-up: none

## 2026-07-19T08:43:52Z — alert-unsubscribe-reasons — score 5/5
- Strengths: Meets every acceptance criterion cleanly — a single canonical `alertUnsubscribeReasons` module removes the duplicated chip list and feeds picker, validated token-scoped write, and admin rollups from one source; the write action mirrors `markAlertFoundAircraftByToken`'s trust boundary + missing-column fail-soft and validates `reason` against the key set; `handleReason` fires the write fire-and-forget so it never blocks/errors the UI; the pure `summarizeUnsubscribeReasons` degrades to honest this-week/all-time empty states (null reason skipped, unmigrated timestamp → all-time only, unknown key kept under raw label), `getUnsubscribeReasonRollup` reuses the established optional-column retry, and email/admin both distinguish "unmigrated" from "no data yet" — all backed by 7 focused unit tests.
- Weaknesses / risks: none material — `getUnsubscribeReasonRollup` does a full `alerts` select into JS to aggregate, but that's the exact convention every sibling rollup in the file already uses, not a regression.
- Follow-up: none

## 2026-07-19T08:29:57Z — alert-reply-to — score 4/5
- Strengths: Meets every acceptance criterion — `sendEmail` reads `ALERTS_REPLY_TO` at the one chokepoint (`|| undefined` + conditional spread → truly omitted, not empty, covering all send types) and both digest builders gate a quiet reply footer on `!!process.env.ALERTS_REPLY_TO` in HTML and text, read per-call for testability; footer styling mirrors the adjacent `shareHtml`/`shareText` exactly, no other builder touched per scope, and 4 focused tests cover present/absent × both builders × both bodies.
- Weaknesses / risks: minor — the `replyToConfigured`/`replyToFooterHtml`/`replyToFooterText` trio is duplicated verbatim across the two builders (matches the file's inline-snippet convention, so acceptable but a helper would DRY it), and the new doc comment floats detached above `SendEmailInput` where JSDoc would misattach it to that type rather than to `sendEmail`.
- Follow-up: none

## 2026-07-19T06:37:18Z — digest-cron-reliability-line — score 4/5
- Strengths: Hits every acceptance criterion — a fail-soft, date-bounded `getCronRunsSince` that mirrors `getRecentCronRuns`' try/catch-empty convention, seven honest snapshot fields (with `cronRunsRecorded` cleanly distinguishing "quiet week" from "no data"), and an HTML+text "Cron reliability" section that flags N<7 days, reuses `formatWeekDelta`/`escapeHtml`, and renders a genuinely distinct empty state; well-scoped (correctly defers the riskier `send_failures` column to a follow-up), house-style comments, and 3 focused tests (populated/short-week/empty) that all pass in the full 144-test suite.
- Weaknesses / risks: none material — `cronRunsThisWeek`/`cronRunsLastWeek` are computed and stored on the snapshot but never rendered in the email (they are spec-mandated fields available to other consumers, so not dead code, just unused by this slice).
- Follow-up: none

## 2026-07-18T11:23:06Z — digest-share-with-partner — score 5/5
- Strengths: Hits every acceptance criterion exactly — an optional `shareUrl` on `buildAlertDigestEmail` and a per-section `shareUrl` on `AlertDigestSection`, both rendered in HTML (via `escapeAttr`) and plain text and both cleanly omitted when absent; reuses the existing `withShareParam` helper on the alert's own `source_path` so the forwarded link is plain/non-tokenized (can't leak manage/unsubscribe control) and — because stored `source_path` is already `stripShareParam`'d — can't double-append `share=alert`; comments explain the security rationale in the house style; 4 focused tests cover present/absent in both templates plus per-section scoping (`Share this alert` count === 1) and no new schema/analytics as the spec required.
- Weaknesses / risks: none material — the route-level wiring (deriving `shareUrl` on both send paths without an `unsubscribe_token`) is only exercised by the dev preview + smoke, not a unit test, but that matches the file's existing precedent for `editUrl`/`stopUrl`.
- Follow-up: none

## 2026-07-18T09:51:13Z — admin-digest-vote-counts — score 4/5
- Strengths: Hits every acceptance criterion cleanly — reuses `getDigestVoteRollup()` (no duplicated query), threads the snapshot's `now` into it so the vote windows align with the funnel's and the rollup becomes unit-testable, kicks the fetch off as a concurrent promise, and renders an honest "No votes yet" state (test asserts no fabricated `👍 0 / 👎 0`) across both HTML and plain-text plus the dev preview fixture.
- Weaknesses / risks: minor — the HTML WoW-delta line ("+2 vs last week 👍, -1 vs last week 👎") reads a little awkwardly, and the rollup's pre-existing 500-row `limit` means totals would silently understate at high vote volume (not introduced here, low-volume today).
- Follow-up: none

## 2026-07-18T08:48:14Z — alert-crosssell-rightnoun — score 5/5
- Strengths: Exactly the right-noun fix the spec asked for — `/partnerships/[id]`'s justPosted box flips from re-offering the poster their own market (`noun="partnership"` → `/partnerships`) to the demand-side seeker cross-sell (`noun="seeker"` → `/partnerships/seeking`), and the seeking detail's justPosted banner gains the counterpart partnership box by reusing the page's already-computed `alertContext`/`alertSourcePath` (no new derivation, no new component); distinct `source` values (`post_success_partnership`/`post_success_seeking`) keep per-placement attribution clean, `p.make` fallback preserved on both branches, and the replacement comments match the surrounding house style.
- Weaknesses / risks: none material — `AlertSignup`'s generic copy renders "a new {ctx} seeker is listed" rather than the spec's aspirational "pilot seeking a share appears," but that's an inherent, in-scope consequence of correctly reusing the shared component instead of forking it.
- Follow-up: none

## 2026-07-18T08:06:52Z — admin-alert-funnel-weekly — score 4/5
- Strengths: Clean sibling to `alertScoreboard.ts` — reuses its exact WoW windows, `LIVE_STATUSES` set, and `source`-column graceful-degrade; scrupulously honest labeling (created/confirmed get real WoW deltas, paused/unsub/bounced render as explicit "current totals, not weekly"); piggybacks the daily cron (no new vercel.json entry), gated by a pure Monday+`ADMIN_EMAILS` guard that leaves the existing digest path untouched and wrapped in try/catch so a summary failure can't 500 the run; 9 focused tests cover flat/negative deltas, empty sources, unmigrated column, and dashboard-URL escaping.
- Weaknesses / risks: On a non-`source` DB read error `getAlertFunnelWeeklySnapshot` returns all-zeros rather than aborting the send, so a transient read failure could email admins a misleading "0 new, 0 confirmed" funnel; also counts `sendEmail` `no-key` results as sent, mildly inflating the `adminSummarySent` log metric.
- Follow-up: none

## 2026-07-18T07:51:46Z — alert-digest-price-context — score 4/5
- Strengths: Honest, well-scoped comp line reusing existing `compVsMarket` floors; lazy/memoized family-map getter fetches at most once per run and only when aircraft new-listing samples exist; paginates past Supabase's 1000-row cap; non-fatal on fetch error; dark-inbox-safe fixed-contrast pill; 6 new tests cover all 3 comp branches + $X.XM formatting + the honesty-gate null case.
- Weaknesses / risks: Diverges from spec's file layout — `compLabel`/tests landed in `email.ts`/`email.test.ts` (defensible: honors email.ts's import-free convention) rather than `aircraftComps.ts`, at the cost of a small commented `formatPriceK` copy; the digest's population floor is a third redundant `50_000` constant (`PARTS_PRICE_FLOOR`) that equals on-site `BUYER_PRICE_FLOOR` today but could silently diverge if one is edited.
- Follow-up: none

## 2026-07-18T07:33:57Z — alert-revive-remaining-paths — score 5/5
- Strengths: Disciplined, exactly-scoped mirror of the existing `subscribeSignedInAlert` revive pattern across all 4 target paths — each passes the correct already-proven owner email (`original.email` / `ownerEmail` via `resolveOwnerEmail` / `user.email`), the guarded `if (error) { if 23505 revive else return err }` shape preserves the non-23505 error message verbatim, `reviveIfUnsubscribed`'s internal `status !== 'unsubscribed'` guard keeps every other conflict a true no-op, and the `subscribeSavedSearchAlert` `createAdminClient()` hoist is minimal with the pre-existing PII-select comment correctly extended; `createManageAlert` even preserves `alreadyExisted: error?.code === '23505'` so caller messaging is byte-identical, with a comment explaining why.
- Weaknesses / risks: none material — revive is fire-and-forget (`await` but result unchecked), but that is faithful to the shipped precedent and intentionally silent, so a failed revive degrades to today's no-op rather than surfacing an error.
- Follow-up: none
## 2026-07-18T06:33:16Z — alert-typo-guard-keyboard-sweep — score 4/5
- Strengths: Faithful, honestly-scoped extension — the spec re-read the six backlog-named components and correctly proved five have no email input of their own (deferring one-tap buttons), then swept only the three real inputs plus a grep-surfaced `UpdateAlertEmailForm`; chip JSX mirrors the shipped `AlertSignup` pattern verbatim (same suggest-only, non-blocking `suggestEmailFix` reuse) and the footer adds the right `!(rememberedEmail && !useManualEmail)` guard so the chip only shows when the manual field is actually rendered, with `UpdateAlertEmailForm` cleanly wrapped in a `div` to seat the chip below the form.
- Weaknesses / risks: The 7-line "Did you mean…" chip is now inlined in three components (AlertSignup, FooterAlertCapture, UpdateAlertEmailForm) with identical markup/classes — mild drift risk if the pattern ever changes; not extracted to a shared `<EmailTypoChip>`.
- Follow-up: Extract the repeated typo-guard chip into a shared presentational component (e.g. `EmailTypoChip`) consumed by all three inputs to kill the 3-way JSX duplication.
## 2026-07-17T12:19:38Z — alert-manage-duplicate — score 4/5
- Strengths: Clean, minimal, exactly-scoped — `createManageAlert` gains an optional `opts` object whose `?? 'weekly'/true/'manage_new'` defaults keep every existing caller byte-identical, `NewAlertForm` is reused as-is (prefill via `initial` + `autoOpen`/`onClose` so the parent owns visibility), Duplicate is gated on `target` and made mutually exclusive with Edit (each toggle closes the other), and criteria are threaded through the existing `targetToFields` helper rather than re-deriving; comments explain the invisible frequency/price-drop carryover well.
- Weaknesses / risks: The shared "Alert created" toast is dead in the duplicate path — `handleSubmit` sets `created=true` then immediately calls `onClose()`, which unmounts `NewAlertForm` before the toast renders, so a duplicate confirms only via the refreshed row list (the plain "+ New alert" flow still shows the toast); separately, an aircraft alert's `dealOnly`/"good deals only" flag is silently dropped on duplicate (documented as out-of-scope in `InitialValues`, but a real behavior gap for deals-only sources).
- Follow-up: none
## 2026-07-17T11:46:45Z — partnership-hub-sticky-alert-bar — score 4/5
- Strengths: Exact-mirror of the aircraft-hub pattern with the right subtlety — each sticky bar reuses its page's `AlertSignup` `context`+`sourcePath` verbatim (so `getExistingAlertForSourcePath` dedups the two prompts cleanly), distinct `sticky_bar_partnership_{make,near,state}` source tags per acceptance, and a well-commented `#alert-bar-reveal` sentinel copying `/aircraft/browse`'s fallback so thin hubs (near/[icao] MIN_NEARBY=2) actually fire; nothing else on the pages touched.
- Weaknesses / risks: none material — only nit is the fragment's inner `<div>` left un-re-indented to keep the diff minimal (cosmetic; build/lint passed).
- Follow-up: none
## 2026-07-17T10:40:28Z — footer-alert-context — score 4/5
- Strengths: Nails every acceptance criterion — copy, `source_path`, safe `/` fallback for unmatchable look-alikes (validated via `getMakeBySlug`/`STATE_NAMES` so it never mints an alert `parseSourcePath` can't match), and the subtle bit the gate can't see: keying every stateful effect (submitted/local-sub/impression) off `sourcePath` so a client-side nav across the never-remounted Footer resets cleanly and doesn't re-nag a `/`-subscriber.
- Weaknesses / risks: The derived `context` strings ("Cessna listings", "partnerships near KAUS") are written to the shared `alerts.context` column, but that column elsewhere holds the app's bare-noun convention (make-page `AlertSignup` passes `context={entry.make}` = "Cessna") — so the same source_path now yields two different context labels, defeating the email+context dedup between footer and page signup and producing inconsistent digest section names (`alertDigestDedupe` labels sections from `context`).
- Follow-up: none
## 2026-07-17T10:01:39Z — digest-edit-alert-link — score 5/5
- Strengths: Hits every acceptance criterion exactly — `editUrl` mirrors the existing `stopUrl` no-token graceful-degrade in the same object, `escapeAttr`-guarded href, both html+text bodies, `scroll-mt-24`+`id="alert-<id>"` for the hash offset, and `autoOpen` reuses the existing `openEdit()` (which already guards `!target`, so a non-editable row fails soft), with the mount-once `useEffect([])` matching the surrounding eslint-disable idiom; single-alert path and stopUrl untouched, preview route updated for QA.
- Weaknesses / risks: none material — empty-dep `useEffect` fires only on mount, so a client-side nav re-adding `?edit=` won't re-open, but that's not a real digest-link flow (each link is a fresh page load).
- Follow-up: none
- Strengths: Textbook mirror of ContactBarWatchButton's one-shot `viewedRef` + `alert_capture_viewed`/`opened` pattern onto both surfaces — same `{context: context||undefined, source_path, source}` payload, same `state/crossSell !== 'offer'` guard, same eslint-disable convention; opened event correctly fired before the subscribe action resolves, `alert_subscribed` calls untouched, zero UI change exactly as scoped.
- Weaknesses / risks: none material — the never-reset ref fires viewed once per mount rather than per literal `crossSell → 'offer'` transition, so a dismiss+re-save reopen won't re-fire (arguably better: it also avoids double-counting on the subscribe-error `'subscribing'→'offer'` re-render).
- Follow-up: none

## 2026-07-17T07:32:37Z — saved-page-watch-offers — score 4/5
- Strengths: Cleanly reuses subscribeSignedInAlert/getExistingAlertForSourcePath with the exact detail-page `?watch=price` source_path convention, so cross-surface dedup works; seekers skipped, loading/watching/error states + a11y all handled.
- Weaknesses / risks: Each row fires its own getExistingAlertForSourcePath on mount — N server-action round-trips per page load (mirrors AlertSignup's single-instance pattern but multiplied), minor at typical saved-list sizes.
- Follow-up: none

## 2026-07-17T07:16:25Z — mobile-sticky-watch-bar-detail — score 4/5
- Strengths: Clean, backward-safe generalization — new `revealSelector`/`source`/label props all default to the exact original hardcoded strings (`source ?? 'sticky_bar'`, browse copy) so the two existing callers are byte-for-byte unchanged; the two scroll-gate effects branch cleanly on `revealSelector` (early-return guards, no tangling), and the detail sentinel gate deliberately fires on "scrolled entirely past" (`rect.bottom < 0`) rather than a naive IntersectionObserver-visible, with a comment explaining the short-gallery immediate-fire pitfall it avoids; reuses the page's own `watchContext`/`watchSourcePath` (`?watch=price`) so the `alreadySubscribed`/`getExistingAlertForSourcePath` and per-listing dismiss gates come for free, rAF-throttled passive scroll listener, partnerships correctly deferred.
- Weaknesses / risks: none material — the detail gate does no initial `check()` at mount, so a page restored at a scrolled position needs one scroll event to reveal (minor); `alreadySubscribed` is only re-derived on `signedInEmail`/`sourcePath` change, so subscribing via the in-page `AlertSignup watchOnly` panel in the same session won't hide the still-mounted bar until remount; no bottom spacer added, so the fixed bar covers the last sliver of content at scroll-end (shared with existing browse bars, dismiss mitigates).
- Follow-up: none

## 2026-07-16T12:11:59Z — alertsignup-matchcount-sweep — score 4/5
- Strengths: Exact, faithful execution of a mechanical sweep — every listed page made `async`, one `getAlertMatchCount` call, `matchCount={matchResult?.count}` threaded in; honest 0-case preserved (`hasMatchCount = typeof === 'number'` renders 0, `undefined` from a null result omits the line), `not-found.tsx` correctly left alone, and cost-calculator cleanly hoists the `/aircraft?make=&model=` URLSearchParams into a single `alertSourcePath` reused by both prop and count instead of rebuilding it.
- Weaknesses / risks: none material — the import+await+prop trio is repeated across 12 files, but each is a separate page component so that's inherent, not extractable duplication; scope was deliberately narrow (no `getAlertMatchCount`/`parseSourcePath` changes, per spec).
- Follow-up: none

## 2026-07-16T11:43:36Z — share-alert-chip-attribution — score 5/5
- Strengths: Precise, faithful mirror of `AlertSignup`'s share detection — identical `isSharedLink` useEffect + `effectiveSource = isSharedLink ? 'shared_alert' : <placement>` derivation cleanly replaces every hardcoded `'filter_toolbar'`/`'sticky_bar'` across all three tracked events and both server actions, so no default-path bytes drift; the `basis-full` note in `AlertMeChip` correctly claims its own row in the parent `flex flex-wrap` container, both notes suppress post-subscribe via the existing `alreadyOn` early-return / `!justSubscribed` guard, and the SSR-false-then-flip pattern avoids hydration mismatch as the spec required.
- Weaknesses / risks: none material — the "shared this alert with you" copy string is now triplicated across `AlertSignup`/`AlertMeChip`/`MobileStickyAlertBar` with no shared constant, but the spec explicitly mandated the mirror and each placement needs distinct layout classes, so extraction would be over-engineering.
- Follow-up: none

## 2026-07-16T11:12:43Z — footer-alert-capture — score 5/5
- Strengths: Textbook thin-island implementation — `subscribeToAlerts('', '/', true, 'weekly', 'footer')` matches the `AlertMeChip`/`MobileStickyAlertBar` call convention exactly, `track` uses the same `context: 'all'` generic label the siblings derive via `context || 'all'`, and it reuses `markAlertSubscriber`/`addLocalSubscription`/`setLocalEmail`/`getLocalEmail` for a true remembered-email one-tap with a "Not you?" escape hatch; clean pending/error/submitted states, `sr-only` label + `autoComplete="email"`, responsive stacking, and it honors every out-of-scope call (no auth check, no IntersectionObserver, no extra round-trip).
- Weaknesses / risks: none material — no `required` on the input, but the server's `EMAIL_RE` guard returns a graceful inline error and no sibling uses `required` either; the useEffect localStorage read means a returning subscriber sees a one-frame blank-form flash before the one-tap swaps in, unavoidable and consistent with the sibling pattern.
- Follow-up: none

## 2026-07-16T09:11:12Z — alert-watch-target-price-edit — score 5/5
- Strengths: Server action mirrors `updateAlertPriceDropOptIn` exactly (same `loadOwnedAlert` ownership proof, same `error.message?.includes('target_price')` missing-column graceful-degrade, same `revalidatePath`), with dual client+server validation of positive numbers; the new `TargetPriceEdit` client control cleanly covers add/edit/clear/cancel with error state, a11y labels, `flex-wrap` mobile layout, and a good doc comment explaining why watch alerts stay off the `AlertEditForm` criteria path — tightly scoped, reuses `formatPrice`, touches nothing out of scope.
- Weaknesses / risks: none material — render gates on `watch.active` (spec said "watch truthy"), a defensible narrowing since an inactive/"done" watch has nothing to re-target; client `parseInt` silently truncates decimals, harmless for whole-dollar prices behind `type="number" min=1`.
- Follow-up: none

## 2026-07-16T08:21:09Z — admin-email-template-gallery — score 5/5
- Strengths: Every one of the 11 builder call sites matches its real `email.ts` signature exactly (verified against source); honest live-data discipline is excellent — reuses the existing `getAlertDigestPreview` fetcher, adds a clean genuine-price-drop query that returns null rather than guess, sandboxes each HTML preview in `<iframe sandbox="">`, labels placeholder-fed builders as such, and never touches `sendEmail`/Resend; scoping and the `/admin/listings/sample` drill-down link precedent are spot-on.
- Weaknesses / risks: none material — `getSamplePriceDropListing` selects a `location` column it never uses; the no-live-drop fallback shows illustrative fabricated price numbers (honestly labeled) and the combined-digest preview drops the spec's `/partnerships/seeking` third fetcher in favor of aircraft+partnership — all defensible, net-positive judgment calls.
- Follow-up: none

## 2026-07-15T06:22:15Z — alert-widen-suggestion-email — score 4/5
- Strengths: Faithfully reuses the live widen logic with honest double live re-verification (0-match then >0 widen) before any send, mirrors sendStrandedPendingReminders' shape/fail-soft precisely, and ships strong tests (XSS-escape, singular/plural, byte-exact tokens, empty-context fallback).
- Weaknesses / risks: sendWidenSuggestionEmails has no .limit() / upper age bound and never stamps the permanently-ineligible (21d+, never-matched, no >0 widen) alerts, so that set only grows and gets re-run through 2 live getAlertMatchCount calls on every daily cron pass.
- Follow-up: Bound the widen scan (add .limit() and/or an upper confirmed_at window, or stamp a "checked, no widen" marker) so ineligible never-matched alerts aren't re-scanned with 2 live match-count queries each every day.

## 2026-07-14T11:13:05Z — alert-email-preheader — score 5/5
- Strengths: Correct, honest, and well-scoped — a single shared `preheaderHtml()` helper (zero-height `display:none` div + `mso-hide:all` + `&nbsp;&zwnj;` padding, all standard inbox-preview technique) called right after `<body>` in exactly the 4 named builders, out-of-scope builders untouched (0 diff hits); every preheader is derived from counts/prices already passed in (no fabricated figures), leads with the key number so it survives inbox truncation, and cleanly sidesteps the double-escape trap by feeding raw (`forThingText`/unescaped title) mirrors into the helper's own `escapeHtml`, with a comment explaining exactly why; 84 lines of tests cover all 4 builders, custom `dropNoun`, zero-match honesty, HTML escaping (asserts no `&amp;amp;`), and the text-part-byte-identical invariant.
- Weaknesses / risks: none material — the digest first-send/sample preheader strings duplicate the near-identical `bodyCopyText` wording, a tiny bit of copy repetition that could drift, but immaterial.
- Follow-up: none

## 2026-07-14T11:01:37Z — home-recently-viewed-alert-banner — score 4/5
- Strengths: Correct and disciplined — initial `hidden` state means SSR/first render emits the fallback, so fresh visitors keep the original band with no hydration mismatch, and the personalized/generic paths never stack; thoughtfully moved `text-center` from the outer container onto the fallback's inner `<div>` so the left-aligned banner isn't force-centered; `fallback` prop added with a clear doc comment and no touch to the out-of-scope derive/match-count/dismiss internals.
- Weaknesses / risks: Async `getAlertMatchCountForSourcePath` means a returning visitor briefly sees the generic band, then it swaps to the personalized banner (a small flash the spec's "byte-for-byte" wording glosses over); the personalized state also drops the section's `<h2>` (uses a `<p>`), a minor a11y/heading-outline nit — both immaterial.
- Follow-up: none

## 2026-07-14T09:05:43Z — admin-alerts-scoreboard — score 4/5
- Strengths: Excellent judgment — audited the backlog's `source`-column assumption against the live DB, found it false, and re-scoped honestly (page-family buckets, not fabricated per-widget numbers); page mirrors `/admin/monetization`'s bar-list/computed-at/empty-state conventions exactly; pure `classifySourcePath` split into its own DB-free unit-tested module (precedent: alertFrequency/alertEditCriteria) with clear comments on the active+confirmed dual-vocabulary and confirmed_at→created_at fallback.
- Weaknesses / risks: `getAlertScoreboard` selects all `alerts` rows unbounded — Supabase's implicit 1000-row PostgREST cap would silently undercount a page whose whole purpose is honest totals (immaterial at current volume, latent at scale).
- Follow-up: none

## 2026-07-14T07:47:04Z — compare-tray-alert-capture — score 4/5
- Strengths: Faithfully meets every acceptance criterion; deduped-by-sourcePath helpers mirror the curated `/aircraft/compare` page's shape/section markup and reuse `AlertSignup` + `resolveMakeModelFamily` cleanly (URLSearchParams even encodes safer than the sibling's raw interpolation).
- Weaknesses / risks: None material — only a cosmetic redundant `className=""` (matches the sibling's own pattern); partnership/aircraft query sourcePaths are an established convention the cron already parses.
- Follow-up: none

## 2026-07-14T06:35:15Z — alert-vacation-mode — score 4/5
- Strengths: faithfully reuses resolveOwnerEmail trust boundary + the snoozeAlert paused_until missing-column fallback; email-scoped bulk update; smart dateApplied honesty flag and hydration-safe client date computation.
- Weaknesses / risks: minor — resumeAll gives no user feedback on a 0-row no-op (unlike pauseAll's "Nothing to pause"), and the ≥2-alerts render gate is looser than the spec's "≥1 confirmed/paused" (guarded only inside the component's null-return).
- Follow-up: none

## 2026-07-14T06:09:33Z — deals-page-alert-capture — score 4/5
- Strengths: Faithful, minimal, correctly-scoped — verified `deal=good` is already first-class in alertEditCriteria/seo/aircraftComps so the "zero cron changes" claim holds; the checkbox-hide guard `!sourcePath.includes('deal=good')` is threaded through every `showDealOnlyOption && dealOnly` use of `withDealOnly`, so the already-`deal=good` path never double-appends `&deal=good`; empty-state (matchCount 0) handled by AlertSignup's own copy; captured desktop+mobile screenshots; comments match this codebase's heavily-documented convention.
- Weaknesses / risks: `matchCount={deals.length}` is capped at `fetchUnderMarketDeals(48)`, so on inventories with >48 below-market listings the box's "N match right now" copy understates the true count the alert will actually fire on — a small honesty nuance (inherited from the spec's own "exact count rendered as cards" direction, not a judgment miss); `context="good deal"` also yields slightly awkward "a new good deal aircraft" body copy.
- Follow-up: none

## 2026-07-13T11:40:55Z — recently-viewed-alert-banner — score 4/5
- Strengths: Faithful, well-scoped implementation — SSR-safe localStorage log with input-validating read + fail-soft writes (mirrors localSaves.ts's no-PII honesty precedent), the derive helper reuses savedAlertContext's exact plurality/tie-break rule plus a stricter ≥3-cluster bar, honesty-gated to only render on a live match count > 0, per-context dismiss persistence, clean cancelled-effect guard, and a genuinely thorough 8-case node:test suite covering the cluster bar, ties, model-vs-make sharpening, noun plurality and scoping.
- Weaknesses / risks: The "skip when redundant with the active search" gate compares the bare "Make Model" string by exact equality against describeAircraftFilters' much richer description, so it only suppresses the banner when make/model are the *only* active filters — add any filter (state, price) and a near-duplicate alert box can co-render with the footer box; also topByPlurality is duplicated from savedAlertContext.ts rather than exported/reused as the spec's scope line asked (justified in-comment by node's extensionless-import limitation, but the spec's savedAlertContext.ts edit never happened).
- Follow-up: none
## 2026-07-13T10:55:06Z — alert-instant-first-digest — score 4/5
- Strengths: Faithful, well-scoped implementation of the spec — reuses the exact `getAlertDigestPreview` helper "Send sample" uses, the `result.sent || result.reason === 'no-key'` last_digest_at stamping mirrors the alert-digest cron byte-for-byte, and the pending→confirmed lookup-before-update correctly gates the instant send to a genuine first confirm; the `firstSend` email framing is honest ("N matches right now … the moment you confirmed", no Sample prefix/banner), guarded by `isFirstSend = !isSample && !!firstSend` so sample framing always wins, with the graceful `frequency`-column fallback retry matching sendSampleDigest/cron and fire-and-log error handling that never blocks the redirect; doc comments are excellent and tests cover both the framing and the sample-precedence case.
- Weaknesses / risks: The rewrite splits the old atomic UPDATE...select into a non-atomic SELECT-then-UPDATE, opening a small TOCTOU window where two concurrent clicks on a still-pending confirm link both read status='pending' and each fire the instant digest — a rare double-send (the "re-click an *already-confirmed* link" acceptance case is still correctly handled). Non-material.
- Follow-up: none

## 2026-07-13T10:32:24Z — alert-aircraft-filter-honesty — score 4/5
- Strengths: Faithful, well-scoped honesty fix — `min_tt`/`airport`/`model_like` matching is byte-for-byte identical to `fetchAircraftPage`'s own logic (same `${...replace(/[%,]/g,'')}%` ilike-injection guard, same coarse airport→state resolution with graceful no-op when the ICAO isn't in `airports`, same `ttaf` gte), all four filter sites updated in lockstep, excellent doc comments explaining the `modelLike` vs `modelPattern` distinction and why aircraft has no radius helper; correctly defers `q`/`grade`/`avionics` to the separate backlog item.
- Weaknesses / risks: Perpetuates the pre-existing 4-way duplicated aircraft filter block (the non-deal `countNewAircraft` path re-inlines the same conditions rather than reusing `applyAircraftFilters`, so the two must be hand-synced forever), and `alertMatchCounts` re-runs the `airports` lookup per call (count + preview) instead of resolving once like the digest route does — both minor, neither a correctness issue.
- Follow-up: none

## 2026-07-13T07:47:35Z — alert-widen-nudge — score 4/5
- Strengths: Honest, tightly-scoped slice that fully reuses the edit path (`buildAlertCriteriaUpdate` + `updateAlertCriteria` action, same ownership/validation) — the honesty gate is real: it re-verifies the widened `source_path` with `getAlertMatchCount` and only surfaces a button when the server proves >0 matches now, with `noun` types (`'listing' | 'pilot'`) matching the count helper exactly; `computeWidenCandidate` is a clean pure single-step loosener covering all three editable shapes; and the "render for every eligible row, not just dead ones" stable-mount decision (so the `applied` confirmation survives the post-widen server refresh) is genuinely thoughtful and well-commented.
- Weaknesses / risks: `parseEditableAlertTarget` + status/count gating is computed twice per alert (once in the `widenSuggestions` map, once in the render loop) — mildly redundant, and a minor verb-agreement copy nit ("1 listing match" should read "matches"). None material.
- Follow-up: none

## 2026-07-13T06:46:50Z — alerts-manage-watch-status — score 4/5
- Strengths: Honest, well-scoped watch-status slice — reuses the digest's `resolveListingWatch` conventions exactly (same table, same `status !== 'active'` semantics, identical `[year, make, model].filter(Boolean).join(' ') || 'This aircraft'` label), null-safe `.maybeSingle()` so a deleted/sold row resolves to `active: false` instead of throwing or blanking, correct `formatPrice` (dollars, no /100), non-watch rows and Edit affordance byte-for-byte untouched, and thoughtful "why this is separate from alertMatchCounts" comments.
- Weaknesses / risks: `isListingWatchPath` is exported but consumed nowhere — a dead public helper (spec-mandated, so borderline); the `\?watch=price$` regex is stricter than the digest's `URLSearchParams`-based parser, so it silently stops matching if the fixed source_path shape ever gains a param; minor copy nit — a null asking_price renders "Watching: {label} — Contact for price today".
- Follow-up: none

## 2026-07-12T12:10:48Z — alert-capture-viewed-event — score 4/5
- Strengths: Clean, well-scoped impression instrumentation — observer on the outer `<section>`/form so it fires regardless of funnel state per spec, correct fire-once guard (`viewedRef` + `disconnect()`), SSR-safe (`typeof IntersectionObserver` check), proper cleanup, same field shape as `alert_subscribed`, and thoughtful "why" comments; two near-identical blocks but extracting a hook for only 2 call sites would be over-engineering.
- Weaknesses / risks: `threshold: 0.5` means a capture box taller than a small mobile viewport can never reach 50% intersection ratio and would never fire, undercounting the denominator on exactly the below-the-fold mobile placements this targets; minor join nuance — impression logs base `sourcePath` while `alert_subscribed` logs `effectiveSourcePath` (may carry `deal=good`), so the two won't key-match exactly when deal-only is toggled (defensible, since impression is pre-interaction).
- Follow-up: none
- Strengths: Honest enrichment — reuses the existing admin fetch, follows `/alerts/manage`'s frequency graceful-degrade retry precedent, correct noun (listing/pilot) and plurality ("1 pilot matches" / "3 pilots match"), truthful zero-case, and no crash risk since `getAlertMatchCount` swallows its own errors to null; scoped to one file per spec, no schema change, other states untouched.
- Weaknesses / risks: Partial deviation from acceptance criterion #3 — when the frequency column errors or the count returns null it still renders enriched cadence copy ("a weekly digest…") rather than the spec's stated static fallback; stays honest only because 'weekly' is the true system default when the column is absent (`normalizeFrequency` default), which is correct but undocumented at the call site.
- Follow-up: none

## 2026-07-12T10:50:41Z — saved-page-alert-capture — score 4/5
- Strengths: Pure, well-documented `deriveSavedAlertContext` helper with a correct plurality/tie scan (each new max resets the `tied` flag, so no false ties or missed ties across orderings) that honestly returns null on a tie or empty makes; seeker saves deliberately excluded with a reason; all four placements wired (signed-in list + empty-state, device list + empty-state) reusing existing `AlertSignup` props with zero changes to it; server `deriveSavedAlertContext` mirrored client-side via `useMemo`, matching each file's conventions.
- Weaknesses / risks: none material — noun tiebreak silently defaults to 'aircraft' and the generic fallback hardcodes `sourcePath="/"`, both reasonable.
- Follow-up: none

## 2026-07-12T09:52:41Z — alert-list-unsubscribe-header — score 5/5
- Strengths: Exactly the spec, no more — pure `buildListUnsubscribeHeaders` returns `undefined` (not `{}`) so callers spread cleanly and non-alert sends stay header-free, `sendEmail` conditionally injects the Resend `headers` field with zero behavior change otherwise; the GET→POST refactor extracts a shared fail-soft `applyUnsubscribe` leaving GET's redirect path byte-for-byte identical, and the POST handler correctly returns a fast non-interactive 200 per RFC 8058; all four send sites (confirm, resend, manage-link, digest/price-drop) wired, manage-link's previously-uncomputed URL built from the in-scope token; tests cover both helper branches; comments match the file's voice.
- Weaknesses / risks: none material — POST returns 200 even for an invalid/unknown token (a defensible RFC-8058 choice to avoid client retries and not leak token validity, though it diverges slightly from GET's 'invalid' signalling).
- Follow-up: none
- Strengths: Faithful mirror of the `fetchNewPartnershipSamples`/`countNewSeekers` precedent — `fetchNewSeekerSamples` reproduces the seeker filters exactly (make `overlaps`, state `eq`, the `additional_airports`-aware icao `.or()` with the same graceful-degrade retry, and the JS `matchesModelFilter` free-text model match), `toSeekerDigestSample` honestly emits no fabricated price/ttaf/photo with sensible title/location fallbacks, the specs line cleanly prioritizes `lookingFor` over `shareType`/`ttaf` in both HTML and plain-text, and the GET wiring correctly gates on `newCount > 0` with no price-drop path for seekers; scope respected and the out-of-scope P1 buy-in-drop email was deferred.
- Weaknesses / risks: none material — the query-building is duplicated between the main call and the icao retry (an already-accepted project pattern in `countNewSeekers`), and the empty-`<p>` price guard would technically alter output for any *aircraft/partnership* sample with a null price, a harmless deviation from the "byte-for-byte unchanged" claim that only bites a degenerate case.
- Follow-up: none

## 2026-07-12T09:05:26Z — returning-subscriber-nav-state — score 5/5
- Strengths: Textbook mirror of the shipped `localSaves.ts` pattern — SSR-safe `hasWindow()` guard, try/catch fail-soft, an idempotent boolean-only setter that fires a custom same-tab event, and a Nav effect that reads the flag *after* mount (so first render matches server HTML — no hydration mismatch) and listens on both the custom event and native `storage` for cross-tab; the marker component is correctly rendered only inside the resolved-owner return branch (the signed-out dead-end returns earlier without it), all three nav surfaces switch, and the mobile top button smartly keeps its terse "Alerts"/"My alerts" instead of reusing the "Get alerts" label. Privacy discipline is exactly as specced: boolean only, no token/email/PII, and manage still proves ownership itself.
- Weaknesses / risks: none material — the flag is never cleared on unsubscribe or sign-out, so a former subscriber's nav keeps saying "My alerts"; harmless (manage re-proves ownership and renders a clean empty state, no data leak) and explicitly out of scope.
- Follow-up: none

## 2026-07-12T07:44:46Z — alerts-manage-cross-sell — score 4/5
- Strengths: Disciplined mirror of the shipped `AlertCrossSell`/`subscribeToConfirmedAlert` precedent — the new server action reuses the exact `resolveOwnerEmail` (session-or-token) ownership proof every other manage-page action uses and the same idempotent-on-23505 insert, the client component is a faithful copy of the existing one-click accept/dismiss/done/error UI, and the page loop is honest: sources suggestions only from `confirmed` alerts, dedups the candidate `sourcePath` against *all* the visitor's alerts (so paused ones aren't re-offered), and renders at most one box — no forced/duplicate suggestion, correct empty state.
- Weaknesses / risks: none material — the per-alert `getCrossSellSuggestion` calls run sequentially in a `for…await` loop (each may fan out to several `getAlertMatchCount` queries), just above a `Promise.all` doing the parallel thing for match counts; negligible at realistic alert counts but a minor missed-polish inconsistency. Sibling-model suggestions insert a path-segment `source_path` that the parser can't re-read, so the 182→210 chain dead-ends — documented, matches status-page behavior, not a bug.
- Follow-up: none

## 2026-07-12T07:32:00Z — footer-alerts-link — score 5/5
- Strengths: Exact, minimal execution — one object appended to the top of the existing `exploreLinks` array, rendered through the same `.map` as every sibling link so desktop/mobile and a11y come for free with zero new markup; label "Get email alerts" is action-oriented and consistent with neighbors ("Browse partnerships", "Post a partnership") rather than the blander "Email alerts" the spec floated; no other footer link/section touched, and the landing-copy audit was correctly resolved as a documented no-op rather than a silent skip.
- Weaknesses / risks: none material — trivially scoped change with no edge cases to miss.
- Follow-up: none

## 2026-07-12T06:38:17Z — partnership-alert-radius-match — score 5/5
- Strengths: Exact, disciplined spec adherence — reuses the existing `getAirportsWithinRadius` haversine helper (same one the live search page uses) instead of reinventing, adds a well-documented `resolveIcaoList` per file (honoring each file's "deliberately separate parser" precedent), and swaps `.eq`→`.in` in all 4 queries; backward-compat is precise (the `radius > 0` guard makes `radius=0`/absent fall back to exact-ICAO), the parse lands only in the bare-`/partnerships` branch so seeker and `near/[icao]` paths stay untouched, and it was live-verified against prod (KHWD radius=50 → 4 vs 2 exact).
- Weaknesses / risks: none material — the inherited perf cost (`getAirportsWithinRadius` full-scans the `airports` table once per matching alert in the cron loop) is real but explicitly out of scope and pre-existing, not introduced here.
- Follow-up: none

## 2026-07-11T12:45:16Z — price-drop-email-live — score 4/5
- Strengths: Faithfully hits every acceptance criterion with disciplined scoping — the drop-only branch fires exactly on `target.type==='aircraft' && newCount===0 && dropCount>0`, transitively encoding opt-in (`dropCount` is forced to 0 when `priceDropOptIn` is false, so no redundant guard) and never suppressing new-listing info; `pickBestPriceDropSample` is a clean pure helper that selects the largest *genuine* % decrease and correctly disqualifies missing/flat/increased prices; the `bestDrop ?` fallback to the aggregate digest when nothing qualifies is a real graceful-degrade safety net; and the honesty fix (new `periodLabel`, default "this week" / "yesterday" for daily, plus a test asserting the text never says "just dropped") is well-judged for a cron that is never real-time. Helper tests cover largest-%, disqualification, and empty/all-disqualified cases.
- Weaknesses / risks: The route-level selection branch itself (choosing `buildPriceDropEmail` vs `buildAlertDigestEmail`) has no test — only the extracted helper and the template are unit-covered, so the wiring/opt-in gating is verified by reading, not by a test; and `bestDrop.previousPrice as number` / `price as number` casts lean on the helper's non-null invariant rather than a narrowed type, a minor fragility if the helper contract ever drifts.
- Follow-up: none

## 2026-07-11T11:25:28Z — saved-search-alert-button — score 4/5
- Strengths: Hits every acceptance criterion with disciplined scoping and a faithful reuse of the `subscribeToConfirmedAlert` precedent — `subscribeSavedSearchAlert` is auth-gated, looks the saved search up on the *user-scoped* server client AND `.eq('user_id', user.id)` (belt-and-suspenders RLS), inserts a `status='confirmed'` alert for the account's own verified email with matching tokens/`confirmed_at`, and treats `23505` as idempotent success so re-click/reload never duplicates or errors; `getAlertedSourcePaths` correctly uses the service-role admin client (mirroring `/alerts/manage`, since `alerts` has no authenticated SELECT policy) to pre-hydrate the button's subscribed state; button covers idle/pending/error/done states, is mobile-safe (`flex-col sm:flex-row`, `shrink-0`), and fires `alert_subscribed` with `source: 'saved_search'` matching the `cross_sell`/`AlertSignup` convention; and the false `/account` + `/searches` copy is replaced with honest, link-guided wording.
- Weaknesses / risks: The `source_path` string `${path || '/partnerships'}?${search_params}` is hand-built in three places (action insert, `searches/page.tsx` subscribed-check, and implicitly the stored value) that must stay byte-identical for the "already subscribed" hydrate to work — a shared helper would remove the fragile coupling; and two saved searches with identical filters but different names collapse to one `source_path` (second click is a silent idempotent no-op, both rows then render "Alerts on"), an acceptable but undocumented edge.
- Follow-up: none
- Strengths: Faithful, tightly-scoped port of the shipped `/partnerships/[id]` pattern to the one listing type that lacked it — `generateMetadata` reuses the existing `getSeeker` loader, honest null-safe description (`s.description?.slice(0,155) ??` a real-fields fallback: location + `max_buy_in`, no fabrication), correct `DEFAULT_OG_IMAGE` fallback with an inline comment explaining seekers have no real photo, canonical/openGraph/twitter all present; `ShareListingButton` wrapped in the same `flex items-center gap-2` as the sibling page next to the existing Save button; all referenced fields (`title`, `description`, `home_airport`, `city`, `state`, `max_buy_in`) verified against `PartnershipSeeker`; no PII introduced; and good judgment in scoping — discovered the other two types already shipped and updated BACKLOG.md accurately rather than re-doing work.
- Weaknesses / risks: Inherited-from-convention only — the 155-char `slice` hard-truncates mid-word with no ellipsis (slightly ugly unfurled cards for long descriptions), and an empty-string `description` (`''`) would pass the `??` guard and emit an empty meta description; both also present on the sibling pages, so not a regression.
- Follow-up: none

## 2026-07-11T10:18:06Z — alert-cross-sell — score 4/5
- Strengths: Meets every acceptance criterion with disciplined scoping and honest defaults — `subscribeToConfirmedAlert` faithfully mirrors `subscribeToAlerts` (admin client for PII-protected `alerts`, plain INSERT + `23505`-as-idempotent-success, per-email tokens) and correctly requires the original row's `status === 'confirmed'` so the confirm_token proves inbox ownership before inserting a second already-`confirmed` row (no redundant opt-in email); `getCrossSellSuggestion` is a clean pure helper that deliberately returns null for legacy path-segment, no-make, and seeker alerts rather than fabricating a weak suggestion; confirm-route token forwarding accurately mirrors the unsubscribe convention; UI is dismissible, pending/error/done states covered, mobile-friendly (`max-w-sm`), and both suggested `source_path`s (`/aircraft?make=`, `/partnerships?make=`) are shapes the digest's `parseSourcePath` already handles.
- Weaknesses / risks: `noun` on `AlertCrossSellSuggestion` is computed/stored but read by no consumer (dead field); minor `context` asymmetry — aircraft→partnership writes "{make} co-ownership partnerships" while partnership→aircraft writes just "{make}", so the done-copy "You're set for {make} too" reads vaguer in one direction and the digest body ("a new {make} co-ownership partnerships listing") is slightly awkward — cosmetic, not functional.
- Follow-up: none

## 2026-07-10T06:10:03Z — seeker-model-filter-make-scoped — score 4/5
- Strengths: Exact spec hit and disciplined scoping — `getSeekerModels(makes = [])` mirrors `getSeekers` byte-for-byte on both branches (mock path uses the same `toLowerCase()` Set filter as lines 84-85; live path uses the same `.overlaps('preferred_makes', makes)` as line 120), so casing/OR semantics stay consistent by construction; no schema change, no extra round-trip (same call site), empty-`makes` short-circuits to prior behavior; the three stale "not linked in the data" comments (jsdoc, prop, inline) are all rewritten accurately, honestly preserving the "tokens still aren't per-make within a row" caveat.
- Weaknesses / risks: page.tsx reimplements `parseMulti` inline (`split/trim/filter`, minus the `new Set` dedupe) because that helper isn't exported — harmless for `.overlaps` but a small duplication that could drift from the canonical parser.
- Follow-up: none
- Strengths: Exact-parity slice that closes the one gap the previous cycle explicitly flagged — reuses `MonetizationIntent` verbatim (same `path="broker"`, same title, `joinWaitlist`/`monetization_intent` event untouched), touches only `src/app/aircraft/page.tsx`, and gates on `itemListListings.length > 0` matching the `AlertSignup` gate right above it so it never clutters an empty result page; description copy is thoughtfully adapted ("your next aircraft" vs the detail page's "this aircraft") since the browse page isn't item-specific; clear comment, sensible `mt-4` spacing, zero new component/dep/schema — textbook scoping.
- Weaknesses / risks: none material
- Follow-up: none

## 2026-07-09T08:40:23Z — match-alert-digest — score 4/5
- Strengths: Faithful, careful mirror of the existing `alert-digest` route — same CRON_SECRET gate, 7-day window, `result.sent || reason==='no-key'` timestamp-advance guard, and per-side error logging; reuses the shipped `getMatching*`/`*BrowseHref*` helpers with zero new matching logic; correct `42703` (undefined_column) detection that re-throws to a clean `{skipped:'migration-pending'}` 200 no-op so it can never resend/spam pre-migration; only advances `match_alert_last_sent_at` on a real send; types + mockData + additive schema (human-flagged) + vercel cron all updated; good docstrings.
- Weaknesses / risks: `getSeekers({})`/`getPartnershipListings({})` are re-fetched (full-table + repeated airport-coord resolve) once per listing row rather than hoisted — O(rows) full pulls, immaterial at today's tiny volume but real at scale; freshness filter is a JS string compare (`s.created_at >= since`) with mixed offset formats (`Z` from `toISOString()` vs PostgREST `+00:00`) where the reference does a DB-level `.gte` — only diverges on sub-second ties, so harmless in practice.
- Follow-up: none

## 2026-07-09T07:18:18Z — alert-unsubscribe-recover — score 4/5
- Strengths: Tight, well-scoped slice that hits every acceptance criterion — `pauseAlertByToken` correctly does NOT reuse `loadOwnedAlert` (proves ownership via the `unsubscribe_token` the email already carries, admin client, same recoverable `paused` state as the authed flow), returns the exact `{error}`/`{ok}` shape the codebase's other alert actions use; route only forwards the token on the `unsubscribed` state and `encodeURIComponent`s it; client component handles idle/sending/done/error with a soft error, disabled state, and the required `alert_unsubscribe_recovered` PostHog event; no schema change, no touch to the authed manage flow.
- Weaknesses / risks: A *reused* (still-valid) token re-pauses and returns `{ok}` rather than the "soft error" acceptance-criterion #4 implies for reuse — benign (UI has already swapped to the done state after first click) but a minor semantic gap; unlike `pauseAlert` there's no current-status guard, so a crafted URL could flip a `confirmed` alert to `paused`, harmless since it needs the secret token.
- Follow-up: none
- Strengths: Clean, symmetric both-directions change that reuses the EXACT `MarketplaceCrossSell` mini-rail markup (`flex gap-3 overflow-x-auto` + `<li className="contents">` + fixed-width `shrink-0` RailCards); samples come from the same query as count/minPrice (no extra round-trip, correct match-level), self-suppress-at-0 preserved; genuine in-scope bonus fix — added the missing `min-w-0` to the partnership sidebar grid column (mirroring the aircraft-listing counterpart) that the new fixed-width rail would have overflowed on 375px.
- Weaknesses / risks: Count/minPrice query was widened from `select('id, asking_price')` to `select('*')` on up to 200 rows just to surface 3 samples — a small payload regression accepted to honor the no-extra-round-trip constraint; the in-memory dev fallback branch slices samples without the `created_at` ordering the DB branch applies (cosmetic inconsistency only).
- Follow-up: none

## 2026-07-09T06:49:09Z — rail-card-rare-find-parity — score 4/5
- Strengths: Faithful mirror of AircraftSaleCard's honesty-gated chip — exact copy/threshold/guard, correct null & count-incl-self handling, mutual-exclusivity reasoning sound, DealsRail rightly left inert; clean reuse of already-fetched allComps.
- Weaknesses / risks: Diverges from spec (duplicates RARE_FIND_MAX + isRareFind logic + tooltip copy instead of exporting/reusing), and the stated RSC-boundary reason for not importing a plain constant is overstated — mild sync-drift risk across the two cards.
- Follow-up: none

## 2026-07-08T13:13:51Z — homepage-alert-band — score 4/5
- Strengths: Exactly the spec's scope — one purely-additive `<section>` slotted between DealsRail and the explore cards, reuses `AlertSignup sourcePath="/"` (no context → correct general copy) with zero schema/action/dependency changes; Tailwind matches neighbouring sections verbatim (`text-2xl font-bold text-slate-900 sm:text-3xl`, `max-w-2xl`, responsive px), `text-left` override is deliberate for the card, and mobile is safe (form is `flex-col sm:flex-row`, sr-only label already in the component).
- Weaknesses / risks: The wrapper adds its own `<h2>` + subcopy ("…we'll email you the moment it's listed") directly above `AlertSignup`, which renders its own `<h2>` ("Get new-listing alerts") + near-identical subcopy — two stacked h2s and duplicated messaging, slightly wordy and awkward heading semantics; not material.
- Follow-up: none
## 2026-07-08T12:35:04Z — aircraft-list-map-sync — score 4/5
- Strengths: Faithful, idiomatic port of both partnerships sync slices — every scope item met; the tricky cluster-focus path is preserved verbatim (poll for marker ref + `__parent` before `zoomToShowLayer`, focusNonce so a repeat click re-fires, spiderfy-then-openPopup), event listeners + highlight timers are all torn down, the Set stays server-side so only a boolean crosses the RSC boundary, and `onMap` is honestly gated to the one map-bearing call site.
- Weaknesses / risks: The ~30-line focus-polling effect (markersRef/clusterRef/`__parent` poll) is now copy-pasted verbatim across AircraftLeafletMap and PartnershipsLeafletMap — a genuine drift risk if the leaflet-cluster timing hack ever needs a fix, though consistent with the codebase's per-page-component convention.
- Follow-up: none
## 2026-07-08T12:16:16Z — aircraft-map-search-area — score 4/5
- Strengths: Faithful, idiomatic port of the partnerships slice — MapController + gated "Search this area" button, extracted AircraftResultCount, cn()-based card hiding, unmount cleanup and event-listener teardown all clean; pins reuse itemListListings (no extra query) and unfiltered copy is preserved verbatim.
- Weaknesses / risks: Filtered line "Showing M of N in this map area" uses N = full DB total (page size 60) while the map only ever holds the current page's ≤60 pins, so with >60 results it reads e.g. "Showing 8 of 340" when 340 pins can never exist on that map — a semantic mismatch partnerships (radius-scoped) never surfaced.
- Follow-up: Pass the count of on-page pinned/rendered listings (or itemListListings length) as the "of N" denominator in the filtered AircraftResultCount state instead of the paginated DB total.

## 2026-07-08T11:36:15Z — match-count-travel-radius — score 4/5
- Strengths: Tight, correctly-scoped slice — `isWithinTravelRadius` is honesty-gated exactly like every `isCompatibleMatch` criterion (missing radius/coords never disqualify), coords are batch-resolved once per query (no N+1), `isCompatibleMatch` left untouched with its 9 tests intact, and 3 clear near/far/missing worked-example tests added.
- Weaknesses / risks: haversineNm is now triple-duplicated (airports.ts, nearbyPartnerships.ts, matching.ts) — justified & documented (keeps matching.ts free of @/-alias value imports so its tests run under node strip-types) but still drift-prone; also deviates from spec (which said export from airports.ts, not duplicate) and the coord lookup uses `.toUpperCase()` without the `.trim()` that resolveAirportCoords applies, so a whitespaced airport code silently falls through the honesty gate (harmless, never over-counts).
- Follow-up: none

## 2026-07-08T11:24:11Z — profile-base-favorite-airports — score 4/5
- Strengths: Faithful to spec — validates every ICAO against the real airports table (mirrors createPartnership), dedupes/caps favorites at 3, drops a favorite matching the base, and has graceful column-not-migrated fallbacks on BOTH the write (retry without favorite_airports) and read paths; upsert onConflict:'user_id' matches saveAvatarConfig exactly, reuses AirportFormInput (which submits the resolved ICAO so exact-match validation is correct), and the client form covers idle/saving/saved/error states with a role="alert" and proper htmlFor label.
- Weaknesses / risks: The read-side fallback keys off `!profile` rather than an error, so it (a) always fires a second redundant query for brand-new users who simply have no profiles row, and (b) would silently mask a genuine non-column select error by re-querying — minor robustness smell, no user impact.
- Follow-up: none

## 2026-07-08T10:54:11Z — saved-page-social-proof-parity — score 4/5
- Strengths: Correct pure data-wiring; familyCount recorded independent of comp/deal (fixes the rare-family exclusion), active-only aircraft filter avoids off-by-one, `/saved` is the sole caller so the broadened verdicts map carries no regression, clean conventions, zero component churn.
- Weaknesses / risks: Spec called for save-counts "in parallel with the existing comp-verdict fetches" but the Promise.all sits after three sequential comp-verdict awaits — a 4th serial DB barrier, minor added latency (only the 3 save-count calls parallelize among themselves).
- Follow-up: none

## 2026-07-08T10:43:45Z — aircraft-rare-find-chip — score 4/5
- Strengths: Correct and honest — reuses the already-computed `familyCompMap` (zero new query/schema), and the "0 = failed load, never render" invariant genuinely holds because the browse query and comp map share the exact same `status='active'` + `asking_price >= BUYER_PRICE_FLOOR` filters, so a rendered listing is always in its own family; `familyCount` is unfiltered by user filters so it reflects true market rarity not the filtered view; `RareFindChip` matches surrounding chip styling/accent conventions exactly and `isBrandNew`/`RARE_FIND_MAX` are well-documented with clear reasoning.
- Weaknesses / risks: "Rare find — only 1 like this" reads slightly oddly when the count includes the listing itself (there are zero *others* like it); copy nuance only, tooltip clarifies, not material.
- Follow-up: none
- Strengths: Correct and tightly scoped — all 7 `path` keys match the live CTAs exactly, `getMonetizationTally()` faithfully mirrors the `bayAreaCoverage.ts` admin-client pattern, query `.in('source', paths)` aligns with `joinWaitlist`'s `source` upsert, share/max math is guarded against divide-by-zero, both per-row 0s and an overall empty-state render, and the honesty copy (opt-ins ≠ raw clicks, "at least this high") is genuinely well-judged.
- Weaknesses / risks: `waitlist` upserts on `email`, so a pilot who opts into multiple paths has only their latest `source` retained — counts can misattribute/undercount across paths, a real caveat the "distinct people who left an email for that path" copy slightly overstates; inherited from schema, not introduced here.
- Follow-up: none

## 2026-07-08T10:11:31Z — monetization-services-cta — score 4/5
- Strengths: Textbook fake-door slice — one file, +40 lines, reuses the shipped `MonetizationIntent` component and `joinWaitlist` action verbatim with zero schema/backend change; every prop (path/label/title/description/className) matches the component signature, the four `path` values (financing/insurance/escrow/prebuy) are distinct so `track('monetization_intent',{path})` and the `joinWaitlist` `source` differ per button as the spec demanded, copy is consistently honest ("we're gauging interest before building this out") with no card claiming the service exists, and out-of-scope items (browse results, partnership page, admin tally) were correctly left untouched.
- Weaknesses / risks: The 20-token Tailwind className string is duplicated verbatim across all four buttons rather than hoisted to a local const — minor, matches the codebase's inline-className idiom; also the passed `title` prop only feeds the modal's aria-label (the `<h2>` is hardcoded in the component), so the per-button titles are effectively cosmetic — harmless, mirrors the broker CTA's own usage.
- Follow-up: none

## 2026-07-07T20:39:43Z — partnerships-map-clustering — score 4/5
- Strengths: Surgically-scoped fix for a real just-shipped bug (10 KPAO listings stacking invisibly) — wraps the existing `<Marker>` map in `<MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>` with the two required markercluster CSS imports and nothing else; the entire per-marker popup (make/model, airport·city/state, buy-in, "View listing →") is byte-identical, just re-indented, so single pins behave exactly as before; dependency choice is well-justified (react-leaflet-cluster 4.1.3 peer-declares react-leaflet ^5 / react ^19 / leaflet ^1.9, matching installed versions) and the PartnershipsMapView/page were correctly left untouched.
- Weaknesses / risks: Default `maxClusterRadius` (~80px) is unset, so at low zoom genuinely distinct-but-nearby Bay Area airports (KPAO/KSQL/KHWD) can merge into one bubble — arguably desired UX, but not deliberately tuned; screenshots confirm the KPAO-10 cluster and spiderfy work.
- Follow-up: none

## 2026-07-06T10:25:41Z — search-empty-state-alert — score 4/5
- Strengths: Textbook prop-threading across all three surfaces (aircraft/partnership/seeker) that reuses each page's already-computed alertContext/alertSourcePath (no new query, no schema touch), a genuinely thoughtful duplicate-suppression guard (itemListListings.length > 0) so the empty-state alert and the below-list AlertSignup never stack, the new AlertSignup className prop defaults to the old 'my-10' so every existing placement is byte-identical, and the scoping honestly audited + struck two backlog items found already-shipped; out-of-range (page>1) branch correctly left alert-free per spec.
- Weaknesses / risks: On an out-of-range /aircraft or /partnerships page (page>1, 0 rows) the below-list AlertSignup is now suppressed while the "no more on this page" branch shows no alert either, so that rare pagination-past-end state loses its capture entirely — negligible traffic, not worth a fix.
- Follow-up: none

## 2026-07-06T09:17:28Z — listings-completeness-nudge — score 5/5
- Strengths: Exactly-scoped single-file change that reuses the shipped AircraftTrustBadge/TrustBadge/SeekerTrustBadge (variant="compact") + evaluate*Trust with zero new scoring logic; I cross-checked every added .select() column against what each evaluator actually reads (aircraft: description/registration/ttaf/smoh; partnership: images/image_is_placeholder/registration/monthly_fixed/hourly_wet/description/source_url/poster_id; seeker: preferred_models/aircraft_category/max_buy_in/max_monthly/max_hourly/total_hours/ratings_held/poster_id) and all match — the chip counts will be real, not placeholders; local SeekerRow type retired in favour of the canonical PartnershipSeeker (all display fields still present), past-listings section correctly left untouched, comments explain why the extra columns are fetched.
- Weaknesses / risks: none material — only a cosmetic leftover double blank line where the SeekerRow type was removed; chip placed under the meta line rather than literally beside StatusBadge as the spec worded it, which reads fine.
- Follow-up: none

## 2026-07-06T07:42:09Z — partnership-model-multiselect — score 4/5
- Strengths: Faithful mirror of the /aircraft facets stack — getPartnershipFacets clones aircraft-facets.ts (count-ranked makes, alpha models, status='active', 5000 limit) and even adds a JUNK_MAKES sink; the .eq (single) / .in (multi) model split matches AircraftSaleList.tsx:529-530 verbatim, make-change clears stale model in both the filter and the chip removal, and per-model removable chips reuse the airports multi-chip pattern; tight scope, no schema, well-commented.
- Weaknesses / risks: Facet-empty fallback keeps free-text Make but hides Model entirely, so the old free-text model search is lost in that (rare, DB-empty/error) path; mock-mode facets build over all MOCK_PARTNERSHIPS without the status='active' filter the live query applies — both immaterial for production/live mode and the fallback is called out in the spec.
- Follow-up: none

## 2026-07-05T13:23:25Z — airport-hub-comp-verdicts — score 5/5
- Strengths: Faithful, minimal mirror of the proven getPartnershipCompVerdicts/getSeekerBudgetCheckVerdicts batch pattern — comp verdicts fetched once over the full allListings set (feeds both "Based at" and "Within 50 miles" sections), seeker verdicts over exactly the rendered seekersHere slice; prop optionality (budgetVerdict?) and `?? null` handling match /saved and /partnerships/near/[icao] verbatim; honesty-gating preserved by reusing the helpers; tight single-file scope, clear comment.
- Weaknesses / risks: none material — instantiates a second supabase client solely for verdicts, but each sibling surface does the same and there's no page-scope client to reuse.
- Follow-up: none

## 2026-07-05T12:36:24Z — seeker-form-live-auth-state — score 5/5
- Strengths: Byte-for-byte faithful port of the proven PostPartnershipForm live-auth block — correct isLoggedInProp rename, seeded state, getUser + onAuthStateChange sync, unsubscribe cleanup; tight single-file scope, clear comment, all existing isLoggedIn uses left untouched. Closes the Pillar 2 gap across all 3 post forms.
- Weaknesses / risks: none material — the live-auth block is now copy-pasted across all 3 post forms; extracting a shared useLiveAuthState hook is the obvious next refactor but correctly out of scope here.
- Follow-up: none

## 2026-07-05T11:42:13Z — partnership-form-live-auth-state — score 5/5
- Strengths: Exact, faithful mirror of the proven PostAircraftForm live-auth block — correct prop rename, seeded state, getUser + onAuthStateChange sync, unsubscribe on unmount; hooks already imported, tight scope, well-commented.
- Weaknesses / risks: none material — pattern is now duplicated across 3 forms; extracting a shared useLiveAuthState hook would be the natural next refactor but is out of scope here.
- Follow-up: none

## 2026-07-05T11:37:40Z — seeker-budget-check-range-bar — score 4/5
- Strengths: Faithful, tightly-scoped port of PartnershipMarketCheck's bar into the seeker panel (same hasRange guard, onBar clamp, median+deltaDollars budget recovery, role="img" aria-label, legend); spec correctly overturned BACKLOG's wrong "not the same shape" claim with file/line evidence that getSeekerBudgetCheck already returns low/high/percentile; copy correctly reframed to "your budget", zero-spread fallback preserves prior behavior, no schema/query/caller changes.
- Weaknesses / risks: This is now the THIRD verbatim copy of the ~40-line bar block (EstimatePanel + PartnershipMarketCheck + SeekerBudgetCheck) — the prior cycle's extraction follow-up wasn't taken, so drift risk grew; percentile ternary duplicated across sentence + aria-label; value-interpolated marker vs rank-based "above X%" copy can visually disagree (all inherited, not new).
- Follow-up: Extract a shared <PriceRangeBar> now consumed by all three panels — the third copy makes this overdue.

## 2026-07-05T10:42:23Z — partnership-market-check-range-bar — score 4/5
- Strengths: Faithful mirror of EstimatePanel's bar (identical markup, same median+deltaDollars subject reconstruction, role="img" + descriptive aria-label); percentile/low/high reuse the already-sorted comp set (no new query/honesty floor), correctly per-share-scaled and gated by MIN_OTHER_COMPS; hasRange guard cleanly avoids divide-by-zero and falls back to the plain-median copy; well-documented new interface fields — matches spec acceptance exactly.
- Weaknesses / risks: The ~40-line bar block is now duplicated verbatim across EstimatePanel and PartnershipMarketCheck (two copies will drift); marker is value-interpolated while the "above X%" text is rank-based, so they can visually disagree — both inherited from EstimatePanel, so consistent, not new.
- Follow-up: Extract a shared `<PriceRangeBar>` component consumed by both EstimatePanel and PartnershipMarketCheck to kill the duplicated markup.

## 2026-07-05T09:56:33Z — photo-upload-block-submit — score 5/5
- Strengths: Exactly matches spec — single shared `onUploadingChange` prop driven by a `useEffect` on `photos`, wired identically into both forms; correct label precedence, clear comments matching the file's existing token/mountKey idiom, edit forms covered for free.
- Weaknesses / risks: none material (`setUploadingPhotoCount` is a stable setter so the effect dep is safe; disabled button also blocks implicit Enter-submit).
- Follow-up: none

## 2026-07-05T09:48:00Z — photo-mid-upload-recovery — score 4/5
- Strengths: Clean mirror of the existing best-effort-storage pattern — new idbPhotoDraft.ts feature-detects indexedDB and swallows every error (true no-regression), the shared uploadEntry callback removes the old duplicated fetch/setPhotos block, resume is gated identically to the URL restore and respects MAX_PHOTOS across both paths via functional setPhotos, finally-deletes the pending record on settle, clears IDB on the gate-gone "Start over" branch, and even guards StrictMode double-invoke with a cancelled flag.
- Weaknesses / risks: removePhoto (individual X) doesn't delete the pending IDB record, so removing a photo during the ~1-3s in-flight window and reloading before it settles can resurrect it — narrow and self-healing (resume→settle→delete), but a semantic gap vs. the deliberate-remove intent.
- Follow-up: none

## 2026-07-05T09:16:39Z — launch-banner-honest-stats — score 4/5
- Strengths: Cleanly deletes both fabrications (VISITOR_BASE/charCodeAt visitor count and the Math.max floor) exactly per spec, uses raw seekerCount, drops the false location-scoping claim, and correctly guards seekerCount===0 with singular/plural ("1 pilot is" vs "N pilots are"); scope stayed to the one component, no dead code, subscribe form untouched.
- Weaknesses / risks: In the seekerCount===0 case the surviving sentence "Get email alerts when more post" reads with no antecedent ("more" of what) — minor copy smell only in the empty state.
- Follow-up: Reword the zero-seeker fallback so "when more post" has an antecedent (e.g. "when pilots post here").

## 2026-07-05T09:10:32Z — seeker-owner-nudge — score 5/5
- Strengths: Faithful line-for-line mirror of AircraftListingOwnerNudge — reuses evaluateSeekerTrust as the single source of truth (no redefined signals), SIGNAL_ACTIONS keys match the SeekerTrustSignal union exactly and correctly omit intrinsic member_posted, null-returns on complete listings (no nag), isOwner gate uses the exact `!!user && !!s.poster_id && user.id === s.poster_id` pattern, placement above the trust checklist matches convention, a11y icons aria-hidden; copy sensibly adapted to "helps owners trust it".
- Weaknesses / risks: none material
- Follow-up: none

## 2026-07-05T08:27:26Z — partnership-contactbar-owner-view — score 5/5
- Strengths: Exact-to-spec, mirrors the established Aircraft/Seeker pattern; early return placed after all hooks (order preserved), handles isSeed, and the mobile note is wrapped in the full sticky-bar container so it renders in position rather than bare inline.
- Weaknesses / risks: none material
- Follow-up: none

## 2026-07-05T07:12:46Z — seeker-post-analytics-parity — score 4/5
- Strengths: Precise mirror of PostAircraftForm — track() sits in the same spot (inside the try, just before the server action), same `listing_id: listingId` edit shape, and both create props (`home_airport`, `preferred_makes`) are genuinely present FormData fields (names verified at 478 / preferred_makes checkboxes), so no fabricated props; type-prefixed event names match the cleaner convention; single-file, no aircraft/partnership/schema churn.
- Weaknesses / risks: none material — like its siblings the event fires on submit *attempt*, so a server-side validation throw still counts as "submitted"; this is inherited parity behavior, not a regression.
- Follow-up: none

## 2026-07-04T13:28:23Z — partnership-deal-check-card-parity — score 4/5
- Strengths: Clean new `PartnershipCardVerdict` shape with correct dealVerdict-wins/plain-comp-fallback precedence; all 3 callers threaded correctly; browse card honestly labels each source (narrowed "Good deal" chip vs plain "~X% below/above market" pill); genuinely smart separate query/try-catch so the dormant ttaf/smoh migration degrades to the existing pill instead of killing the chip; matches conventions, no dead code.
- Weaknesses / risks: `SimilarListings` deviates from spec's "narrowed-only, mirror SimilarAircraft exactly" by adding a plain-comp fallback while `PartnershipRailCard` copy was relabeled to "Good deal"/"Priced high" on the (now false) premise the value "always comes from the narrowed verdict" — so on live data (ttaf/smoh dormant) every rail chip is a plain whole-family comp mislabeled as a year+hours Deal Check, unlike the aircraft rail which is truly narrowed-only.
- Follow-up: Either make the partnership rail narrowed-only (accept dormancy, true aircraft parity) or keep neutral "Below/Above market" copy on PartnershipRailCard when the chip comes from the plain `partnershipBuyInComp` fallback, so the rail never labels a whole-family comp as a Deal Check verdict.

## 2026-07-04T12:24:00Z — seeker-contactbar-privacy-copy-fix — score 4/5
- Strengths: Correct root-cause fix — verified showEmail/showPhone gate only on contactMethod (never login), so the "signed-in members only" claim was genuinely false; collapses the `!user` conditional to the single `displayName` line, reuses the component's existing "Reach out to" phrasing, leaves auth-gated messaging (handleSend redirect, draft preservation, button labels) and the still-used `user` state untouched. Tightly scoped, no dead code.
- Weaknesses / risks: none material — copy diverges slightly from sibling ContactBar's "Contact {name}" wording, but "Reach out to" matches this component's own prior tone and is arguably better.
- Follow-up: none

## 2026-07-04T12:14:33Z — edit-page-contact-prefill-parity — score 5/5
- Strengths: Exact parity with the three `new` pages — correct prop names/values, forms already consume them via `initialValues?.contact_* ?? user*` (listing's own value still wins), and edit pages correctly use non-optional `user.` since the auth gate guarantees presence. Minimal, well-scoped, no form/schema churn.
- Weaknesses / risks: none material — three-prop change duplicates the `new`-page wiring, but that mirror pattern is the existing convention.
- Follow-up: none

## 2026-07-04T12:03:53Z — partnership-dealsignals-annual-damage — score 4/5
- Strengths: Exact spec match — copy mirrors aircraft DealSignals verbatim, reuses the already-computed honesty-gated annual/damage reads, self-suppresses on null, and updates the panel doc comment (six→eight signals).
- Weaknesses / risks: Signal-row copy is now duplicated across `computeDealSignals` and `computeSignals` (two files to keep in sync) — intentional per spec and consistent with the existing mirror pattern, but a real drift risk over time.
- Follow-up: none

## 2026-07-04T11:31:43Z — seeker-card-budget-chip-severity-fix — score 5/5
- Strengths: Exact-target fix that resolves a real trust/honesty inversion — `below` now renders amber "Budget may be tight" and `above` emerald "Comfortably above typical", byte-for-byte matching `SeekerBudgetCheck`'s `VERDICT_META` colors and label intent; copy was rewritten to drop the borrowed "% below/above market" deal/no-deal framing that caused the miswrite, severity is carried in words (not color alone, so a11y holds), and scope stayed to the one file with the comp math / detail panel / partnership card correctly untouched.
- Weaknesses / risks: none material — card keeps its static `LineChart` icon for both verdicts where the panel uses directional `TrendingDown`/`TrendingUp`, so the icon doesn't reinforce direction, but that matches the card's own existing convention and color+copy already carry severity.
- Follow-up: none
- Strengths: Textbook parity port — `DraftIndicator` is a verbatim copy of the partnership/seeker version, `type DraftStatus` imported cleanly, all four status states handled with an `idle` default fallback, `aria-live="polite"` on the live states; scope held to the one file, purely additive/presentational exactly as spec'd, and the two lower-value audit runner-ups were correctly deferred.
- Weaknesses / risks: none material — the indicator is now triplicated across three forms rather than extracted to a shared component, but that matches the codebase's own established pattern and the spec explicitly chose verbatim copy.
- Follow-up: none

## 2026-07-04T09:23:45Z — photo-upload-signin-redirect — score 4/5
- Strengths: Clean, correctly-scoped fix that reuses the form's proven save-draft-and-redirect flow — factors `redirectToAuth()` out of `onFormSubmit` and threads it into the shared uploader via `isLoggedIn`/`onRequireAuth`; single `addFiles` guard covers browse/drop/paste, `openPicker` gates both click targets, and a11y label + empty-state copy update for the logged-out case; out-of-scope (photo-byte persistence, seeker form, API auth) is thoughtfully documented.
- Weaknesses / risks: `redirectToAuth` isn't memoized in either parent, so it's a fresh identity each render and churns the `addFiles` useCallback (harmless, just defeats the memo); logged-out empty-state keeps its drag/paste handlers, which is correct (they funnel to onRequireAuth) but slightly redundant with the copy change.
- Follow-up: none

## 2026-07-04T08:19:23Z — partnership-edit-placeholder-reset — score 5/5
- Strengths: One-line fix that makes the payload unconditional (`image_is_placeholder: photoUrls.length === 0`), exactly matching the proven `updateAircraftListing` pattern; correctly leaves the insert path out of scope.
- Weaknesses / risks: none material
- Follow-up: none

## 2026-07-04T07:45:55Z — partnership-card-ifr-badge — score 4/5
- Strengths: Faithful verbatim port of AircraftSaleCard's `IFR_CARD_CHIP`/`IfrCardBadge`/`showIfrBadge` recipe — same tier gate (`full`/`capable`), same conditional-vs-raw-chip branch, type import folded cleanly onto the existing `classifyAvionics` import; matches surrounding conventions with no dead code and correct spec-scoped behavior (equipped/basic/none still render raw chips).
- Weaknesses / risks: `computeIfrSuitability(avionicsCaps)` is called twice per card (once for `ifrTier`, again inside `IfrCardBadge`), and `IfrCardBadge` re-guards the tier already gated by `showIfrBadge` — a minor redundancy, but inherited verbatim from the AircraftSaleCard reference so it's consistent, not a regression.
- Follow-up: none

## 2026-07-04T07:20:22Z — partnership-ai-draft-partner-reqs — score 4/5
- Strengths: Faithful, correctly-scoped parity mirror — prompt/`input_schema`/return-mapping all add `min_hours` (integer) + `ratings_required`, `handleGenerate` fill + `hasOptional` auto-open both updated, `'never invent — omit'` wording preserved, matches surrounding one-liner style with no dead code.
- Weaknesses / risks: Chip highlight on AI-fill of `ratings_required` relies on the native `input` dispatch firing React's onChange mirror (no explicit `setRatingsRequired` on the fill path, unlike `toggleRatingRequired`) — inherited from the seeker `ratings_held` reference and presumably works, but the chip-state sync is the one path not directly verifiable from the diff.
- Follow-up: none

## 2026-07-04T06:34:13Z — partnership-ai-draft-annual-damage — score 5/5
- Strengths: Precise mirror of existing extraction pattern; defensive `YYYY-MM` regex guard on `annual_due`, correct `!== undefined` boolean handling, and `'change'` event matching the Select's `true`/`false` option values.
- Weaknesses / risks: none material
- Follow-up: none

## 2026-07-03T12:52:45Z — seeker-message-draft-persist — score 4/5
- Strengths: Faithful, disciplined port of the reviewed `AircraftContactButton` pattern to `SeekerContactBar` — reuses the generic `messageDraft.ts` (seeker-scoped `seeker:<id>` key) and the existing `getOrCreateSeekerThread`/`sendMessage` server actions with zero duplication or schema change; full spec coverage (draft persisted across `/auth`, auto-sent+cleared on `?contact=1` return guarded by `didAutoContact`, one-step send when already logged in, owner guard + email/phone paths untouched); tasteful extras carried over — Enter-to-send/Shift+Enter, focus-on-expand, `errorMsg` surface, disabled empty-send, and a context-aware "Send" vs "Sign in & send" label; the two logged-in/out branches were cleanly merged into one return without dead code.
- Weaknesses / risks: Inherits the exact weakness the sibling `aircraft-message-draft-persist` cycle was flagged for — both send paths `await sendMessage(...)` but discard its `{ error }` return and `clearMessageDraft` + navigate unconditionally, so a failed insert or an over-length body (textarea has no `maxLength`; action rejects >2000 chars) silently drops the very message the feature exists to preserve and lands the user on an empty thread. This was a known issue at port time and should ideally have been fixed here rather than duplicated.
- Follow-up: none

## 2026-07-03T12:23:57Z — aircraft-message-draft-persist — score 4/5
- Strengths: Delivers the full spec cleanly — CTA now expands to an inline compose box, draft is persisted across the `/auth` redirect and auto-sent + cleared the moment the thread is created on return (guarded by `didAutoContact` against double-fire, and cleared-after-send prevents double-send on later visits), immediate one-step send when already logged in, empty send blocked at both the `trim()` guard and the disabled button; the new `messageDraft.ts` faithfully mirrors `localSaves.ts` (SSR `hasWindow` guard, try/catch, single-key store, `satisfies PendingMessage`); nice touches — Enter-to-send with Shift+Enter newline, focus-on-expand, and a context-aware "Sign in & send" vs "Send" label; scope is disciplined (out-of-scope contact bars untouched, server actions reused as-is).
- Weaknesses / risks: Both send paths `await sendMessage(...)` but discard its `{ error }` return and clear the draft + navigate unconditionally — so a failed insert or an over-length body (textarea has no `maxLength`; the action rejects >2000 chars as "Invalid message.") silently drops the exact message the feature exists to preserve, landing the user on an empty thread with no error. Minor: spec says "sessionStorage" but impl uses localStorage (arguably the better call for redirect durability; just a doc/impl mismatch).
- Follow-up: none

## 2026-07-03T11:03:26Z — airport-icao-server-validation — score 4/5
- Strengths: Closes the exact server-side gap the spec targeted — all 6 actions covered (4 required home_airport, 2 optional aircraft), throwing a clear user-facing Error right after the existing lookup so the established `useActionState` inline-error box surfaces it with zero new client UI; scope is disciplined (respects out-of-scope: no `AirportFormInput`, no `additional_airport_2`, no backfill), aircraft stays optional via the `if (homeAirportRaw)` guard, comments updated to match new behavior, and it quietly fixes a latent bug by switching the aircraft lookups from `.single()` (which throws a raw PostgREST error on 0 rows) to `.maybeSingle()` for a controlled, friendly message.
- Weaknesses / risks: The identical error-message string is copy-pasted across all 6 actions (2 wording variants) rather than a shared constant — minor DRY smell, though consistent with this file's already-heavily-duplicated action bodies.
- Follow-up: none

## 2026-07-03T10:05:08Z — aircraft-deals-candidate-scan-fix — score 5/5
- Strengths: Both confirmed bugs fixed exactly as spec'd — replaces the silently-truncated `.limit(2000)` with the file's own `fetchAllRows`/`.range()` pagination helper (identical idiom to `fetchFamilyPriceMap`/`fetchFamilyCompMap`), and unwinds the statement-continuation bug by hoisting `.gte('asking_price', DEAL_MIN_PRICE)` onto the unconditional chain so the $50k floor now applies on the `photoOnly=false` `/aircraft/deals` path too, while `image_is_placeholder` stays correctly gated on `photoOnly`; clean scope (one function, no signature/schema/dep change), stale "Cap the candidate scan" comment removed, `data.length === 0` guard preserves the empty-state short-circuit, error/exception paths still fail soft to `[]`.
- Weaknesses / risks: none material — inherits the file-wide pattern of a full-population `select('*')` scan per render (uncached), fine at ~2121 rows but worth watching as the table grows; pre-existing, out of scope here.
- Follow-up: none
- Strengths: Faithful mirror of the established `full_name` lazy-save (trimmed value, `!user.user_metadata?.contact_phone` "only if not set" guard, same `updateUser({ data })` shape) across all 3 create actions; prefill threads `user?.user_metadata?.contact_phone` → new optional `userPhone` prop with correct `initialValues?.contact_phone ?? userPhone ?? ''` precedence so edit mode is untouched; nice extra judgment auto-opening the collapsed `<details>` on `(!isEdit && userPhone)` so a prefilled phone isn't hidden; optional chaining means no crash on missing metadata; suffixed var names (`contactPhoneSeeker`) match sibling conventions.
- Weaknesses / risks: Inconsistent hint copy — spec asked for a "we'll save it for future listings" cue on all 3 forms, but only PostAircraftForm got the dual-branch hint; PostPartnershipForm/PostSeekerListingForm show only a bare "Pre-filled from a previous listing." with no save-notice, so the UX cue differs across the three otherwise-parallel forms.
- Follow-up: Unify the phone-field hint copy across the 3 post forms (add the aircraft form's "We'll save it for future listings." save-notice to the partnership + seeker forms).

## 2026-07-03T09:32:27Z — saved-aircraft-comp-verdict — score 4/5
- Strengths: Faithful mirror of `AircraftSaleList.tsx`'s per-card precedence (self-excluded `compsWithoutSelf`, narrowed `clubHangerDealVerdict` wins, plain `compVsMarket` fallback, chip only when one exists) and of `getPartnershipCompVerdicts`'s shape; one make-scoped query (not a full-table scan) reusing the exact `50_000` floor + `status='active'`, honesty-gated so thin/unpriced families render nothing; fails soft to an empty map; type-only supabase import, tidy comments, `/saved` wiring minimal (empty-array short-circuit, `?? null` threading into props the card already accepts).
- Weaknesses / risks: comp query is scoped broadly by `make` with `.limit(2000)` whereas browse surfaces query make+model at `.limit(5000)` — for a very high-volume make a family could be under-sampled (or arbitrarily truncated), so the chip could differ from or drop vs. the browse page; low-probability on `/saved` (few saved makes) but not "exactly like" in that edge.
- Follow-up: none

## 2026-07-03T06:55:57Z — partnership-ai-faa-backfill — score 4/5
- Strengths: Faithful, line-for-line mirror of PostAircraftForm's proven chained-backfill — `handleLookup({ onlyEmpty })` guards each of make/model/year with `!(onlyEmpty && input?.value)`, so a registry hit never clobbers an AI-extracted value; `missingCore` gate + `result.registration` condition scope the auto-call tightly; button/blur call sites correctly rewrapped to `() => handleLookup()`; `fillTokenRef` stale-fill guard preserved; comments explain the onlyEmpty rationale; actions.ts/schema untouched as scoped.
- Weaknesses / risks: none material — minor: make/model/year inputs are re-queried both in handleGenerate and again inside handleLookup, and the whole flow leans on DOM querying over React state, but both match the sibling form's established convention exactly.
- Follow-up: none

## 2026-06-29T13:02:41Z — partner-buyin-inline-market — score 5/5
- Strengths: Textbook minimal slice — 14 lines, single file, reuses the already-computed `partnerComp` with zero new queries/components; the emerald/amber/slate variant ternary and `formatPriceK` helper match existing file conventions exactly, copy reads naturally for all three `kind` branches, and self-suppression falls out of `partnerComp && (...)` for free. PartnershipMarketCheck panel untouched as scoped.
- Weaknesses / risks: none material — slight semantic redundancy with the full market panel below, but that proximity-at-the-price-moment is precisely the spec's stated intent; the colored label is also backed by literal "below/above/Around market" text, so it's not color-only for a11y.
- Follow-up: none

## 2026-06-29T12:43:03Z — partnership-comp-pill-enriched — score 4/5
- Strengths: Clean, minimal parity wire-through — `median`/`count` threaded consistently through the prop type, the verdicts `Map`, and the `renderList` default param; both below/above branches gain the `· $Xk · N comps` suffix via the shared `formatPriceK` helper plus a full-figure `title` tooltip; honesty floor and ±5% dead-band suppression untouched, `partnershipComps.ts` math left alone exactly as scoped.
- Weaknesses / risks: none material — the below/above chip markup is duplicated rather than factored, but that duplication pre-existed this cycle and matches the file convention.
- Follow-up: none

## 2026-06-29T12:17:18Z — platform-contact-email-hide — score 5/5
- Strengths: Hits all 7 ACs precisely with a minimal, idiomatic diff — `contactMethod` state defaults to `'platform'` so email is hidden by default, the `Select`'s `onChange` toggles it, and the field uses the CSS `hidden` class (not conditional mount) so the value survives method switches (AC5); the post-mount `useEffect` draft-sync correctly mirrors the existing `selectedMake` pattern and reads `[name="contact_method"]` (AC6); applied identically to both forms; the local `Select` spreads `...props`, so `onChange` forwards cleanly.
- Weaknesses / risks: none material — select stays uncontrolled (relies on first option being the default), but that matches the file's established convention.
- Follow-up: none

## 2026-06-29T11:14:12Z — ifr-badge-browse-cards — score 4/5
- Strengths: All 5 ACs met cleanly in the single scoped file — `IfrCardBadge` reuses the shared `computeIfrSuitability`, emerald (full) / sky (capable) colors map correctly, and the `showIfrBadge` gate cleanly routes non-qualifying tiers (equipped/basic/null) back to the unchanged 2-cap chip path, so AC3 no-regression and AC5 empty-caps self-suppression both hold. Naming and `cn`/ring styling mirror the sibling `AvionicsChip`/`EngineTimeChip` chips; honest sub-line copy preserved.
- Weaknesses / risks: `computeIfrSuitability(caps)` runs twice per card (once for `ifrTier` in the body, again inside `IfrCardBadge`) instead of computing once and passing the result down; the `IFR_CARD_CHIP` map carries unreachable `equipped`/`basic` keys (badge returns null for them); and `title={ifr.sub}` adds hover text that the spec listed as explicitly out of scope. All immaterial.
- Follow-up: none

## 2026-06-29T10:32:08Z — avionics-ifr-land — score 4/5
- Strengths: Textbook DRY refactor — lifts `computeIfrSuitability` + `IfrTier`/`IfrSuitability` verbatim into the shared `avionicsClassify.ts` (next to the `AvionicsCap` data it operates on), deletes the aircraft page's now-duplicate copy and re-imports it (behaviour byte-identical), and adds the badge to the partnership `AvionicsPanel` above the chips. Honesty floor intact (empty caps → `null` → no badge; every sub-line defers to the owner for undetected gear). 12 focused unit tests cover tier precedence, the empty-cap self-suppression, and that each tier yields non-empty copy. Tidy comments, naming matches conventions; merge-commit landed cleanly post env-cache fix.
- Weaknesses / risks: The 4-line `IFR_CHIP` color map is now copy-pasted into both detail pages — a deliberate mirror of the existing per-page `CAP_COLORS` pattern, so defensible, but it's a second presentation site that can drift from the shared tier enum. Nothing material.
- Follow-up: none

## 2026-06-29T08:47:46Z — seeker-on-listings-page — score 4/5
- Strengths: All 5 functional ACs met cleanly — the new "Pilots seeking" section reuses the page's own `StatusBadge`/`formatDate` helpers and mirrors the aircraft/partnership section markup, the query correctly filters `poster_id` + active/pending and orders desc, the section self-hides when empty (AC3), and edge cases are handled gracefully (null title → sensible derived label with home airport, null `home_airport` → "Any airport", `preferred_makes` truncated to 2 with an ellipsis). Banner links added identically to both detail pages, matching the aircraft banner.
- Weaknesses / risks: Minor — a local `SeekerRow` type is declared rather than reusing/`Pick`-ing the existing `PartnershipSeeker` interface in `lib/types`, though that interface lacks `title`/`status`/`poster_id` so a narrow local type is defensible; the internal `/partnerships/seeking/[id]` "View" link uses the `ExternalLink` icon, a slight semantic quibble. Nothing material.
- Follow-up: none

## 2026-06-29T08:20:19Z — seeker-airport-or-filter — score 4/5
- Strengths: Tight single-file change that nails the spec — PostgREST `.or(home_airport.in.(…),additional_airports.ov.{…})` correctly expresses the home-OR-additional match, mock path mirrors it with consistent uppercase normalization, and the pre-migration fallback reuses the exact `error.message.includes('additional_airports')` pattern from createSeekerListing. All 6 ACs met; gate green.
- Weaknesses / risks: Fallback path re-builds the makes/ratings/share_type/min_hours chain verbatim (~7 duplicated lines) instead of a shared helper — two sites that can drift; also airport codes are interpolated into the `.or()` string unquoted (safe for A-Z0-9 ICAOs, but no sanitization).
- Follow-up: none

## 2026-06-29T08:11:51Z — listing-age-context — score 4/5
- Strengths: Correct, well-scoped single-file change — reuses already-computed `listed`/`domContext` and `familyComps` (no new queries), self-suppresses via `listed && domContext &&`, and correctly gates the "seller may have flexibility" inference behind the same `daysOnMarket >= 30` dual-threshold the Deal Score tally uses, so the honesty floor holds. All 7 ACs met; build + tsc clean per gate.
- Weaknesses / risks: The relative-recency phrasing is hand-rolled a second time as an inline JSX ternary, duplicating `domDetail`'s longer/shorter/typical branching with slightly reworded copy ("seller may have flexibility" vs "a seller-flexibility signal"; "similar … for sale now" vs "comparable … still for sale") — two render sites that can drift, and AC#2's "matching the language already used in the tally" is only loosely honored.
- Follow-up: none
- Strengths: Tight, well-scoped change — adds two optional props and one reactive `reserveAnnual` line; correctly uses the flat `reservePerHour` (overhaulCostUsd/tboHours) so `× hrsPerYear` is dimensionally sound and immune to the beyond-TBO branch; deliberately kept OUT of `annualTotal` (with an explanatory comment) to avoid double-counting; null/0 self-suppresses; reuses the dl/dt/dd + `money()` conventions and signals "estimate" via amber + dashed divider. All 7 ACs met; page passes `engineLife?.reservePerHour`/`?.family` correctly.
- Weaknesses / risks: Caveat subtext uses `text-slate-300` (very light grey on white) — fails WCAG AA contrast for the one line buyers most need to read; label wording ("Engine reserve est.") also drifts slightly from the spec's literal "Engine reserve (est.)" — both cosmetic.
- Follow-up: Bump the "Verify if included in monthly fixed above" subtext from `text-slate-300` to at least `text-slate-500` for readable contrast.

## 2026-06-29T07:32:15Z — partnership-buyin-optional — score 5/5
- Strengths: Tight 4-line diff that does exactly what the spec asked — drops `required`, adds "(optional)" using the *identical* `text-xs font-normal text-slate-400` span the form already uses for Title/Phone optionals, plus clear helper text; server action (actions.ts:97) already coerced empty → null, so no over-reach into backend/schema.
- Weaknesses / risks: none material — helper text + updated tooltip both mention the negotiable path (minor copy overlap, intentional progressive-disclosure).
- Follow-up: none

## 2026-06-29T06:20:59Z — partnership-implied-value — score 5/5
- Strengths: Clean pure helper mirroring aircraftComps/partnershipComps honesty philosophy — guards (buyIn>0, shares>=2, >=4 comps, median>0), ±10% dead-band, 14 unit tests; page fail-soft try/catch + pre-DB share guard avoids needless query; component renders all three kinds with "ask what's included" caveats exactly as spec'd; existing rows untouched.
- Weaknesses / risks: none material — detail copy says "comparable {make} aircraft" (make-only) though comps are model-family-filtered, so the label slightly understates specificity; cosmetic, not misleading.
- Follow-up: none

## 2026-06-29T02:29:10Z — partnership-airframe-time — score 5/5
- Strengths: Exact-to-spec port — byte-identical AirframeUsagePanel + USAGE_META, reuses the unit-tested pure computeAirframeUsage, honesty-gating self-suppresses correctly; clear comments, tight 53-line diff.
- Weaknesses / risks: none material — panel/USAGE_META are now duplicated across two pages, but that mirrors the existing EngineLifePanel convention so drift risk is pre-existing, not introduced.
- Follow-up: none

## 2026-06-29T01:42:29Z — aircraft-post-engine-type — score 5/5
- Strengths: Exact spec match across all three touchpoints (action persist, draft schema/prompt, form field + AI-prefill + hasOptional gate); idiomatic — reuses the `title` `.trim() || null` pattern, fits cleanly as the 4th cell of the existing 2×2 grid, and adds an honest value-explaining helper line; verified the detail-page panel renders on `{engineLife && …}` with no `source` gate, so the user-listing reachability the spec promises actually holds.
- Weaknesses / risks: none material — depends on free-text matching engineLife's TBO families, but the panel self-suppresses on no-match, so a bad entry shows nothing rather than a wrong number.
- Follow-up: none

## 2026-06-28T21:44:47Z — airframe-utilization-read — score 4/5
- Strengths: Faithfully meets every acceptance criterion — pure honesty-gated helper (null on missing ttaf/year, ttaf≤0, age<1), genuinely two-sided copy (low-time surfaces sitting/corrosion risk in amber, not a green win), distinct from the SMOH Engine Life panel, and mirrors its `ch-panel`/Plane-icon style; solid unit tests cover gating, all three bands, rounding, and ttaf echo.
- Weaknesses / risks: Minor — the chip `label` ("Low time") and band `headline` ("Low-time for its age") are near-duplicate strings shown together; band thresholds (40/120) are reasonable but un-sourced magic constants. None material.
- Follow-up: none

## 2026-06-28T12:36:51Z — deal-score-signal-tally — score 4/5
- Strengths: Exactly to spec — counts positive/negative only, neutral excluded, honest descriptive copy, chip colors match existing SIGNAL_COLORS palette, all-neutral/empty cases render no header, suppression unchanged; well-scoped single-file additive change.
- Weaknesses / risks: Chip color tokens are hardcoded literals rather than derived from the central SIGNAL_COLORS map (minor duplication); two filter passes over rows (negligible).
- Follow-up: none

## 2026-06-27T14:52:00Z — crosssell-model-level — score 3/5
- Strengths: Clean two-query fallback pattern (model-first, make fallback) with correct mock/live parity; `modelLevel` flag cleanly decouples data-level from display logic; scoped to exactly the two files the spec named; TypeScript return type updated correctly.
- Weaknesses / risks: AC#1 explicitly states CTA must link to `/partnerships?make=Cessna&model=172` when model-level, but the link always stays at `/partnerships?make=Cessna` — so a buyer clicking "Browse Cessna 172 partnerships" lands on all-Cessna results, the same friction the spec was trying to fix; the comment rationalizes this as "not supported yet" but that's a spec deviation, not a scoping judgment.
- Follow-up: Either add `model` query param support to the `/partnerships` page (so the CTA URL works as specified) or change the CTA label back to make-only when `model` param can't be honored — the current label/URL mismatch is the worse outcome.

## 2026-06-27T14:23:57Z — partnership-crosssell-listing — score 4/5
- Strengths: Clean self-suppression logic, correct mock/live parity, graceful catch→null DB error handling, make properly encoded in CTA URL, co-located component as spec required.
- Weaknesses / risks: CTA text reads "Browse {make} partnerships" instead of spec's "Browse N [Make] partnerships" (count N missing); `.limit(200)` on the count query means both count displayed and minBuyIn could be wrong if a popular make ever exceeds 200 active shares (no ORDER BY, so cheapest rows not guaranteed to be in the result set).
- Follow-up: Add count to CTA label (`Browse ${count} ${make} partnerships →`) and replace `.limit(200)` with a `.select('id, buy_in_price').limit(500)` or use a separate aggregate query for count.

## 2026-06-27T13:45:31Z — share-cost-toggle — score 4/5
- Strengths: All 7 spec ACs met; clean Client Component extraction; `?? rows[0]` fallback is good defensive coding; `flex-wrap` on button strip and links section handles mobile overflow correctly.
- Weaknesses / risks: `TOGGLE_LABELS` duplicates labels already carried in `row.label` from the calculator (parallel map with no single source of truth); toggle buttons missing `type="button"` and `aria-pressed` (a11y gap — could misfire as submit inside any future form wrapper); `money()` copied from page.tsx rather than moved to a shared util.
- Follow-up: Add `type="button"` and `aria-pressed={selected === row.shares}` to toggle buttons; replace `TOGGLE_LABELS` map with `row.label` directly so the calculator is the sole label authority.

## 2026-06-27T13:19:33Z — homerails-deal-chips — score 5/5
- Strengths: All 6 ACs met; single Promise.all over unique families is correct, no N+1; self-exclusion, null-price guard, and 'fair' suppression all handled; local types declared at module scope (avoids the style nit from similar-aircraft cycle); exactly 1 file changed as scoped.
- Weaknesses / risks: none material
- Follow-up: none

## 2026-06-27T11:30:00Z — engine-time-rail-chips — score 4/5
- Strengths: All 7 ACs met cleanly — ternary chain correctly handles placeholder/null/chip ordering, color thresholds match browse-card spec exactly, avionics chip unaffected, zero TypeScript errors.
- Weaknesses / risks: Three helpers (`formatHrsRemaining`, `engineChipStyle`, `EngineOverlayChip`) are near-verbatim copies of `AircraftSaleCard`'s equivalents with a different component name than the spec dictated (`EngineTimeChip`); duplication is spec-acknowledged but will compound if a third card type ever gains engine data.
- Follow-up: Extract the three helpers into a shared util (e.g. `src/lib/engineChip.tsx`) so future card types import rather than copy.

## 2026-06-27T10:30:00Z — avionics-partnership-detail — score 3/5
- Strengths: Core chips render correctly on both detail page and RailCard, self-suppression works, placement is right, description-split workaround is pragmatic (Partnership type has no `avionics` column despite spec claiming otherwise).
- Weaknesses / risks: AC1's "raw equipment list in a 2-column bullet grid" is entirely absent from AvionicsPanel — only chips render; `CAP_COLORS`/`AVIONICS_CHIP_STYLE` maps are duplicated across `page.tsx` and `PartnershipRailCard.tsx` (with a minor `gps` shade mismatch); description-split regex is copied verbatim into both files instead of living in the shared lib.
- Follow-up: Add the 2-column equipment bullet grid to `AvionicsPanel` (missed AC); extract the color map and description-split helper into `avionicsClassify.ts` to eliminate the duplication.

## 2026-06-27T09:15:00Z — seeking-post-one-screen — score 4/5
- Strengths: All 8 AC delivered cleanly — AI prefill elevated to top, 3-field "The basics" section, native `<details>` disclosure closed by default, comprehensive auto-open heuristic (broader than the partnership cycle's, now includes contact/travel fields), server action auto-generates title and falls back to `user.email`; faithful mirror of the partnership-post-one-screen pattern with dead constants (`RATINGS`, `MAKES`) correctly removed.
- Weaknesses / risks: `result.title` remains in the `hasMoreDetails` auto-open guard even though `title` moved to "The basics" (outside the disclosure) — AI filling only a title triggers the disclosure to open for no reason; `contact_email: ... || ''` could persist an empty string to the DB if `user.email` is also null/undefined on an incomplete account.
- Follow-up: none

## 2026-06-27T08:42:11Z — partnership-post-one-screen — score 4/5
- Strengths: Spec delivered cleanly — AI prefill elevated to top, five-field Essentials section, native `<details>` collapsible with ref-based auto-open on AI fill, `user.email` server-side fallback in actions.ts; net −170 line restructure that makes the form genuinely less intimidating without losing any required-field functionality.
- Weaknesses / risks: `scheduling_system` field silently dropped — it was in the old form, absent from the spec's more-details list AND the out-of-scope list, so it's an unacknowledged regression; auto-open heuristic also misses AI-filled contact fields (only checks year/registration/title/description/costs), so the drawer stays closed if only those populate.
- Follow-up: none

## 2026-06-27T07:20:32Z — similar-aircraft-deal-chips — score 4/5
- Strengths: All 5 acceptance criteria met cleanly; parallel family-price fetch avoids N+1 (1-3 unique families in practice); honesty floors (≥4 comps, ±5% dead band, 'around' filtered) correctly delegated to `clubHangerEstimate` rather than re-implemented; backward-compat for homepage deals rail preserved via `discountPct != null` taking precedence.
- Weaknesses / risks: Emerald chip markup is copy-pasted verbatim between the `discountPct` and `compVerdict='below'` branches — minor DRY miss that will drift if the deal-chip style is ever updated; `interface FamilySpec` and `type FamilyKey` are declared inside the async function body instead of at module scope (style nit).
- Follow-up: none

## 2026-06-27T06:30:00Z — partnership-post-prefill-all-fields — score 4/5
- Strengths: Clean port of the established aircraft-post-prefill pattern — `PartnershipDraft` interface, extended tool schema, and `fillFormField` helper all mirror the sibling feature exactly; system prompt is well-structured (extraction rules separated from description rules, enum-constrained fields, explicit no-fabrication instruction); all spec acceptance criteria met including registration, total_shares, shares_available beyond the explicit AC1 list; `home_airport.toUpperCase().slice(0, 4)` normalization is a nice defensive touch.
- Weaknesses / risks: Outer `if (result.buy_in_price)` / `if (result.total_shares)` etc. guards before `fillFormField` calls introduce a falsy-0 bug — a numeric field set to 0 would be silently skipped; `fillFormField` already handles `undefined`/`null` internally, making the outer guards redundant and harmful for integers; low practical risk (a $0 buy-in is nonsensical) but it's a latent trap if the pattern is copied to a domain where 0 is meaningful.
- Follow-up: Replace numeric-field `if (result.x) fillFormField(...)` with direct `fillFormField(form, ..., result.x)` calls — let the helper's null/undefined guard do the work and eliminate the falsy-0 trap.

## 2026-06-26T13:15:58Z — aerobatic-mission-page — score 4/5
- Strengths: Textbook data-only extension — one `Mission` entry appended to `MISSIONS[]` plus one chip, no new route code, exactly as scoped; conforms 1:1 to the `Mission` interface and the established editorial formula (unique H1/meta, 3 substantive intro paragraphs covering certification / training+IAC / pre-purchase as the spec required, 4 evergreen FAQs); content is unusually accurate and specific (TCDS Aerobatic category +6/−3 G, FAR 91.303 & 91.307, real type designations Pitts S-1S/S-2C, Extra 300/330, Decathlon, Su-26, Edge 540); FAQ JSON-LD and the visible accordion both render from the same `m.faqs` array, so the 1:1 match is structural rather than hand-maintained.
- Weaknesses / risks: `filters: { q: 'aerobatic' }` is a literal keyword match, but real listings advertise the model name ("Pitts", "Extra 300", "Decathlon") not the word "aerobatic", so the live grid will likely be sparse/empty — the editorial names those types richly but the filter doesn't search for them; same soft spot flagged on twin-stol. Minor substance overlap between intro para 2 and FAQ 2 (both cover 91.303/91.307/IAC), though wording is distinct as the interface requires.
- Follow-up: none (DB/filter changes were explicitly out of scope; grid-keyword breadth is a backlog-level mission-family concern, not specific to this cycle).
## 2026-06-26T10:24:10Z — partnership-desktop-message-button — score 4/5
- Strengths: Faithful parity port of mobile `ContactBar`'s messaging flow into the desktop `ContactButtons` card — identical auth-state effect, `handleMessage`, `getOrCreateThread` contract handling, `showMessage` self-exclusion guard, and slate-900 styling; all 7 acceptance criteria met (auth redirect, self-poster hide, email/phone retained as secondary), scoped to exactly the two files the spec named.
- Weaknesses / risks: Message button omits the `track('contact_initiated', { method: 'message' })` analytics call that the sibling email/phone buttons in the SAME component fire — so desktop message intents go uncounted; also duplicates the ~15-line auth-effect + handler verbatim from ContactBar rather than a shared hook (consistent with existing codebase pattern, but debt compounds).
- Follow-up: Add `track('contact_initiated', { listing_id, method: 'message' })` to `handleMessage` in both ContactButtons and ContactBar so message-initiation parity-matches email/phone analytics.
## 2026-06-26T07:50:33Z — aircraft-mission-twin-stol — score 4/5
- Strengths: Pure data-driven extension — two `Mission` entries appended to `MISSIONS[]` with no new route code, exactly as spec intended; entries conform 1:1 to the `Mission` interface and mirror the established editorial formula (unique H1/meta, 3 substantive intro paragraphs, 4 evergreen FAQs, "the listings below are…" closer); chip slugs `twin-engine`/`stol` correctly resolve to the new missions; the STOL intro honestly cross-links to experimental/tailwheel pages, acknowledging its own filter won't catch every backcountry type — exactly the "keep these honest" judgment the file header asks for.
- Weaknesses / risks: `filters: { q: 'stol' }` keyword match likely yields a sparse/empty live grid (few listings literally say "STOL"), and `q: 'twin'` is broad enough to admit some false positives; both are honestly disclosed in the editorial so neither reads as a doorway page, but grid quality on /stol is the soft spot.
- Follow-up: none
## 2026-06-26T07:17:56Z — aircraft-for-sale-ai-draft — score 5/5
- Strengths: Textbook parity feature — `generateAircraftDraft` mirrors `generatePartnershipDraft`/`generateSeekerDraft` (same `checkAiDraftAccess()` gate, empty/length guards, `draft_listing` tool with `tool_choice`, Haiku model id, incomplete-draft check), and the form's `handleGenerate` is byte-for-byte aligned with the sibling forms' `useTransition` + DOM-ref `dispatchEvent('input')` fill; aircraft-tailored system prompt is well-crafted; all 6 acceptance criteria met with inline error + "Generating…" loading state; bonus `p-4 sm:p-6` tightening applied consistently across all three sections.
- Weaknesses / risks: none material — minor: `title.slice(0, 200)` exceeds the prompt's 120-char guidance, but this faithfully copies the sibling convention so consistency wins.
- Follow-up: none

## 2026-06-26T06:53:18Z — post-form-375-cream-polish — score 4/5
- Strengths: Clean, on-spec diff; meets all 5 acceptance criteria; `.ch-surface min-h-screen` wrapper matches the idiom already used across /aircraft and /partnerships, and the AI button gains a thoughtful `justify-center` so the full-width mobile tap target reads centered.
- Weaknesses / risks: `partnerships/new/page.tsx` wraps the existing div without re-indenting the inner JSX (misaligned markup), inconsistent with `seeking/new` which was re-indented; spec scope also listed a "DraftIndicator wrap long text" tweak that wasn't implemented (not in acceptance criteria).
- Follow-up: none

## 2026-06-25T13:35:39Z — searches-page-seeker-label — score 4/5
- Strengths: Tight, on-spec single-file diff; new `describeSeekerSearch` mirrors the existing aircraft/partnership helpers' structure and the early-return branching in `marketplaceLabel`/`describeSearch` is clean; meets all badge + description acceptance criteria, and the View link already passes for `/partnerships/seeking`.
- Weaknesses / risks: `state` is a real seeker filter (it's in the page's `activeFilterCount` list) but `describeSeekerSearch` omits it, so a state-only seeker search renders the misleading "All seeker listings" fallback.
- Follow-up: add a `state` branch to `describeSeekerSearch` so state-filtered seeker searches describe themselves.

## 2026-06-25T10:03:39Z — seeking-drive-time — score 4/5
- Strengths: Tight, on-spec diff; new `travelLabel` helper matches utils.ts conventions/doc style, is the single source of truth across both display sites, and gracefully clamps legacy nm values (150/200) into the top bucket so no schema change is needed.
- Weaknesses / risks: none material — spec asked for "~2+ hr drive" but ships "~2 hr drive", so legacy 150/200 nm listings read as a flat "~2 hr drive" (understated); detail-page copy "willing to commute ~30 min drive" doubles up commute+drive and reads slightly awkward.
- Follow-up: none

## 2026-06-25T08:58:18Z — saved-listing-note — score 4/5
- Strengths: All 7 acceptance criteria met; owner-scoped action, dual char-cap, ⌘/Ctrl+Enter & Esc, a11y labels, and a real graceful-degradation path when the note column is unmigrated.
- Weaknesses / risks: none material — `displayNote` comment mislabels post-confirm update as "optimistic"; redundant `?? []` on an always-array `savedRows`.
- Follow-up: none
