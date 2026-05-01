import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client (singleton per tab).
 *
 * Use this in Client Components for any Supabase operation that runs after
 * hydration — submitting an OTP form, listening to `onAuthStateChange`,
 * triggering `signInWithOtp`, etc. Server-side reads should use
 * `createSupabaseServerClient` from `./server` instead.
 *
 * Memoized at module scope: the first call constructs the client, subsequent
 * calls return the same instance. Safe because a browser tab represents one
 * user's session — there's no per-component state we need to isolate.
 *
 * `NEXT_PUBLIC_*` env vars are inlined into the client bundle at build time.
 * If they're missing, the build still produces a bundle but `createBrowserClient`
 * throws at runtime — mirrors the server-side fail-fast.
 */
let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (cachedClient) return cachedClient;
  cachedClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return cachedClient;
}
