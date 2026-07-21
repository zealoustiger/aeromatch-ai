'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

// Mirrors SeekerFilters.tsx/PartnershipFilters.tsx's identical local helper.
function parseAirportCodes(raw: string): string[] {
  const out: string[] = []
  for (const token of raw.split(/[\s,]+/)) {
    const code = token.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length >= 2 && code.length <= 4 && !out.includes(code)) out.push(code)
  }
  return out
}

/**
 * Controlled multi-airport chip field — type a code and press Enter/comma (or
 * blur) to add it, click a chip's × to remove it. Used by `AlertEditForm`
 * (Edit) and `NewAlertForm` (New alert / Duplicate) so a 2+-airport criterion
 * has one consistent, add/remove-able UI everywhere it's editable, matching
 * the browse-page filters' own interaction (`SeekerFilters`/
 * `PartnershipFilters`).
 */
export default function AirportChipsInput({
  codes,
  onChange,
  inputClassName,
}: {
  codes: string[]
  onChange: (codes: string[]) => void
  inputClassName: string
}) {
  const [draft, setDraft] = useState('')

  function commitDraft() {
    const additions = parseAirportCodes(draft)
    setDraft('')
    if (!additions.length) return
    const next = [...codes]
    for (const code of additions) if (!next.includes(code)) next.push(code)
    if (next.length !== codes.length) onChange(next)
  }

  return (
    <div>
      {codes.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {codes.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onChange(codes.filter((c) => c !== code))}
              aria-label={`Remove ${code}`}
              className="group inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 py-1 pl-2.5 pr-1.5 font-mono text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
            >
              {code}
              <X className="h-3 w-3 text-sky-400 group-hover:text-sky-600" />
            </button>
          ))}
        </div>
      )}
      <input
        type="text"
        placeholder="e.g. KHWD, KPAO — Enter to add"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commitDraft()
          }
        }}
        onBlur={commitDraft}
        className={`${inputClassName} font-mono uppercase`}
      />
    </div>
  )
}
