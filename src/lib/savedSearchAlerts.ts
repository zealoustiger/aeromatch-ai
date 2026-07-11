import { createAdminClient } from './supabase-admin'

/**
 * Which of a user's saved searches already have a real, confirmed email alert
 * (see `subscribeSavedSearchAlert` in actions.ts). Read-only, service-role —
 * `alerts` has no public/authenticated SELECT policy (PII protection), so this
 * mirrors the service-role read `/alerts/manage` already uses.
 */
export async function getAlertedSourcePaths(email: string): Promise<Set<string>> {
  if (!email) return new Set()

  const admin = createAdminClient()
  const { data } = await admin
    .from('alerts')
    .select('source_path')
    .eq('email', email)
    .eq('status', 'confirmed')

  return new Set((data ?? []).map((row) => row.source_path).filter((p): p is string => !!p))
}
