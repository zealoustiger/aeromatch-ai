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
