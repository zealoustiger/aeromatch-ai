import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MapPin } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { aircraftLabel } from '@/lib/utils'
import MessageThread from '@/components/MessageThread'
import type { Message } from '@/lib/types'

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>
}) {
  const { threadId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/auth?next=/messages/${threadId}`)

  const { data: thread } = await supabase
    .from('threads')
    .select(`
      id, inquirer_id, owner_id,
      partnership:partnerships(id, title, make, model, year, home_airport, city, state)
    `)
    .eq('id', threadId)
    .single()

  if (!thread) notFound()

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  const p = thread.partnership as unknown as {
    id: string; title: string; make: string; model: string
    year: number | null; home_airport: string; city: string | null; state: string | null
  } | null

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-0 sm:px-4 sm:py-6">
      <div className="flex flex-col rounded-none sm:rounded-xl border-0 sm:border border-slate-200 bg-white shadow-none sm:shadow-sm overflow-hidden flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <Link
            href="/messages"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          {p ? (
            <Link href={`/partnerships/${p.id}`} className="min-w-0 flex-1 hover:opacity-80">
              <p className="truncate font-semibold text-slate-900">{p.title}</p>
              <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                <MapPin className="h-3 w-3 shrink-0" />
                {aircraftLabel(p.make, p.model, p.year)}
                {p.home_airport && ` · ${p.home_airport}`}
                {p.city && `, ${p.city} ${p.state}`}
              </p>
            </Link>
          ) : (
            <p className="text-sm font-medium text-slate-500">Deleted listing</p>
          )}
        </div>

        {/* Messages + compose */}
        <MessageThread
          threadId={threadId}
          currentUserId={user.id}
          initialMessages={(initialMessages ?? []) as Message[]}
        />
      </div>
    </div>
  )
}
