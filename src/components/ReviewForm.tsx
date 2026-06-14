'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { postReview } from '@/app/profile/actions'
import type { ReviewTargetType } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function ReviewForm({
  targetType,
  targetId,
}: {
  targetType: ReviewTargetType
  targetId: string
}) {
  const router = useRouter()
  const [rating, setRating] = useState<number>(0)
  const [body, setBody] = useState('')
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const res = await postReview({ targetType, targetId, rating: rating || null, body })
      if (res.error) {
        setMsg({ kind: 'error', text: res.error })
      } else {
        setBody('')
        setRating(0)
        setMsg({ kind: 'ok', text: 'Thanks — your review is posted.' })
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Rating</span>
        <div className="flex" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setRating(rating === n ? 0 : n)}
              className="p-0.5"
            >
              <Star className={cn('h-5 w-5', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">(optional)</span>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Share your experience with this listing or pilot…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />

      {msg && (
        <p className={cn('mt-2 text-sm', msg.kind === 'error' ? 'text-red-600' : 'text-emerald-600')}>{msg.text}</p>
      )}

      <button
        type="submit"
        disabled={pending || body.trim().length < 3}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
      >
        {pending ? 'Posting…' : 'Post review'}
      </button>
    </form>
  )
}
