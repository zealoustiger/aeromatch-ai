// A combined-digest unsubscribe/recovery link carries every covered alert's
// `unsubscribe_token` as a single comma-separated string (see alert-digest's
// `allTokens` and /api/alerts/unsubscribe's `applyUnsubscribe`). This is the one
// place that string gets parsed, so the unsubscribe route and the token-scoped
// recovery actions (pause/snooze/weekly/found) all treat a single token and an
// N-token combined link identically.
export function parseAlertTokens(raw: string | null | undefined): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  for (const part of raw.split(',')) {
    const trimmed = part.trim()
    if (trimmed) seen.add(trimmed)
  }
  return [...seen]
}
