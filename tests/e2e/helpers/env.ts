import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Playwright doesn't load .env.local — do it here so every helper/spec can read
// the Supabase keys. Existing process.env wins (lets CI inject overrides).
try {
  const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!(m[1] in process.env)) process.env[m[1]] = v
  }
} catch {
  /* env may be provided by the shell / CI */
}

function need(k: string): string {
  const v = process.env[k]
  if (!v) throw new Error(`Missing required env ${k} — set it in .env.local`)
  return v
}

// Target the production site by default; override with SMOKE_BASE_URL for previews/local.
export const BASE_URL = process.env.SMOKE_BASE_URL || 'https://clubhanger.com'
export const SUPABASE_URL = need('NEXT_PUBLIC_SUPABASE_URL')
export const SUPABASE_ANON = need('NEXT_PUBLIC_SUPABASE_ANON_KEY')
export const SUPABASE_SERVICE = need('SUPABASE_SERVICE_ROLE_KEY')

// Every test artifact is tagged so verification + cleanup are precise, and a
// crashed run can be swept on the next start. Supabase rejects reserved TLDs
// (.test/.example), so use our own real domain with a reserved `smoke-` local
// prefix — undeliverable mailboxes just bounce silently, and the prefix lets the
// sweep target ONLY test users, never a real account.
export const TEST_EMAIL_PREFIX = 'smoke-'
export const TEST_EMAIL_DOMAIN = 'clubhanger.com'
export const MARKER = (runId: string) => `[SMOKE ${runId}]`
export const AUTH_DIR = join(process.cwd(), 'tests/e2e/.auth')
