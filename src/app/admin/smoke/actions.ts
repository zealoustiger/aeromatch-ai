'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const BASE_URL = 'https://clubhanger.com'

/** Queue a production smoke run. The VPS poller picks it up within ~a minute and
 *  streams per-test results back. Admin only; coalesces if one is already active. */
export async function requestSmokeRun() {
  const email = await assertAdmin()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  // Don't stack runs — if one is already queued or running, leave it.
  const { data: active } = await admin
    .from('smoke_runs')
    .select('id')
    .in('status', ['requested', 'running'])
    .limit(1)
  if (active && active.length > 0) {
    revalidatePath('/admin/smoke')
    return
  }

  await admin.from('smoke_runs').insert({
    status: 'requested',
    base_url: BASE_URL,
    requested_by: user?.id ?? null,
    requested_email: email,
  })
  revalidatePath('/admin/smoke')
}
