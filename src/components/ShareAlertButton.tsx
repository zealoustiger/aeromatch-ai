'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { withShareParam } from '@/lib/shareAlertLink'
import { track } from '@/lib/analytics'

/**
 * Per-row "share this alert" action on /alerts/manage — a co-ownership
 * marketplace's alerts are naturally shared with the partner you're buying
 * with. Copies a link to the alert's own source_path (never the sharer's
 * email/token) with `?share=alert` appended, so the recipient's AlertSignup
 * instance shows a "someone shared this with you" note and sets up their OWN
 * alert — nothing of the sharer's is exposed or reused.
 */
export default function ShareAlertButton({ sourcePath }: { sourcePath: string | null }) {
  const [copied, setCopied] = useState(false)

  if (!sourcePath) return null

  async function handleShare() {
    if (!sourcePath) return
    const url = `${window.location.origin}${withShareParam(sourcePath)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy this link to share:', url)
      return
    }
    track('alert_shared', { source_path: sourcePath })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Copy a link your co-buyer can use to set up their own alert for this search"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
