import { createAdminClient } from '@/lib/supabase-admin'

// Every `path` a live MonetizationIntent CTA uses today (aircraft listing detail +
// partnership listing detail). Keep in sync with the `path` props in
// src/app/aircraft/listing/[id]/page.tsx and src/app/partnerships/[id]/page.tsx.
export const MONETIZATION_PATHS: Record<string, string> = {
  broker: 'Work with a broker',
  financing: 'Financing',
  insurance: 'Insurance quote',
  escrow: 'Escrow / title',
  prebuy: 'Pre-buy inspection',
  partnership_formation: 'Help me form a partnership',
  co_ownership_management: 'Manage my co-ownership',
}

export interface MonetizationTallyRow {
  path: string
  label: string
  count: number
  share: number // 0-1 of total; 0 when total is 0
}

export interface MonetizationTallySnapshot {
  rows: MonetizationTallyRow[]
  total: number
  computedAt: string
}

/**
 * Real, honest opt-in counts per revenue-path "coming soon" CTA — the `waitlist`
 * table is keyed by email (one row per email, upserted), so this counts distinct
 * people who left an email for that path, not raw button-clicks (the click itself
 * only fires a `monetization_intent` PostHog event, not queried here).
 */
export async function getMonetizationTally(): Promise<MonetizationTallySnapshot> {
  const admin = createAdminClient()
  const paths = Object.keys(MONETIZATION_PATHS)

  const { data } = await admin.from('waitlist').select('source').in('source', paths)

  const counts = new Map<string, number>(paths.map((p) => [p, 0]))
  for (const row of data ?? []) {
    if (row.source && counts.has(row.source)) {
      counts.set(row.source, (counts.get(row.source) ?? 0) + 1)
    }
  }

  const total = [...counts.values()].reduce((sum, n) => sum + n, 0)

  const rows: MonetizationTallyRow[] = paths
    .map((path) => ({
      path,
      label: MONETIZATION_PATHS[path],
      count: counts.get(path) ?? 0,
      share: total > 0 ? (counts.get(path) ?? 0) / total : 0,
    }))
    .sort((a, b) => b.count - a.count)

  return { rows, total, computedAt: new Date().toISOString() }
}
