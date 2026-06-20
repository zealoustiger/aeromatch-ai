import { createAdminClient } from './supabase-admin'

export type AdminDoc = { title: string; content: string; updated_at: string }

export async function getAdminDoc(key: string): Promise<AdminDoc | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('admin_content')
    .select('title, content, updated_at')
    .eq('key', key)
    .maybeSingle()
  return data
}
