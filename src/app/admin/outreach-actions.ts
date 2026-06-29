'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

const STATUSES = ['not_contacted', 'contacted', 'replied', 'meeting', 'joined', 'dead']

/** Update a target's outreach status (and stamp contacted_at the first time it
 *  leaves "not contacted"). Admin only. */
export async function updateTargetStatus(formData: FormData) {
  await assertAdmin()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !STATUSES.includes(status)) return

  const admin = createAdminClient()
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  // Stamp the first time it moves off "not contacted", if not already set.
  if (status !== 'not_contacted') {
    const { data: cur } = await admin
      .from('outreach_targets')
      .select('contacted_at')
      .eq('id', id)
      .maybeSingle()
    if (cur && !cur.contacted_at) patch.contacted_at = new Date().toISOString()
  }
  await admin.from('outreach_targets').update(patch).eq('id', id)
  revalidatePath('/admin/outreach')
}

/** Save freeform notes / chosen channel on a target. Admin only. */
export async function updateTargetNotes(formData: FormData) {
  await assertAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const notes = String(formData.get('notes') ?? '').trim()
  const channel = String(formData.get('channel') ?? '').trim()
  const admin = createAdminClient()
  await admin
    .from('outreach_targets')
    .update({ notes: notes || null, channel: channel || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/outreach')
}
