'use client'

import { useActionState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { useFormDraft } from '@/components/useFormDraft'
import { createAircraftListing } from '@/app/actions'

const MAKES = ['Cessna', 'Piper', 'Beechcraft', 'Cirrus', 'Mooney', "Van's", 'Diamond', 'Grumman', 'Other']

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100',
        className
      )}
      {...props}
    />
  )
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-slate-100 pb-2 text-base font-semibold text-slate-800">
      {children}
    </h2>
  )
}

export default function PostAircraftForm() {
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        track('aircraft_listing_submitted', {
          make: formData.get('make'),
          state: formData.get('state'),
          asking_price: formData.get('asking_price'),
        })
        await createAircraftListing(formData)
        return { ok: true }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong' }
      }
    },
    null
  )

  const { formRef, status, handleSubmit, handleResult } = useFormDraft('ch:draft:aircraft-new')

  useEffect(() => {
    if (state) handleResult(Boolean(state.ok))
  }, [state, handleResult])

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-end">
        <span className="text-xs text-slate-400">
          {status === 'saved' || status === 'restored' ? 'Draft saved' : 'Your progress autosaves on this device'}
        </span>
      </div>

      {/* Aircraft details */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Aircraft Details</SectionHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Make</Label>
            <Select name="make" required>
              <option value="">Select make</option>
              {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <div>
            <Label required>Model</Label>
            <Input name="model" placeholder="e.g. 182T Skylane" required />
          </div>
          <div>
            <Label>Year</Label>
            <Input name="year" type="number" placeholder="e.g. 2006" min={1940} max={new Date().getFullYear()} />
          </div>
          <div>
            <Label>N-Number (Registration)</Label>
            <Input name="registration" placeholder="e.g. N12345" className="font-mono uppercase" />
          </div>
          <div>
            <Label>Total Time (TTAF, hrs)</Label>
            <Input name="ttaf" type="number" placeholder="e.g. 2450" min={0} />
          </div>
          <div>
            <Label>SMOH (hrs since overhaul)</Label>
            <Input name="smoh" type="number" placeholder="e.g. 600" min={0} />
          </div>
        </div>
      </section>

      {/* Listing content */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Listing Details</SectionHeader>
        <div className="space-y-4">
          <div>
            <Label required>Title</Label>
            <Input name="title" placeholder="e.g. 2006 Cessna 182T Skylane — G1000, 2,450 TTAF" required />
            <p className="mt-1 text-xs text-slate-400">Be specific — include year, make/model, and a standout detail.</p>
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              name="description"
              rows={5}
              placeholder="Avionics, engine/prop times, damage history, paint/interior, why you're selling, anything a buyer should know…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>
      </section>

      {/* Price + location */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Price &amp; Location</SectionHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Asking Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <Input name="asking_price" type="number" placeholder="285000" className="pl-7" min={0} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Leave blank for &ldquo;contact for price.&rdquo;</p>
          </div>
          <div>
            <Label>Location</Label>
            <Input name="location" placeholder="e.g. Austin, TX" />
          </div>
          <div>
            <Label>State</Label>
            <Input name="state" placeholder="TX" maxLength={2} className="uppercase" />
            <p className="mt-1 text-xs text-slate-400">2-letter code — powers the state search pages.</p>
          </div>
        </div>
      </section>

      {state && !state.ok && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error ?? 'Something went wrong. Please try again.'}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-600 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60"
      >
        {pending ? 'Submitting…' : 'Post Aircraft for Sale'}
      </button>
    </form>
  )
}
