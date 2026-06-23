import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

// One-click unsubscribe. Every alert email links here with the row's
// `unsubscribe_token`; we flip the alert to unsubscribed (works from any prior
// state — pending or confirmed) and land the visitor on a friendly status page.
// Service role, because anon can't UPDATE `alerts` (RLS). Fails soft.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const dest = (state: string) =>
    NextResponse.redirect(`${SITE_URL}/alerts/status?state=${state}`)

  if (!token) return dest('invalid')

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('alerts')
      .update({ status: 'unsubscribed' })
      .eq('unsubscribe_token', token)
      .select('id')

    if (error) {
      console.error('[alerts/unsubscribe] update failed:', error.message)
      return dest('invalid')
    }
    if (!data || data.length === 0) return dest('invalid')
    return dest('unsubscribed')
  } catch (err) {
    console.error('[alerts/unsubscribe] error:', err)
    return dest('invalid')
  }
}
