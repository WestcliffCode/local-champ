import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Refreshes the Supabase auth session on every matched request.
 *
 * **Why this exists:** Supabase access tokens are short-lived (1h by default).
 * Without middleware, a token can expire mid-session even though the refresh
 * token is still valid — server-side reads in `getCurrentScout()` would then
 * see a signed-out user. This middleware calls `getUser()` on every request,
 * which triggers an automatic refresh under the hood when the access token
 * is near expiry, and writes the refreshed cookies onto the response so
 * subsequent server-side reads (Server Components, Server Actions, Route
 * Handlers) get the fresh token.
 *
 * **What it does NOT do:** This middleware does not enforce auth or redirect
 * unauthenticated users — that's the responsibility of individual pages
 * (e.g. `/scout/profile` will check `getCurrentScout()` and redirect to
 * `/scout/sign-in` if null). Phase 3 keeps the middleware single-purpose
 * because mixing route gating in here makes the auth contract harder to
 * reason about as the route tree grows.
 *
 * **Cost:** When no Supabase cookie is set (e.g. anonymous visitors,
 * Payload-only admin sessions), `getUser()` returns immediately without a
 * network round-trip. So the per-request overhead for the common case is
 * cookie parsing only — a negligible amount of work. When a cookie IS set,
 * one Supabase call per token refresh window (~1h).
 *
 * **CRITICAL:** Do not remove the `await supabase.auth.getUser()` line —
 * that's the call that triggers the refresh. Removing it would cause
 * silent token expiry mid-session.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase env vars missing in middleware — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel for Production + Preview + Development (Workflow Gotcha #9).',
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Stage cookies on the inbound request so subsequent reads in this
        // middleware see them, then re-create the response with fresh
        // cookies so the BROWSER receives the refreshed session.
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // CRITICAL: triggers the session refresh. Do not remove.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - `_next/static`  — Next's static asset bundle
     *   - `_next/image`   — Next's image optimization API
     *   - `favicon.ico`   — browser tab icon
     *   - any path ending in a static-asset extension
     *
     * `/admin` and `/api/...` ARE matched. They use Payload's session
     * (not Supabase) but middleware overhead is negligible when no
     * Supabase cookie is present — see the docblock on `cost`.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
