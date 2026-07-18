'use client'

import { Download } from 'lucide-react'

// Read-only sibling of DeleteAllAlertsControl — "see what we hold before you
// decide to delete it." A plain link to the export route (real file download
// via that route's Content-Disposition header), same quiet visual weight as
// the delete-all trigger it sits beside.
export default function DownloadAlertDataLink({ token, count }: { token?: string; count: number }) {
  if (count === 0) return null

  const href = token ? `/api/alerts/export?token=${encodeURIComponent(token)}` : '/api/alerts/export'

  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-slate-400 underline-offset-2 hover:text-slate-700 hover:underline"
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
      Download my alert data
    </a>
  )
}
