const TOP_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'live.com',
  'msn.com',
  'comcast.net',
  'me.com',
]

/** Damerau-Levenshtein (optimal string alignment) distance, capped at "is it <= 1?". */
function isCloseTypo(a: string, b: string): boolean {
  if (a === b) return false
  if (Math.abs(a.length - b.length) > 1) return false
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1)
      }
    }
  }
  return dp[a.length][b.length] === 1
}

/**
 * Suggests a corrected full address when the submitted domain looks like a one-typo
 * miss of a top consumer domain (transposition/insertion/deletion/substitution) —
 * "gmial.com" -> "gmail.com", "gmail.con" -> "gmail.com". Returns null when the domain
 * is already an exact match, unrecognized, or too far off to guess honestly.
 */
export function suggestEmailFix(email: string): string | null {
  const at = email.lastIndexOf('@')
  if (at <= 0 || at === email.length - 1) return null
  const local = email.slice(0, at)
  const domain = email.slice(at + 1).trim().toLowerCase()
  if (!domain || TOP_DOMAINS.includes(domain)) return null
  const match = TOP_DOMAINS.find((candidate) => isCloseTypo(domain, candidate))
  return match ? `${local}@${match}` : null
}
