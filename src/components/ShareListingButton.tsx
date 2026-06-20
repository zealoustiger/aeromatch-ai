'use client'

import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A tasteful copy-link "Share" button for a listing detail page. Copies the
 * canonical listing URL to the clipboard using the Web Clipboard API, with a
 * graceful `document.execCommand('copy')` fallback for older/insecure contexts,
 * and shows a brief "Copied!" confirmation. Copy-link only — no native share
 * sheet. Sky-blue accent.
 */
export default function ShareListingButton({
  url,
  className,
}: {
  url: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        ok = true
      }
    } catch {
      ok = false
    }

    if (!ok) {
      // Fallback for browsers without the async Clipboard API (or non-secure
      // contexts): a hidden textarea + execCommand('copy').
      try {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.setAttribute('readonly', '')
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        ok = document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        ok = false
      }
    }

    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy link to this listing"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
        copied
          ? 'border-sky-200 bg-sky-50 text-sky-700'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-sky-700',
        className,
      )}
    >
      {copied ? (
        <Check className="h-4 w-4 text-sky-600" aria-hidden="true" />
      ) : (
        <Link2 className="h-4 w-4" aria-hidden="true" />
      )}
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
