// Pure helpers for the orphan test-alert sweep (see route.ts's sweepOrphanTestAlerts).
// Kept dependency-free/DB-free so the matching logic itself is cheaply unit-testable —
// the DB query does its own `ilike` filtering, but every returned row is re-checked
// against this exact matcher before deletion (defense in depth, never trust one layer).

const TEST_ALERT_EMAIL_PATTERN = /^[^@]+@example\.com$/i

export function isSweepableTestAlertEmail(email: string): boolean {
  return TEST_ALERT_EMAIL_PATTERN.test(email.trim())
}

export function sweepCutoffIso(nowMs: number, minAgeHours = 24): string {
  return new Date(nowMs - minAgeHours * 60 * 60 * 1000).toISOString()
}
