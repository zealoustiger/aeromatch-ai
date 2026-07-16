import { createHmac, timingSafeEqual } from 'crypto'

interface VerifyInput {
  payload: string
  secret: string
  svixId: string
  svixTimestamp: string
  svixSignature: string
}

// Resend signs webhooks the Svix way: HMAC-SHA256 over `${id}.${timestamp}.${body}`,
// keyed by the base64 bytes after the secret's `whsec_` prefix, base64-encoded, and
// sent as one or more space-delimited `v1,<sig>` candidates (key rotation support) —
// see https://docs.svix.com/receiving/verifying-payloads/how-manual.
export function verifyResendWebhookSignature({
  payload,
  secret,
  svixId,
  svixTimestamp,
  svixSignature,
}: VerifyInput): boolean {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64')
  const expectedBuf = Buffer.from(expected)

  return svixSignature
    .split(' ')
    .map((candidate) => candidate.split(',')[1])
    .filter((sig): sig is string => !!sig)
    .some((sig) => {
      const sigBuf = Buffer.from(sig)
      return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)
    })
}

interface ResendBounceEvent {
  type?: string
  data?: {
    to?: unknown
    bounce?: { type?: string }
  }
}

// Only a hard ("Permanent") bounce means the address is really dead — a
// Transient (soft) bounce may still deliver later, so pausing on it would
// silently lose real subscribers over a full mailbox or a slow mail server
// (never-spam guardrail, but also never-lose-a-good-subscriber).
export function extractHardBouncedEmails(body: unknown): string[] {
  if (!body || typeof body !== 'object') return []
  const event = body as ResendBounceEvent
  if (event.type !== 'email.bounced') return []
  if (event.data?.bounce?.type !== 'Permanent') return []
  const to = event.data?.to
  if (!Array.isArray(to)) return []
  return to
    .filter((email): email is string => typeof email === 'string' && email.length > 0)
    .map((email) => email.toLowerCase())
}

interface ResendComplainedEvent {
  type?: string
  data?: { to?: unknown }
}

// A spam complaint is the recipient explicitly telling their mail provider
// "I did not want this" — stronger than a bounce, and continuing to send
// after one damages domain reputation for every other subscriber. Extract
// exactly like a hard bounce, just for `email.complained`.
export function extractComplainedEmails(body: unknown): string[] {
  if (!body || typeof body !== 'object') return []
  const event = body as ResendComplainedEvent
  if (event.type !== 'email.complained') return []
  const to = event.data?.to
  if (!Array.isArray(to)) return []
  return to
    .filter((email): email is string => typeof email === 'string' && email.length > 0)
    .map((email) => email.toLowerCase())
}

export interface EngagementEvent {
  eventType: 'opened' | 'clicked'
  /** The `type` tag `sendEmail` attached at send time (see `email.ts`); null for
   *  an untagged/legacy send — never fabricated, just bucketed as "untagged". */
  emailType: string | null
  resendEmailId: string | null
  /** The clicked URL; always null for an `email.opened` event. */
  link: string | null
}

interface ResendEngagementEvent {
  type?: string
  data?: {
    email_id?: unknown
    tags?: Array<{ name?: unknown; value?: unknown }>
    click?: { link?: unknown }
  }
}

// `email.opened`/`email.clicked` — Resend echoes back whatever `tags` were
// sent with the original email, so the `type` tag round-trips here and lets
// the admin engagement rollup group by email template.
export function extractEngagementEvent(body: unknown): EngagementEvent | null {
  if (!body || typeof body !== 'object') return null
  const event = body as ResendEngagementEvent
  if (event.type !== 'email.opened' && event.type !== 'email.clicked') return null

  const tags = Array.isArray(event.data?.tags) ? event.data.tags : []
  const typeTag = tags.find((t) => t?.name === 'type')
  const emailType = typeof typeTag?.value === 'string' ? typeTag.value : null

  const resendEmailId = typeof event.data?.email_id === 'string' ? event.data.email_id : null
  const link =
    event.type === 'email.clicked' && typeof event.data?.click?.link === 'string' ? event.data.click.link : null

  return {
    eventType: event.type === 'email.opened' ? 'opened' : 'clicked',
    emailType,
    resendEmailId,
    link,
  }
}
