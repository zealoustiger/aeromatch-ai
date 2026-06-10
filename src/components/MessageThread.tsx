'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { sendMessage } from '@/app/actions'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

interface Props {
  threadId: string
  currentUserId: string
  initialMessages: Message[]
}

export default function MessageThread({ threadId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages((prev) => {
            // Deduplicate in case optimistic update already added it
            const incoming = payload.new as Message
            if (prev.some((m) => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length <= initialMessages.length ? 'instant' : 'smooth' })
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setBody('')

    // Optimistic message
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      created_at: new Date().toISOString(),
      thread_id: threadId,
      sender_id: currentUserId,
      body: text,
    }
    setMessages((prev) => [...prev, optimistic])

    startTransition(async () => {
      await sendMessage(threadId, text)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId
          return (
            <div key={m.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  isMe
                    ? 'rounded-br-sm bg-sky-600 text-white'
                    : 'rounded-bl-sm bg-slate-100 text-slate-800'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn('mt-1 text-right text-[10px]', isMe ? 'text-sky-200' : 'text-slate-400')}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-slate-200 bg-white px-4 py-3"
      >
        <textarea
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          style={{ maxHeight: '120px', overflowY: 'auto' }}
        />
        <button
          type="submit"
          disabled={!body.trim() || isPending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
