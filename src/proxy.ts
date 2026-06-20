import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/partnerships/new', '/partnerships/seeking/new', '/searches', '/messages']

function isProtected(path: string) {
  return PROTECTED_PATHS.some((p) => path.startsWith(p))
}

function redirectToAuth(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/auth'
  url.searchParams.set('next', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Defensive: if Supabase isn't configured for this deployment (e.g. env vars
  // missing on a preview/staging environment), don't let the auth client throw
  // and 500 *every* route. Keep public pages working, but still fail SAFE —
  // send protected paths to /auth rather than exposing them.
  if (!supabaseUrl || !supabaseAnonKey) {
    return isProtected(request.nextUrl.pathname)
      ? redirectToAuth(request)
      : NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session — must be called on every request for SSR auth to work.
  // Wrapped so a transient auth/network error degrades gracefully (treat as
  // logged-out) instead of 500ing the whole site.
  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    user = null
  }

  if (!user && isProtected(request.nextUrl.pathname)) {
    return redirectToAuth(request)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
