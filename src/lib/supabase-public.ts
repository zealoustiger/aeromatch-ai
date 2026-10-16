import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cookie-free, anon-key Supabase client for PUBLIC reads on the server.
 *
 * Why this exists: `createServerSupabaseClient()` calls `cookies()` so it can
 * carry the viewer's session. That is a request-time API, and Next marks any
 * route whose render tree touches one as dynamic — so a page that only lists
 * public aircraft/partnerships still re-renders on every single request and
 * can never be served from the CDN cache. In Oct 2026 that is what let search
 * crawlers (Baiduspider-render and friends) walk ~4k listing pages as full SSR
 * renders and exhaust the Vercel Hobby Active-CPU quota, taking the site down.
 *
 * Reads through this client are RLS-equivalent to a logged-out visitor. Every
 * table the public query libs touch has a SELECT policy that does not consult
 * `auth.uid()` (`status = 'active'` on aircraft_for_sale / partnerships /
 * partnership_seekers, `true` on airports — see supabase/schema.sql), so the
 * cookie client and this one return byte-identical rows for those queries.
 *
 * Do NOT use it for anything per-viewer (saved_listings, owner checks,
 * profiles, reviews) — those must stay on `createServerSupabaseClient()`.
 *
 * `async` only so it is a drop-in for `await createServerSupabaseClient()`.
 * One client per lambda instance; supabase-js clients are stateless here.
 * Same construction as the build-time anon client in `seo.ts`.
 */
let _client: SupabaseClient | null = null

export async function createPublicSupabaseClient(): Promise<SupabaseClient> {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return _client
}
