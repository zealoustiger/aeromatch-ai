'use client'

import { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { FeedbackForm } from './FeedbackWidget'

export default function ReportListing({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
      >
        <Flag className="h-3 w-3" /> Report this listing
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-5"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Report this listing</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FeedbackForm type="report" listingId={listingId} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
