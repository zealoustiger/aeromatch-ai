// Guards outbound fetches of a user-pasted URL (aircraft-listing URL prefill)
// against SSRF: only plain http(s) on standard ports, and never a hostname
// that is — or resolves to — a loopback / private / link-local / cloud
// metadata address. This runs at request time; it doesn't pin the fetch to
// the exact resolved IP, so a DNS-rebinding attacker could in principle swap
// the address between this check and the fetch. Acceptable residual risk
// here: the caller is always an authenticated user bound by the existing
// AI-draft rate limit, not an anonymous/public endpoint.

import dns from 'node:dns/promises'
import net from 'node:net'

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const ALLOWED_PORTS = new Set(['', '80', '443'])

function isDisallowedIp(address: string): boolean {
  const type = net.isIP(address)
  if (type === 4) {
    const [a, b] = address.split('.').map(Number)
    if (a === 127) return true // loopback
    if (a === 10) return true // private
    if (a === 172 && b >= 16 && b <= 31) return true // private
    if (a === 192 && b === 168) return true // private
    if (a === 169 && b === 254) return true // link-local incl. cloud metadata (169.254.169.254)
    if (a === 0) return true // "this network"
    if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
    return false
  }
  if (type === 6) {
    const lower = address.toLowerCase()
    if (lower === '::1') return true // loopback
    if (lower === '::') return true
    if (lower.startsWith('fe80:') || lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true // unique local
    if (lower.startsWith('::ffff:')) return isDisallowedIp(lower.slice('::ffff:'.length)) // IPv4-mapped
    return false
  }
  return true // not a recognizable literal IP — treat as disallowed if it slips through here
}

/** Throws with a user-safe message if `raw` isn't a fetchable public http(s) URL. */
export async function assertSafePublicUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error("That doesn't look like a valid URL.")
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new Error('Only http/https links are supported.')
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new Error('That link uses a non-standard port — not supported.')
  }
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error("Can't fetch that link.")
  }
  // Literal IP in the URL itself (bypasses DNS entirely).
  if (net.isIP(hostname) && isDisallowedIp(hostname)) {
    throw new Error("Can't fetch that link.")
  }

  let addresses: string[]
  try {
    addresses = (await dns.lookup(hostname, { all: true })).map((a) => a.address)
  } catch {
    throw new Error("Couldn't resolve that link's address.")
  }
  if (!addresses.length || addresses.some(isDisallowedIp)) {
    throw new Error("Can't fetch that link.")
  }

  return url
}
