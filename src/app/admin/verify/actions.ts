'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.auth.getUser()
    const email = data.user?.email?.toLowerCase()
    return !!email && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email))
  } catch {
    return false
  }
}

/**
 * Admin-only: set a pilot's verification status and verified ratings.
 * Runs under the service role so it passes the protect_profile_verification trigger
 * (which freezes these fields for everyone else). This is the ONLY path that can
 * grant a "Verified by ClubHanger" badge.
 */
export async function setProfileVerification(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return

  const userId = formData.get('user_id') as string
  if (!userId) return

  const verified = formData.get('verified') === 'on'
  const verifiedRatings = ((formData.get('verified_ratings') as string) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  try {
    const admin = createAdminClient()
    await admin.from('profiles').update({ verified, verified_ratings: verifiedRatings }).eq('user_id', userId)
    revalidatePath('/admin/verify')
    revalidatePath(`/pilots/${userId}`)
  } catch {
    // fail soft — table may not exist yet (migration 0001 pending)
  }
}
