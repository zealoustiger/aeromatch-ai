const PROVIDERS: Array<{ domains: string[]; label: string; url: string }> = [
  { domains: ['gmail.com', 'googlemail.com'], label: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox' },
  { domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'], label: 'Outlook', url: 'https://outlook.live.com/mail/inbox' },
  { domains: ['yahoo.com', 'yahoo.co.uk', 'ymail.com'], label: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  { domains: ['icloud.com', 'me.com', 'mac.com'], label: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  { domains: ['aol.com'], label: 'AOL Mail', url: 'https://mail.aol.com' },
]

/**
 * Maps a submitted email address's domain to its webmail inbox. Returns null for any
 * unrecognized domain or malformed address — never a guessed/fabricated link.
 */
export function getEmailProviderLink(email: string): { label: string; url: string } | null {
  const at = email.lastIndexOf('@')
  if (at === -1 || at === email.length - 1) return null
  const domain = email.slice(at + 1).trim().toLowerCase()
  if (!domain) return null
  const match = PROVIDERS.find((p) => p.domains.includes(domain))
  if (!match) return null
  return { label: match.label, url: match.url }
}
