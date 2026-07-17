import { createAdminClient } from './supabase-admin'
import { normalizeFrequency, type AlertFrequency } from './alertFrequency'

export interface SavedSearchAlertDetail {
  id: string
  frequency: AlertFrequency
  priceDropOptIn: boolean
  newListingOptOut: boolean
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
  const optionalCols = ['frequency', 'price_drop_opt_in', 'new_listing_opt_out']
  let cols = [...baseCols, ...optionalCols]
  type Row = {
    id: string
    source_path: string | null
    frequency?: string
    price_drop_opt_in?: boolean
    new_listing_opt_out?: boolean
  }
  let { data, error } = (await admin
    .from('alerts')
    .select(cols.join(', '))
    .eq('email', email)
    .eq('status', 'confirmed')) as unknown as { data: Row[] | null; error: { message: string } | null }
  // Any subset of frequency/price_drop_opt_in/new_listing_opt_out may not be
  // migrated live yet — retry without whichever column(s) the error names (up
  // to three passes), same graceful-degrade pattern as /alerts/manage's
  // fetchAlertsForEmail, rather than losing the page.
  for (let i = 0; i < optionalCols.length && error && optionalCols.some((c) => error!.message?.includes(c)); i++) {
    cols = cols.filter((c) => !error!.message.includes(c))
    ;({ data, error } = (await admin
      .from('alerts')
      .select(cols.join(', '))
      .eq('email', email)
      .eq('status', 'confirmed')) as unknown as { data: Row[] | null; error: { message: string } | null })
  }

  const details = new Map<string, SavedSearchAlertDetail>()
  for (const row of data ?? []) {
    if (!row.source_path) continue
    details.set(row.source_path, {
      id: row.id,
      frequency: normalizeFrequency(row.frequency),
      priceDropOptIn: row.price_drop_opt_in ?? true,
      newListingOptOut: row.new_listing_opt_out ?? false,
    })
  }
  return details
}
