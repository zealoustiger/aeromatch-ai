import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { resolveOwnerEmail } from '@/lib/alertOwner'
import { fetchAllAlertsForEmail } from '@/lib/alertsForOwner'

export const dynamic = 'force-dynamic'

// Self-serve "download my alert data" — the read-only sibling of
// deleteAllAlerts (actions.ts): same ownership proof (signed-in session, or
// the manage-link `unsubscribe_token` for the no-account majority), but
// returns every row instead of deleting it. Behind a GET (not a server
// action) so the browser can drive a real file download via
// Content-Disposition.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim() || undefined
  const admin = createAdminClient()
  const ownerEmail = await resolveOwnerEmail(admin, token)
  if (!ownerEmail) {
    return NextResponse.json({ error: token ? 'This link is no longer valid.' : 'Not authenticated' }, { status: 401 })
  }

  const alerts = await fetchAllAlertsForEmail(ownerEmail)
  const payload = {
    email: ownerEmail,
    exported_at: new Date().toISOString(),
    alert_count: alerts.length,
    alerts,
  }

  const filename = `clubhanger-alerts-${ownerEmail.replace(/[^a-z0-9]/gi, '_')}.json`
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
