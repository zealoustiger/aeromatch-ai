# alert-deliverability-dns-check

## Goal
Add a daily SPF/DKIM/DMARC self-check to the `alert-digest` cron so a broken or
human-edited DNS record on the send domain shows up the same day, instead of only
as an unexplained drop in inbox placement weeks later.

## Scope
- New `src/lib/deliverabilityDnsCheck.ts`: pure verdict-derivation functions
  (`deriveSpfVerdict`/`deriveDkimVerdict`/`deriveDmarcVerdict`, each `pass | fail |
  lookup-error` from already-fetched TXT records or `null`), plus
  `queryTxtRecords()` (Cloudflare DNS-over-HTTPS JSON, no new deps) and
  `runDeliverabilityDnsCheck(domain)` orchestrating all three lookups
  (root TXT for SPF, `resend._domainkey.<domain>` for DKIM, `_dmarc.<domain>` for
  DMARC — Resend's selector confirmed live against `clubhanger.com`'s real DNS
  during scoping).
- New `src/lib/deliverabilityDnsCheck.test.ts`: unit tests for the pure verdict
  functions only (no network).
- `src/lib/alertCaptureSelfCheckHistory.ts`: extract the existing streak/transition
  math out of `shouldSendCaptureSelfCheckAlert` into a generic
  `shouldSendOnRedTransition(priorOkHistory, todayOk)` so the DNS check can reuse
  the identical "quiet through a persistent failure, 3rd-day reminder" cadence
  without duplicating it. `shouldSendCaptureSelfCheckAlert` becomes a thin wrapper
  — behavior and existing tests unchanged.
- `src/lib/email.ts`: export `getAlertsSendDomain()` (parses the domain out of the
  existing `FROM` constant — never hardcoded, always the real send identity); add
  `buildAdminDeliverabilityDnsFailureEmail()` mirroring
  `buildAdminCaptureSelfCheckFailureEmail`'s shape.
- `src/lib/alertCronHealth.ts`: add `dnsSpfStatus`/`dnsDkimStatus`/`dnsDmarcStatus`
  (`'pass' | 'fail' | 'lookup-error' | null`) to `AlertCronRun`, sourced from new
  optional `alert_cron_runs.dns_spf_status`/`dns_dkim_status`/`dns_dmarc_status`
  text columns — additive, fail-soft, same `runLogOptionalKeys` retry pattern as
  every other optional column on this table.
- `src/app/api/cron/alert-digest/route.ts`: run `runDeliverabilityDnsCheck` once
  per cron run (after the existing capture self-check, same "never affects the
  digest sends that already completed" try/catch pattern); a genuine `fail` on any
  of the three (NOT `lookup-error` — a resolver timeout is never a fail) triggers
  the same transition-gated admin email as the capture self-check, reusing
  `shouldSendOnRedTransition`; write the three statuses onto the run-log row.
- `src/app/admin/alerts/page.tsx`: surface SPF/DKIM/DMARC in the existing
  "Cron health — alert-digest" panel — one line in the top stats block for the
  latest run, one more column in the "Last N runs" trend table (same `—` /
  colored-on-fail convention as the existing "Capture self-check" column).

## Acceptance criteria
- `deriveSpfVerdict`/`deriveDkimVerdict`/`deriveDmarcVerdict` unit-tested: matching
  record → pass, non-matching/absent → fail, `null` input → lookup-error.
- `next build` + `tsc --noEmit` clean; full `node --test` suite green, no
  regressions to `alertCaptureSelfCheckHistory.test.ts`.
- The cron route still completes and inserts a run-log row even if the DNS check
  throws or times out (never blocks/breaks the real digest send).
- `/admin/alerts` renders the three new fields in both the latest-run stats and
  the trend table, `—` when the columns aren't migrated live, no console errors,
  no horizontal overflow at 1280/375px.
- No new capture point, no send-path change, no destructive SQL — additive
  columns only, called out in the CHANGELOG.

## Out of scope
- Auto-fixing DNS records (this is detection only — the actual SPF/DMARC records
  live outside the app, at the registrar/DNS host).
- A dedicated `/admin/alerts` migrations-box entry for the 3 new columns (existing
  precedent: `self_check_ok`/`self_check_step`/`swept_test_alerts` aren't listed
  there either — only table-existence + the original 5 flagged columns are).
- Any change to which admin addresses receive the alert (reuses
  `getAdminRecipientEmails()` as-is).
