import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// Alerts have no user_id (they're settable with no account), so "ownership" is
// proven either by the signed-in user's own email, or — for the majority of
// subscribers who never created an account — by the `unsubscribe_token` their
// own alert email already carries. Resolving the token's OWN alert to an email
// then unlocks every alert for that SAME email, exactly like the session path
// unlocks every alert for the signed-in user's email — neither path is scoped
// to a single row's id. Shared by every "act on all of this email's alerts"
// entry point: the bulk server actions in `src/app/actions.ts` and the
// data-export route.
export async function resolveOwnerEmail(admin: ReturnType<typeof createAdminClient>, token?: string) {
  if (token) {
    const { data } = await admin.from('alerts').select('email').eq('unsubscribe_token', token).maybeSingle()
    return data?.email?.toLowerCase() ?? null
  }
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.email?.toLowerCase() ?? null
}
