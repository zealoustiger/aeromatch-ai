'use server'

import { assertAdmin } from '@/lib/admin-auth'
import { fetchAlertsForEmailAdmin, type AdminAlertRow } from '@/lib/alertsForOwner'
import { requestAlertsManageLink } from '@/app/actions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Support-tool lookup: given an email, return that subscriber's alerts for
// display on /admin/alerts. Never returns unsubscribe_token/confirm_token —
// fetchAlertsForEmailAdmin doesn't select them in the first place.
export async function adminLookupAlertsByEmail(
  email: string
): Promise<{ ok: true; rows: AdminAlertRow[] } | { error: string }> {
  await assertAdmin()
  const clean = (email || '').toLowerCase().trim()
  if (!clean || !EMAIL_RE.test(clean)) {
    return { error: 'Please enter a valid email address.' }
  }
  const rows = await fetchAlertsForEmailAdmin(clean)
  return { ok: true, rows }
}

// Thin admin-gated wrapper around the existing public manage-link send path
// so the send, cooldown, and no-enumeration behavior are 100% reused, not
// reimplemented here.
export async function adminSendManageLink(email: string) {
  await assertAdmin()
  return requestAlertsManageLink(email)
}
