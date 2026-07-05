'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { classifyPostText, stashPostHandoff, POST_TARGET_HREF } from '@/lib/postHandoff'

/** Sits above the 3 choice cards on `/post`. Paste notes or a listing link and we guess
 * which form you need, then carry the text straight into that form's own AI-prefill box. */
export default function PostHandoffBox() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || pending) return
    setPending(true)
    stashPostHandoff(trimmed)
    router.push(POST_TARGET_HREF[classifyPostText(trimmed)])
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 shadow-sm sm:p-5">
      <p className="mb-1 text-sm font-semibold text-violet-800">Already have notes or a link? Paste it here ✨</p>
      <p className="mb-3 text-xs text-slate-500">
        We&rsquo;ll figure out which type of listing this is and take you straight there with your text ready to go.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="e.g. &ldquo;Selling my 1/3 share in our Cirrus SR22 based at KAUS&rdquo; or a link to your listing on another site"
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base sm:text-sm placeholder-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!text.trim() || pending}
        className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50 w-full sm:w-auto"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {pending ? 'Taking you there…' : 'Continue →'}
      </button>
    </div>
  )
}
