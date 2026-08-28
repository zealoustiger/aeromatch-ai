'use server'

import { assertAdmin } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'
import { buildDigestReplay } from '@/lib/alertDigestReplay'

// Lets an admin see exactly what a template looks like in a real inbox
// (Gmail clipping, dark mode, image proxying) instead of only the in-page
// iframe preview. Recipient is always the caller's own admin email — never
// a client-supplied address — so this can't be used to send arbitrary mail
// to a third party.
export async function adminSendEmailPreview(input: {
  name: string
  subject: string
  html: string
  text: string
}): Promise<{ ok: true } | { ok: false; reason?: string }> {
  const adminEmail = await assertAdmin()
  const result = await sendEmail({
    to: adminEmail,
    subject: `[Preview] ${input.subject}`,
    html: input.html,
    text: input.text,
    emailType: `admin-preview-${input.name}`,
  })
  if (result.sent) return { ok: true }
  return { ok: false, reason: result.reason }
}

/**
 * Rebuild one subscriber's alert digest with the CURRENT template and
 * (optionally) send it to the calling admin's own inbox.
 *
 * This is the `/api/cron/alert-digest` email, rendered through the very same
 * builder and sample fetchers, so it is a true test of what subscribers
 * receive — not a mock. It NEVER emails the subscriber: the recipient is
 * always the signed-in admin, and it never advances `last_digest_at`, so
 * replaying an alert can't swallow that subscriber's real next digest.
 */
export async function adminReplayAlertDigest(input: {
  alertId?: string
  send?: boolean
}): Promise<
  | {
      ok: true
      sent: boolean
      alertId: string
      subject: string
      html: string
      text: string
      note: string
      window: 'since-last-digest' | 'most-recent'
      alertEmail: string
      alertContext: string | null
      sourcePath: string
      matchCount: number
    }
  | { ok: false; reason: string }
> {
  const adminEmail = await assertAdmin()
  const replay = await buildDigestReplay(input.alertId)
  if (!replay) {
    return {
      ok: false,
      reason: 'No live alert with a parseable saved search matched any listing — nothing to replay.',
    }
  }

  let sent = false
  if (input.send) {
    const result = await sendEmail({
      to: adminEmail,
      subject: `[Test] ${replay.subject}`,
      html: replay.html,
      text: replay.text,
      emailType: 'admin-alert-digest-replay',
    })
    if (!result.sent) return { ok: false, reason: result.reason ?? 'Send failed.' }
    sent = true
  }

  return {
    ok: true,
    sent,
    alertId: replay.alert.id,
    subject: replay.subject,
    html: replay.html,
    text: replay.text,
    note: replay.note,
    window: replay.window,
    alertEmail: replay.alert.email,
    alertContext: replay.alert.context,
    sourcePath: replay.alert.sourcePath,
    matchCount: replay.matchCount,
  }
}
