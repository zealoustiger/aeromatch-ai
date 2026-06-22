'use client'

import Link from 'next/link'
import { Heart, CheckCircle, X, ArrowRight, Smartphone } from 'lucide-react'

interface Props {
  /** `/auth?next=<this>` — where to return after creating an account. */
  authNext: string
  /** How many listings are already saved on this device (drives the nudge copy). */
  deviceSaveCount: number
  /** Persist to this device + fill the heart. */
  onSkip: () => void
  onClose: () => void
}

/**
 * Soft-save prompt shown when a logged-out visitor hearts a listing. Pushes a
 * free account (the synced, alert-enabled path) but honestly offers a
 * device-only fallback so we never block the save behind a wall. Fixed centered
 * modal (mirrors SignUpGate) so it can't introduce horizontal overflow.
 */
export default function SoftSavePrompt({ authNext, deviceSaveCount, onSkip, onClose }: Props) {
  const returning = deviceSaveCount >= 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Save this listing"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
          <Heart className="h-6 w-6 text-sky-600" />
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          {returning
            ? `You've saved ${deviceSaveCount} on this device`
            : 'Save this listing'}
        </h2>
        <p className="mt-2 text-slate-500">
          {returning
            ? 'Create a free account to keep your saved listings synced across devices and get alerts when similar ones appear.'
            : 'Create a free account to save it, sync across devices, and get alerts when similar listings appear.'}
        </p>

        <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
          {[
            'Synced across all your devices',
            'Email alerts for new matching listings',
            'Save searches too',
          ].map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              {perk}
            </li>
          ))}
        </ul>

        <Link
          href={`/auth?next=${encodeURIComponent(authNext)}`}
          className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          Create a free account <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="mt-4 border-t border-slate-100 pt-4 text-center">
          <button
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 underline-offset-2 hover:text-sky-600 hover:underline"
          >
            <Smartphone className="h-4 w-4" /> Skip — save on this device
          </button>
          <p className="mt-1.5 text-xs text-slate-400">
            Saved on this device only — not synced; you may lose them.
          </p>
        </div>
      </div>
    </div>
  )
}
