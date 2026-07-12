import { createAdminClient } from './supabase-admin'
import { normalizeFrequency, type AlertFrequency } from './alertFrequency'

export interface SavedSearchAlertDetail {
  id: string
  frequency: AlertFrequency
  priceDropOptIn: boolean
}

/**
 * Which of a user's saved searches already have a real, confirmed email alert
 * (see `subscribeSavedSearchAlert` in actions.ts), keyed by `source_path`, plus
 * enough of each alert's own settings (id, frequency, price-drop opt-in) to
 * render the same inline controls `/alerts/manage` has — read-only, service-role
 * (`alerts` has no public/authenticated SELECT policy, PII protection), mirrors
 * the service-role read `/alerts/manage` already uses.
 */
export async function getAlertDetailsBySourcePath(email: string): Promise<Map<string, SavedSearchAlertDetail>> {
  if (!email) return new Map()

  const admin = createAdminClient()
  const baseCols = ['id', 'source_path']
  let cols = [...baseCols, 'frequency', 'price_drop_opt_in']
  let { data, error } = (await admin
    .from('alerts')
    .select(cols.join(', '))
    .eq('email', email)
    .eq('status', 'confirmed')) as unknown as {
    data: { id: string; source_path: string | null; frequency?: string; price_drop_opt_in?: boolean }[] | null
    error: { message: string } | null
  }
  // `frequency`/`price_drop_opt_in` may not be migrated live yet — retry without
  // whichever column(s) the error names (up to two passes), same graceful-degrade
  // pattern as /alerts/manage's fetchAlertsForEmail, rather than losing the page.
  for (let i = 0; i < 2 && error && (error.message?.includes('price_drop_opt_in') || error.message?.includes('frequency')); i++) {
    cols = cols.filter((c) => !error!.message.includes(c))
    ;({ data, error } = (await admin
      .from('alerts')
      .select(cols.join(', '))
      .eq('email', email)
      .eq('status', 'confirmed')) as unknown as {
      data: { id: string; source_path: string | null; frequency?: string; price_drop_opt_in?: boolean }[] | null
      error: { message: string } | null
    })
  }

  const details = new Map<string, SavedSearchAlertDetail>()
  for (const row of data ?? []) {
    if (!row.source_path) continue
    details.set(row.source_path, {
      id: row.id,
      frequency: normalizeFrequency(row.frequency),
      priceDropOptIn: row.price_drop_opt_in ?? true,
    })
  }
  return details
}
