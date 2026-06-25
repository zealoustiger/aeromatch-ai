import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, ChevronRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { aircraftLabel } from '@/lib/utils'
import type { Message } from '@/lib/types'

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth?next=/messages')

  // RLS returns only threads where user is inquirer or owner
  const { data: threads } = await supabase
    .from('threads')
    .select(`
      id, created_at, inquirer_id, owner_id,
      partnership:partnerships(id, title, make, model, year, home_airport),
      seeker:partnership_seekers(id, title),
      messages(id, body, created_at, sender_id)
    `)
    .order('created_at', { ascending: false })

  // Sort threads by most-recent message
  const sorted = (threads ?? []).sort((a, b) => {
    const aLast = a.messages?.at(-1)?.created_at ?? a.created_at
    const bLast = b.messages?.at(-1)?.created_at ?? b.created_at
    return new Date(bLast).getTime() - new Date(aLast).getTime()
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-slate-900">
        <MessageCircle className="h-6 w-6 text-sky-600" />
        Messages
      </h1>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-600">No conversations yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Find a listing and tap{' '}
            <strong className="text-slate-600">Message</strong> to start one.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
          {sorted.map((thread) => {
            const p = thread.partnership as unknown as { id: string; title: string; make: string; model: string; year: number | null; home_airport: string } | null
            const sk = thread.seeker as unknown as { id: string; title: string } | null
            const msgs = (thread.messages ?? []) as Message[]
            const last = msgs.at(-1)

            const threadTitle = p?.title ?? sk?.title ?? 'Deleted listing'
            const threadSub = p
              ? `${aircraftLabel(p.make, p.model, p.year)} · ${p.home_airport}`
              : sk
              ? 'Pilot seeking partnership'
              : (thread.owner_id === user.id ? 'Inquiry about your listing' : 'Your inquiry')

            return (
              <Link
                key={thread.id}
                href={`/messages/${thread.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
                  <MessageCircle className="h-5 w-5 text-sky-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{threadTitle}</p>
                  <p className="truncate text-xs text-slate-500">{threadSub}</p>
                  {last && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {last.sender_id === user.id ? 'You: ' : ''}
                      {last.body}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {last && (
                    <p className="text-xs text-slate-400">
                      {new Date(last.created_at).toLocaleDateString()}
                    </p>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
