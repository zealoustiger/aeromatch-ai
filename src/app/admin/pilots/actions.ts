'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

/** Grant or revoke a pilot's public "Verified" badge (`profiles.verified`).
 *  Service-role only — the column is trigger-protected against non-admin writes. */
export async function setPilotVerified(formData: FormData) {
  await assertAdmin()
  const userId = formData.get('user_id') as string
  const verified = formData.get('verified') === 'true'
  if (!userId) return

  const admin = createAdminClient()
  await admin.from('profiles').update({ verified }).eq('user_id', userId)

  revalidatePath('/admin/pilots')
  revalidatePath(`/pilots/${userId}`)
}
