'use server'

import { assertAdmin } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'

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
