import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Refreshes the Supabase auth session on every matched request.
 *
 * **Why this exists:** Supabase access tokens are short-lived (1h by default).
 * Without this proxy, a token can expire mid-session even though the refresh
 * token is still valid — server-side reads in `getCurrentScout()` would then
 * see a signed-out user. This proxy calls `getClaims()` on every request,
 * which validates the JWT locally against the Supabase JWKS endpoint
 * (cached) and triggers a session refresh under the hood when the access
 * token is near expiry. The refreshed cookies are written onto the response
 * so subsequent server-side reads (Server Components, Server Actions, Route
 * Handlers) get the fresh token.
 *
 * **What it does NOT do:** This proxy does not enforce auth or redirect
 * unauthenticated users — that's the responsibility of individual pages
 * (e.g. `/scout/profile` will check `getCurrentScout()` and redirect to
 * `/scout/sign-in` if null). Phase 3 keeps the proxy single-purpose because
 * mixing route gating in here makes the auth contract harder to reason
 * about as the route tree grows.
 *
 * **Cost:** `getClaims()` validates the JWT locally using a cached copy of
 * the Supabase JWKS — microseconds, no network round-trip in steady state.
 * The JWKS endpoint is hit once per cold start (or on key rotation) and
 * cached afterwards. When no Supabase cookie is set (anonymous visitors,
 * Payload-only admin sessions) the call short-circuits without touching
 * JWKS at all. This is strictly better than `getUser()`, which would hit
 * the Auth API on every authenticated request.
 *
 * **CRITICAL:** Do not remove the `await supabase.auth.getClaims()` line —
 * that's the call that triggers the refresh when the access token is near
 * expiry. Per Supabase docs (https://supabase.com/docs/reference/javascript/auth-getclaims):
 * "If the user's access token is about to expire when calling this function,
 * the user's session will first be refreshed before validating the JWT."
 * Removing the call would cause silent token expiry mid-session.
 *
 * **Filename note:** Next 16 renamed the `middleware.ts` convention to
 * `proxy.ts` (export `proxy` instead of `middleware`) to clarify the
 * network-boundary semantics and decouple from Express-style middleware
 * connotations. `proxy.ts` runs on the Node.js runtime by default. The
 * old `middleware` convention is deprecated and will be removed in a
 * future Next version. See https://nextjs.org/docs/messages/middleware-to-proxy
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase env vars missing in proxy — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel for Production + Preview + Development (Workflow Gotcha #9).',
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Stage cookies on the inbound request so subsequent reads in this
        // proxy see them, then re-create the response with fresh cookies
        // so the BROWSER receives the refreshed session.
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

  // CRITICAL: triggers the session refresh when the access token is near
  // expiry. Local JWT validation via cached JWKS — no network round-trip
  // in steady state. Do not remove.
  await supabase.auth.getClaims();

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
     * (not Supabase) but proxy overhead is negligible when no Supabase
     * cookie is present — see the docblock on `cost`.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
