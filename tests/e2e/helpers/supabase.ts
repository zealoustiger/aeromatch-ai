import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { readFileSync } from 'node:fs'
import { SUPABASE_URL, SUPABASE_ANON, SUPABASE_SERVICE, BASE_URL, TEST_EMAIL_DOMAIN, TEST_EMAIL_PREFIX, AUTH_DIR } from './env'

// A test user's email is unmistakable: starts with `smoke-`, ends with our domain.
// Both conditions must hold before the sweep will ever delete a user.
const isTestEmail = (email: string) =>
  email.toLowerCase().startsWith(TEST_EMAIL_PREFIX) && email.toLowerCase().endsWith('@' + TEST_EMAIL_DOMAIN)

// Service-role client — used ONLY by the test harness to verify rows and to
// hard-delete test artifacts. Never shipped to the app.
export const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// The app is passwordless, but a test user can carry a password (set via the
// admin API) so we can mint a real session deterministically — no inbox needed.
const TEST_PASSWORD = 'Smoke!Test-Pw-9173xQ'

export const LISTING_TABLES = ['partnerships', 'partnership_seekers', 'aircraft_for_sale'] as const

type PWCookie = {
  name: string; value: string; domain: string; path: string
  httpOnly: boolean; secure: boolean; sameSite: 'Lax' | 'Strict' | 'None'; expires: number
}

// ── run/user state shared between global-setup, auth.setup, and specs ──────────
export function runId(): string {
  return JSON.parse(readFileSync(`${AUTH_DIR}/run.json`, 'utf8')).runId
}
export function testUser(): { email: string; id: string } {
  return JSON.parse(readFileSync(`${AUTH_DIR}/user.json`, 'utf8'))
}

// ── users ─────────────────────────────────────────────────────────────────────
export async function findUserByEmail(email: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  const u = data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
  return u?.id ?? null
}

export async function ensureTestUser(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email, password: TEST_PASSWORD, email_confirm: true, user_metadata: { smoke: true },
  })
  if (data?.user?.id) return data.user.id
  if (error && /already|registered|exists/i.test(error.message)) {
    const id = await findUserByEmail(email)
    if (id) return id
  }
  throw error ?? new Error('ensureTestUser failed')
}

export async function deleteUserByEmail(email: string): Promise<void> {
  const id = await findUserByEmail(email)
  if (id) await admin.auth.admin.deleteUser(id)
}

// Sign in as the test user and capture the @supabase/ssr auth cookies (using the
// library itself, so the chunking/format exactly matches what the production
// server expects), mapped to Playwright's cookie shape for the prod host.
export async function sessionCookies(email: string): Promise<PWCookie[]> {
  const captured: { name: string; value: string }[] = []
  const supa = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll: () => [],
      setAll: (cs) => { for (const c of cs) captured.push({ name: c.name, value: c.value }) },
    },
  })
  const { error } = await supa.auth.signInWithPassword({ email, password: TEST_PASSWORD })
  if (error) throw error
  if (!captured.length) throw new Error('no auth cookies captured from sign-in')
  const host = new URL(BASE_URL).hostname
  const secure = BASE_URL.startsWith('https')
  return captured.map((c) => ({
    name: c.name, value: c.value, domain: host, path: '/',
    httpOnly: false, secure, sameSite: 'Lax', expires: -1,
  }))
}

// ── cleanup ───────────────────────────────────────────────────────────────────
export async function deleteListingsByPoster(posterId: string): Promise<void> {
  for (const t of LISTING_TABLES) await admin.from(t).delete().eq('poster_id', posterId)
}

// Sweep any rows/users left by a crashed run (marked title or test email domain).
// Idempotent — safe to run on startup and teardown.
export async function sweepLeftovers(): Promise<{ rows: number; users: number }> {
  let rows = 0
  for (const t of LISTING_TABLES) {
    const { data } = await admin.from(t).delete().like('title', '[SMOKE %]').select('id')
    rows += data?.length ?? 0
  }
  let users = 0
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  for (const u of data?.users ?? []) {
    if (isTestEmail(u.email || '')) {
      await admin.auth.admin.deleteUser(u.id)
      users++
    }
  }
  return { rows, users }
}
