import { createServerSupabaseClient } from './supabase-server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/** Returns the signed-in admin's email, or null if not signed in / not allowed. */
export async function getAdminEmail(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email?.toLowerCase()
  if (!email) return null
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) return null
  return email
}

/** Throws if the caller isn't an admin — use to guard server actions. */
export async function assertAdmin(): Promise<string> {
  const email = await getAdminEmail()
  if (!email) throw new Error('Not authorized')
  return email
}
