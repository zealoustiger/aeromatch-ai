import { createAdminClient } from './supabase-admin'

export interface PendingAlertMigration {
  key: string
  label: string
  unlocks: string
  sql: string
}

export interface PendingMigrationFlags {
  sourceColumnMigrated: boolean
  frequencyMigrated: boolean
  frequencyChangedAtMigrated: boolean
  reasonColumnMigrated: boolean
  unsubscribedAtMigrated: boolean
}

// Same "select and check error.message for the missing name" convention already used by
// alertScoreboard.ts's OPTIONAL_COLS retries, webhooks/resend/route.ts, and
// api/cron/alert-digest/route.ts — a PostgREST "does not exist" error's message contains
// the literal column/table name, so a real miss is never confused with a genuine 0 rows.
async function tableExists(table: string): Promise<boolean> {
  const admin = createAdminClient()
  const { error } = await admin.from(table).select('*', { head: true, count: 'exact' }).limit(1)
  return !(error && error.message?.includes(table))
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const admin = createAdminClient()
  const { error } = await admin.from(table).select(column).limit(1)
  return !(error && error.message?.includes(column))
}

// Reports only the "at least seven" alert-adjacent migrations BACKLOG.md names as
// scattered "isn't migrated live" footnotes across /admin/alerts — never a hardcoded
// guess, every entry below is a live probe result. Deliberately excludes the
// `alerts_owner_select` RLS policy: createAdminClient() uses the service-role key, which
// bypasses RLS entirely, so a query through it can never tell "policy applied" from
// "policy missing" — there is no reliable way to probe it from application code.
export async function getPendingAlertMigrations(flags: PendingMigrationFlags): Promise<PendingAlertMigration[]> {
  const [cronRunsExists, engagementEventsExists, confirmReminderMigrated] = await Promise.all([
    tableExists('alert_cron_runs'),
    tableExists('email_engagement_events'),
    columnExists('alerts', 'confirm_reminder_sent_at'),
  ])

  const candidates: Array<{ migrated: boolean } & PendingAlertMigration> = [
    {
      key: 'alert_cron_runs',
      migrated: cronRunsExists,
      label: '`alert_cron_runs` table',
      unlocks:
        'The cron-health "Last run" panel at the top of this page — until applied it can\'t tell "cron never ran" from "table missing."',
      sql: `create table if not exists alert_cron_runs (
  id                       uuid        default gen_random_uuid() primary key,
  created_at               timestamptz default now(),
  processed                int         not null default 0,
  sent                     int         not null default 0,
  emails_sent              int         not null default 0,
  skipped                  int         not null default 0,
  unparseable              int         not null default 0,
  not_due                  int         not null default 0,
  reminders_sent           int         not null default 0,
  widen_suggestions_sent   int         not null default 0,
  duration_ms              int         not null default 0
);

create index if not exists alert_cron_runs_created_at_idx on alert_cron_runs (created_at desc);`,
    },
    {
      key: 'alerts_source',
      migrated: flags.sourceColumnMigrated,
      label: '`alerts.source` column',
      unlocks: 'Per-placement (bell/chip/footer/etc.) conversion attribution in "Top placements" below.',
      sql: `alter table alerts add column if not exists source text;`,
    },
    {
      key: 'alerts_frequency',
      migrated: flags.frequencyMigrated,
      label: '`alerts.frequency` column',
      unlocks: 'The real daily/weekly/monthly cadence ladder in "Cadence mix" below (today every row defaults to weekly).',
      sql: `alter table alerts add column if not exists frequency text not null default 'weekly'
  check (frequency in ('daily', 'weekly'));`,
    },
    {
      key: 'alerts_frequency_changed_at',
      migrated: flags.frequencyChangedAtMigrated,
      label: '`alerts.frequency_changed_at` column',
      unlocks: 'Attributing cadence downshifts to the re-permission email in "Re-permission lifecycle" below.',
      sql: `alter table alerts add column if not exists frequency_changed_at timestamptz;`,
    },
    {
      key: 'alerts_unsubscribe_reason',
      migrated: flags.reasonColumnMigrated,
      label: '`alerts.unsubscribe_reason` column',
      unlocks: 'Real churn reasons in "Why people unsubscribe" below.',
      sql: `alter table alerts add column if not exists unsubscribe_reason text;`,
    },
    {
      key: 'alerts_unsubscribed_at',
      migrated: flags.unsubscribedAtMigrated,
      label: '`alerts.unsubscribed_at` column',
      unlocks: 'Honest week-over-week unsubscribe deltas (today only a current-total count is possible).',
      sql: `alter table alerts add column if not exists unsubscribed_at timestamptz;`,
    },
    {
      key: 'email_engagement_events',
      migrated: engagementEventsExists,
      label: '`email_engagement_events` table',
      unlocks: 'Real open/click rates per email template in "Email engagement" below (also needs the email.opened/email.clicked webhook events ticked on in the Resend dashboard).',
      sql: `create table if not exists email_engagement_events (
  id               uuid        default gen_random_uuid() primary key,
  created_at       timestamptz default now(),
  event_type       text        not null,
  email_type       text,
  resend_email_id  text,
  link_url         text
);

create index if not exists email_engagement_events_created_at_idx on email_engagement_events (created_at desc);`,
    },
    {
      key: 'alerts_confirm_reminder_sent_at',
      migrated: confirmReminderMigrated,
      label: '`alerts.confirm_reminder_sent_at` column',
      unlocks: 'Lets the stranded-pending "still want these alerts?" reminder actually send (the whole cron block is skipped without it).',
      sql: `alter table alerts add column if not exists confirm_reminder_sent_at timestamptz;`,
    },
  ]

  return candidates.filter((c) => !c.migrated).map(({ migrated: _migrated, ...rest }) => rest)
}
