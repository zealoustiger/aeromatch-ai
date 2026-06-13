'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Renders a draggable bookmarklet anchor. React strips `javascript:` hrefs from
 * JSX, so we set the attribute directly on the DOM node after mount.
 */
export default function BookmarkletLink({ code }: { code: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    ref.current?.setAttribute('href', code)
  }, [code])

  return (
    <div className="space-y-3">
      <a
        ref={ref}
        onClick={(e) => e.preventDefault()}
        className="inline-block cursor-grab rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 active:cursor-grabbing"
      >
        ✈ Save to ClubHanger
      </a>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className="ml-3 text-xs font-medium text-slate-500 underline hover:text-slate-700"
      >
        {copied ? 'Copied!' : 'Copy code instead'}
      </button>
    </div>
  )
}
