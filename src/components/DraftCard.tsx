'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ExternalLink, Trash2, Check } from 'lucide-react'
import { publishDraft, dismissDraft } from '@/app/admin/review/actions'

interface Draft {
  id: string
  created_at: string
  source: string
  source_url: string | null
  raw_text: string | null
  images: string[]
  parsed: Record<string, unknown>
}

const SHARE_TYPES = ['1/2', '1/3', '1/4', 'leaseback', 'dry_lease', 'other']

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-xs font-medium text-slate-500">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
    </label>
  )
}

export default function DraftCard({ draft }: { draft: Draft }) {
  const p = draft.parsed ?? {}
  const [busy, setBusy] = useState(false)
  const str = (k: string) => (p[k] != null ? String(p[k]) : '')

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
          {draft.source}
        </span>
        {draft.source_url && (
          <a
            href={draft.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700"
          >
            Original post <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Re-hosted images */}
      {draft.images.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {draft.images.map((img) => (
            <div key={img} className="relative h-24 w-32 overflow-hidden rounded-lg bg-slate-100">
              <Image src={img} alt="" fill className="object-cover" sizes="128px" unoptimized />
            </div>
          ))}
        </div>
      )}

      {/* Raw captured text for reference */}
      {draft.raw_text && (
        <details className="mb-4">
          <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600">
            Captured text
          </summary>
          <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-line rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            {draft.raw_text}
          </p>
        </details>
      )}

      <form
        action={async (fd) => {
          setBusy(true)
          try {
            await publishDraft(fd)
          } finally {
            setBusy(false)
          }
        }}
      >
        <input type="hidden" name="draft_id" value={draft.id} />
        <input type="hidden" name="images" value={draft.images.join(',')} />
        <input type="hidden" name="source_url" value={draft.source_url ?? ''} />

        <Field label="Title" name="title" defaultValue={str('title')} />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Make" name="make" defaultValue={str('make')} />
          <Field label="Model" name="model" defaultValue={str('model')} />
          <Field label="Year" name="year" defaultValue={str('year')} placeholder="e.g. 2008" />
          <Field label="Home airport" name="home_airport" defaultValue={str('home_airport')} placeholder="KHWD" />
          <Field label="City" name="city" defaultValue={str('city')} />
          <Field label="State" name="state" defaultValue={str('state') || 'CA'} />
          <label className="block">
            <span className="mb-0.5 block text-xs font-medium text-slate-500">Share type</span>
            <select
              name="share_type"
              defaultValue={str('share_type') || 'other'}
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            >
              {SHARE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Field label="Buy-in $" name="buy_in_price" defaultValue={str('buy_in_price')} />
          <Field label="Monthly $" name="monthly_fixed" defaultValue={str('monthly_fixed')} />
          <Field label="Wet $/hr" name="hourly_wet" defaultValue={str('hourly_wet')} />
          <Field label="Contact name" name="contact_name" defaultValue={str('contact_name')} />
          <label className="block">
            <span className="mb-0.5 block text-xs font-medium text-slate-500">Posted</span>
            <input
              type="date"
              name="posted_at"
              defaultValue={str('posted_at')}
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-0.5 block text-xs font-medium text-slate-500">Description</span>
          <textarea
            name="description"
            defaultValue={draft.raw_text ?? ''}
            rows={4}
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto sm:py-2"
          >
            <Check className="h-4 w-4" /> Publish
          </button>
          <button
            type="submit"
            formAction={dismissDraft}
            disabled={busy}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 sm:w-auto sm:py-2"
          >
            <Trash2 className="h-4 w-4" /> Dismiss
          </button>
        </div>
      </form>
    </article>
  )
}
