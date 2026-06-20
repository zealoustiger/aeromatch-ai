'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

/** Hide (status=closed) or restore (status=active) a listing. Admin only. */
export async function moderateListing(formData: FormData) {
  await assertAdmin()
  const kind = formData.get('kind') as string // 'partnership' | 'aircraft'
  const id = formData.get('id') as string
  const action = formData.get('action') as string // 'hide' | 'restore'
  if (!id || !['partnership', 'aircraft'].includes(kind)) return

  const table = kind === 'aircraft' ? 'aircraft_for_sale' : 'partnerships'
  const status = action === 'hide' ? 'closed' : 'active'

  const admin = createAdminClient()
  await admin.from(table).update({ status }).eq('id', id)

  revalidatePath('/admin/listings')
  revalidatePath(kind === 'aircraft' ? '/aircraft' : '/partnerships')
}
