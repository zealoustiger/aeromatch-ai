'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AircraftFacets } from '@/lib/aircraft-facets'
import PartnershipFilters from './PartnershipFilters'
import AircraftSaleFilters from './AircraftSaleFilters'

interface Props {
  initialValues: Record<string, string | undefined>
  activeCount: number
  variant?: 'partnership' | 'sale'
  facets?: AircraftFacets
}

export default function MobileFiltersDrawer({ initialValues, activeCount, variant = 'partnership', facets }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="font-semibold text-slate-900">Filter Results</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable filters */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {variant === 'sale' ? (
            <AircraftSaleFilters initialValues={initialValues} facets={facets} />
          ) : (
            <PartnershipFilters initialValues={initialValues} />
          )}
        </div>

        {/* Done button */}
        <div className="border-t border-slate-100 px-5 py-4">
          <button
            onClick={() => setOpen(false)}
            className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            See results
          </button>
        </div>
      </div>
    </>
  )
}
