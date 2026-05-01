import { cookies } from 'next/headers';
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { requireEnv } from '../env';

/**
 * Server-side Supabase client.
 *
 * Reads/writes the Supabase auth session cookie via Next's `cookies()` API.
 * Use this in Server Components, Server Actions, and Route Handlers — anywhere
 * you need to know whether a scout is signed in or call Supabase APIs as the
 * current user.
 *
 * Each call returns a fresh client bound to the *current request's* cookie
 * store, so this is safe to call from any server context — there's no shared
 * mutable state between requests.
 *
 * Pairs with `apps/web/proxy.ts`, which refreshes the session token on
 * every request so the cookies this client reads are always current.
 *
 * Fail-fast on missing env vars (mirrors the pattern in `payload.config.ts` —
 * Architectural Decision #6) so misconfigured deploys surface the issue at
 * module load instead of silently authing every request as anonymous. Done
 * via `requireEnv()` so the resulting consts are typed `string` (not
 * `string | undefined`), which TypeScript narrows correctly across the
 * closure boundary into `createSupabaseServerClient()`.
 *
 * **`setAll` parameter annotation:** `@supabase/ssr` types the `cookies`
 * option as a union (`CookieMethodsServer | CookieMethodsServerDeprecated`).
 * Under `strict` + `noImplicitAny`, TypeScript can't pick a variant from
 * an inline object literal, so `setAll`'s `cookiesToSet` parameter falls
 * through as implicit `any` and the build fails. Annotating the parameter
 * with the explicit shape disambiguates the variant.
 */
const SUPABASE_URL = requireEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  'Set it in Vercel env for Production + Preview + Development (Workflow Gotcha #9).',
);
const SUPABASE_ANON_KEY = requireEnv(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'Set it in Vercel env for Production + Preview + Development (Workflow Gotcha #9).',
);

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // `setAll` is allowed to fail when called from a Server Component
          // (you can only set cookies inside Server Actions, Route Handlers,
          // and middleware/proxy). Swallowing here is safe because proxy.ts
          // is the canonical writer of refreshed session cookies — if we're
          // in a Server Component, a refresh either already happened in
          // proxy.ts or will happen on the next request.
        }
      },
    },
  });
}
