# alert-cron-send-pacing

## Goal
Add gentle inter-send pacing and a time-budget guard to the alert-digest cron's
email send loops so a growing subscriber list doesn't hammer Resend's rate
limit or silently drop the tail of a run when it nears the 60s Vercel ceiling.

## Scope
- `src/lib/alertSendPacing.ts` (new) — pure `shouldDeferSend` decision function
  + a `SendPacer` class that wraps a send attempt with pacing (~400ms between
  sends) and a time-budget stop (defer new sends once the run is within a
  safety margin of the 60s deadline).
- `src/lib/alertSendPacing.test.ts` (new) — unit tests for `shouldDeferSend`
  and `SendPacer`, deterministic (injected clock/sleep).
- `src/app/api/cron/alert-digest/route.ts` — thread one shared `SendPacer`
  instance (constructed from `runStartMs`) through every send loop
  (`sendStrandedPendingReminders`, `sendWidenSuggestionEmails`, the main
  single-alert + combined-digest loops, the unavailable-watch loop,
  `sendDormantSubscriberRepermissionEmails`, `sendBackOnMarketNotices`,
  `sendMondayAdminFunnelSummary`), replacing direct `sendEmail(...)` calls with
  `pacer.send(() => sendEmail(...))`. A deferred send is skipped this pass
  (no stamp write) so the alert stays due and the next cron run picks it up —
  self-healing, never a lost or duplicate send.
- `supabase/schema.sql` — additive `alert_cron_runs.deferred_sends int not
  null default 0` column (⚠️ human-apply, same fail-soft precedent as every
  other `alert_cron_runs`/`alerts` column here).
- Run-log insert + `console.log` summary line gain a `deferredSends` count.

## Acceptance criteria
- `shouldDeferSend` and `SendPacer` are pure/deterministic and unit-tested
  (pacing delay applied between sends but not before the first; budget guard
  flips to "defer" once elapsed time crosses `budgetMs - marginMs`).
- Every `sendEmail(...)` call site in `alert-digest/route.ts` is routed
  through the shared pacer (grep confirms no bare `await sendEmail(` left in
  that file).
- A deferred send does NOT mark any stamp (`last_digest_at`,
  `confirm_reminder_sent_at`, `widen_suggested_at`, `repermission_sent_at`,
  the back-on-market resume, the watch auto-pause) — the alert/reminder stays
  eligible for the next run.
- Retry/`Retry-After` behavior inside `sendEmail`/`withEmailRetry` is
  untouched — pacing wraps the whole retry-inclusive send, it doesn't change
  it.
- `alert_cron_runs` insert still succeeds pre-migration (retries without
  `deferred_sends` on that column-missing error, matching `send_failures`'s
  existing precedent) and post-migration records a real count.
- `npx next build` + typecheck pass; QA smoke on `/alerts` (a page that
  imports nothing new from this route, included as a sane baseline touch)
  passes with no new console errors.

## Out of scope
- Any change to `withEmailRetry`/`planEmailRetry`'s own backoff logic.
- Persisting per-send timestamps or a send-rate dashboard — only a run-total
  deferred count.
- The sibling `frequency_changed_at` backlog item (separate slice).
