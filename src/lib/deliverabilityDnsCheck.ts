// Deliverability DNS self-check — SPF/DKIM/DMARC on the alert send domain. Runs
// daily from the alert-digest cron so a broken or human-edited DNS record shows up
// the same day, instead of only as an unexplained drop in inbox placement weeks
// later (GOAL.md: deliverability is the floor under "the best listing alert email
// in aviation").

export type DnsVerdict = 'pass' | 'fail' | 'lookup-error'

export interface DeliverabilityDnsResult {
  spf: DnsVerdict
  dkim: DnsVerdict
  dmarc: DnsVerdict
}

const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query'
const LOOKUP_TIMEOUT_MS = 5000
// Resend's default DKIM selector — confirmed against clubhanger.com's live DNS
// while scoping this feature (a real `resend._domainkey.clubhanger.com` TXT record
// exists today).
const DKIM_SELECTOR = 'resend'

function unquote(txt: string): string {
  return txt.replace(/^"|"$/g, '')
}

/** Pure — derives SPF's verdict from already-fetched TXT records (or `null` on a
 *  lookup error), so this is unit-testable with no network involved. */
export function deriveSpfVerdict(records: string[] | null): DnsVerdict {
  if (records === null) return 'lookup-error'
  return records.some((r) => r.toLowerCase().startsWith('v=spf1')) ? 'pass' : 'fail'
}

/** Pure — DKIM "passes" when the selector's TXT record exists at all (its mere
 *  presence at `resend._domainkey.<domain>` is the signal; Resend owns the value). */
export function deriveDkimVerdict(records: string[] | null): DnsVerdict {
  if (records === null) return 'lookup-error'
  return records.length > 0 ? 'pass' : 'fail'
}

/** Pure — DMARC's verdict from already-fetched TXT records at `_dmarc.<domain>`. */
export function deriveDmarcVerdict(records: string[] | null): DnsVerdict {
  if (records === null) return 'lookup-error'
  return records.some((r) => r.toLowerCase().startsWith('v=dmarc1')) ? 'pass' : 'fail'
}

/**
 * Resolves TXT records for `name` via Cloudflare's DNS-over-HTTPS JSON API (no new
 * deps — plain `fetch`). Returns `null` on any network/timeout/malformed-response
 * error — a resolver hiccup must never be confused with "no record here" (a
 * resolver timeout is NOT a fail). NXDOMAIN (`Status` 3) is a real, successful
 * "no record" answer as far as this probe is concerned — it flows through as an
 * empty list, which the `derive*Verdict` functions above correctly read as `fail`.
 */
export async function queryTxtRecords(name: string): Promise<string[] | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)
  try {
    const res = await fetch(`${DOH_ENDPOINT}?name=${encodeURIComponent(name)}&type=TXT`, {
      headers: { accept: 'application/dns-json' },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const json = await res.json()
    if (json.Status !== 0 && json.Status !== 3) return null
    const answers: unknown[] = Array.isArray(json.Answer) ? json.Answer : []
    return answers
      .filter((a): a is { type: number; data: string } => {
        const rec = a as { type?: number; data?: unknown }
        return rec.type === 16 && typeof rec.data === 'string'
      })
      .map((a) => unquote(a.data))
      .filter(Boolean)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Resolves the send domain's SPF/DKIM/DMARC state. Three honest per-record states
 * — pass / fail / lookup-error — never a fabricated verdict on a resolver hiccup.
 */
export async function runDeliverabilityDnsCheck(domain: string): Promise<DeliverabilityDnsResult> {
  const [rootTxt, dkimTxt, dmarcTxt] = await Promise.all([
    queryTxtRecords(domain),
    queryTxtRecords(`${DKIM_SELECTOR}._domainkey.${domain}`),
    queryTxtRecords(`_dmarc.${domain}`),
  ])
  return {
    spf: deriveSpfVerdict(rootTxt),
    dkim: deriveDkimVerdict(dkimTxt),
    dmarc: deriveDmarcVerdict(dmarcTxt),
  }
}
