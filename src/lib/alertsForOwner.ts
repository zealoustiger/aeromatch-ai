import { createAdminClient } from '@/lib/supabase-admin'

export interface AlertRow {
  id: string
  context: string | null
  source_path: string | null
  status: string
  created_at: string
  confirmed_at: string | null
  last_digest_at: string | null
  price_drop_opt_in?: boolean
  new_listing_opt_out?: boolean
  frequency?: string
  paused_until?: string | null
  pending_email?: string | null
  target_price?: number | null
}

const OPTIONAL_COLS = [
  'price_drop_opt_in',
  'new_listing_opt_out',
  'frequency',
  'paused_until',
  'pending_email',
  'target_price',
]

// Email-keyed, not user_id-keyed (alerts require no account). Anon/authenticated
// has no SELECT on this PII-holding table by design (see actions.ts), so this
// reads via the service-role client, scoped to the owning email — either the
// signed-in user's own, or the one resolved from a manage-link token. A query
// failure still looks like "no rows" here, never a 500.
export async function fetchAlertsForEmail(email: string): Promise<AlertRow[]> {
  const admin = createAdminClient()
  const baseCols = ['id', 'context', 'source_path', 'status', 'created_at', 'confirmed_at', 'last_digest_at']
  let cols = [...baseCols, ...OPTIONAL_COLS]
  let { data, error } = (await admin
    .from('alerts')
    .select(cols.join(', '))
    .eq('email', email)
    .neq('status', 'unsubscribed')
    .order('created_at', { ascending: false })) as unknown as {
    data: AlertRow[] | null
    error: { message: string } | null
  }
  // Any subset of price_drop_opt_in/frequency/paused_until may not be
  // migrated live yet — retry without whichever column(s) the error names
  // (PostgREST reports one unknown column per error, so this can take up to
  // three passes) rather than losing the whole page (graceful fallback, same
  // pattern as profiles.favorite_airports); rows just render with those
  // toggles defaulted on/weekly/never-snoozed.
  for (let i = 0; i < OPTIONAL_COLS.length && error && OPTIONAL_COLS.some((c) => error!.message?.includes(c)); i++) {
    cols = cols.filter((c) => !error!.message.includes(c))
    ;({ data, error } = (await admin
      .from('alerts')
      .select(cols.join(', '))
      .eq('email', email)
      .neq('status', 'unsubscribed')
      .order('created_at', { ascending: false })) as unknown as {
      data: AlertRow[] | null
      error: { message: string } | null
    })
  }
  return data ?? []
}

export interface AdminAlertRow {
  id: string
  context: string | null
  status: string
  created_at: string
  last_digest_at: string | null
  frequency?: string
  source?: string | null
}

const ADMIN_OPTIONAL_COLS = ['frequency', 'source']

// Support-tooling variant of fetchAlertsForEmail: includes unsubscribed rows
// (a human answering "why did I get this / I unsubscribed but still got one"
// needs to see those too) and the source column, but never selects the raw
// unsubscribe_token/confirm_token — this is rendered straight into an admin
// page, and those tokens must never be displayable there.
export async function fetchAlertsForEmailAdmin(email: string): Promise<AdminAlertRow[]> {
  const admin = createAdminClient()
  const baseCols = ['id', 'context', 'status', 'created_at', 'last_digest_at']
  let cols = [...baseCols, ...ADMIN_OPTIONAL_COLS]
  let { data, error } = (await admin
    .from('alerts')
    .select(cols.join(', '))
    .eq('email', email)
    .order('created_at', { ascending: false })) as unknown as {
    data: AdminAlertRow[] | null
    error: { message: string } | null
  }
  for (
    let i = 0;
    i < ADMIN_OPTIONAL_COLS.length && error && ADMIN_OPTIONAL_COLS.some((c) => error!.message?.includes(c));
    i++
  ) {
    cols = cols.filter((c) => !error!.message.includes(c))
    ;({ data, error } = (await admin
      .from('alerts')
      .select(cols.join(', '))
      .eq('email', email)
      .order('created_at', { ascending: false })) as unknown as {
      data: AdminAlertRow[] | null
      error: { message: string } | null
    })
  }
  return data ?? []
}
