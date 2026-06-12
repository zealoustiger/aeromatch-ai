'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Plane, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function AuthForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/searches'
  const hasError = searchParams.get('error') === 'auth_failed'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setErrorMsg('')

    const supabase = createClient()
    const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl },
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="py-4 text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
        <h1 className="text-xl font-bold text-slate-900">Check your email</h1>
        <p className="mt-2 text-slate-500">
          We sent a magic link to <strong>{email}</strong>. Click the link to sign in — no password needed.
        </p>
        <p className="mt-4 text-sm text-slate-400">
          Didn't get it?{' '}
          <button
            onClick={() => setSent(false)}
            className="text-sky-600 underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Sign in to ClubHanger</h1>
      <p className="mt-2 text-slate-500">
        We'll email you a magic link — no password needed.
      </p>

      {hasError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Sign-in link expired or invalid. Please request a new one.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          {errorMsg && <p className="mt-1.5 text-xs text-red-600">{errorMsg}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-400">
        No account needed — your email is your account.
      </p>
    </>
  )
}

export default function AuthPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <Plane className="h-5 w-5 text-sky-600" strokeWidth={2.5} />
          <span className="font-bold text-slate-900">ClubHanger</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-100" />}>
            <AuthForm />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/partnerships" className="text-sky-600 hover:underline underline-offset-2">
            Browse without signing in
          </Link>
        </p>
      </div>
    </div>
  )
}
