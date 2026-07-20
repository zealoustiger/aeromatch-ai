import { createAdminClient } from './supabase-admin'

// A daily synthetic subscribe → confirm → delete probe against the real `alerts`
// table (same columns the live subscribe/confirm chokepoints write), so a broken
// deploy or schema drift on either path shows up in the Monday admin funnel email
// the same day, instead of only as an unexplained zero-signup week later. Reserved
// address, never emailed (no `sendEmail` call anywhere in this file) and never left
// behind — deleted before returning on every path, success or failure.
export const CAPTURE_SELFCHECK_EMAIL = 'capture-selfcheck@example.com'

const SELFCHECK_SOURCE_PATH = '/self-check'

export type CaptureSelfCheckStep = 'subscribe' | 'confirm' | 'cleanup'

export type CaptureSelfCheckResult = { ok: true } | { ok: false; step: CaptureSelfCheckStep; detail: string }

/**
 * Exercises the subscribe (insert pending + tokens) → confirm (flip to confirmed) →
 * delete shape of the real chokepoints, using the admin client directly rather than
 * calling `subscribeToAlerts`/the confirm route themselves — keeps this probe from
 * ever touching `sendEmail` or the user-facing routes, while still catching the
 * failure mode that matters: the `alerts` table rejecting these columns.
 */
export async function runCaptureFunnelSelfCheck(): Promise<CaptureSelfCheckResult> {
  const admin = createAdminClient()

  // Self-heal: a prior run that failed after inserting but before deleting would
  // otherwise leave a row here forever (its (email, source_path) pair would then
  // conflict with today's insert). Best-effort, errors ignored — the insert below
  // is what actually proves whether writes work.
  await admin.from('alerts').delete().eq('email', CAPTURE_SELFCHECK_EMAIL)

  const confirmToken = crypto.randomUUID()
  const unsubscribeToken = crypto.randomUUID()
  const { data: inserted, error: insertError } = await admin
    .from('alerts')
    .insert({
      email: CAPTURE_SELFCHECK_EMAIL,
      context: 'Capture funnel self-check',
      source_path: SELFCHECK_SOURCE_PATH,
      status: 'pending',
      confirm_token: confirmToken,
      unsubscribe_token: unsubscribeToken,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return { ok: false, step: 'subscribe', detail: insertError?.message ?? 'insert returned no row' }
  }

  const { data: updated, error: updateError } = await admin
    .from('alerts')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', inserted.id)
    .eq('confirm_token', confirmToken)
    .select('status')
    .single()

  if (updateError || updated?.status !== 'confirmed') {
    await admin.from('alerts').delete().eq('id', inserted.id)
    return { ok: false, step: 'confirm', detail: updateError?.message ?? `unexpected status ${updated?.status}` }
  }

  const { error: deleteError } = await admin.from('alerts').delete().eq('id', inserted.id)
  if (deleteError) {
    return { ok: false, step: 'cleanup', detail: deleteError.message }
  }

  const { data: remaining } = await admin.from('alerts').select('id').eq('email', CAPTURE_SELFCHECK_EMAIL)
  if (remaining && remaining.length > 0) {
    return { ok: false, step: 'cleanup', detail: `${remaining.length} row(s) remain after delete` }
  }

  return { ok: true }
}
