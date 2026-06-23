import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

// Double-opt-in confirmation. The link in the confirmation email points here with
// the row's `confirm_token`; we flip that pending alert to confirmed and bounce
// the visitor to a friendly status page. Anon can't UPDATE `alerts` (RLS), so we
// use the service role. Fails soft to ?state=invalid — never a 500 on a stale or
// bogus token.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const dest = (state: string) =>
    NextResponse.redirect(`${SITE_URL}/alerts/status?state=${state}`)

  if (!token) return dest('invalid')

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('alerts')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('confirm_token', token)
      .neq('status', 'unsubscribed')
      .select('id, status')

    if (error) {
      console.error('[alerts/confirm] update failed:', error.message)
      return dest('invalid')
    }
    if (!data || data.length === 0) return dest('invalid')
    return dest('confirmed')
  } catch (err) {
    console.error('[alerts/confirm] error:', err)
    return dest('invalid')
  }
}
