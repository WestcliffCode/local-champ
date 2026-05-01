import { type NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@localchamp/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Magic-link callback handler.
 *
 * Supabase's `signInWithOtp` redirects the user (after they click the email
 * link) to this route with a `code` query param. We exchange that code for
 * a session, then provision a `scouts` row if this is the user's first time
 * signing in, and finally redirect to the profile page.
 *
 * **Flow:**
 *   1. Read `code` from the URL
 *   2. `supabase.auth.exchangeCodeForSession(code)` \u2014 sets the session
 *      cookies (via the cookie methods we configured in
 *      `lib/supabase/server.ts`)
 *   3. Read `data.user.id` and `data.user.email` from the exchange result
 *   4. INSERT scouts row with `ON CONFLICT DO NOTHING` (returning users
 *      already have a row from a prior visit \u2014 we don't want to clobber
 *      their `fullName` / `badgeStatus` / etc.)
 *   5. Redirect to `/scout/profile`
 *
 * **Open-redirect protection:** we don't honour any caller-supplied `next`
 * query param yet. All successful exchanges land on `/scout/profile`. When
 * we add deep-linking later (e.g. "redeem this coupon \u2192 sign in \u2192 back
 * to coupon"), the `next` param will need explicit allow-listing to avoid
 * redirecting to attacker-controlled URLs.
 *
 * **RLS bypass for the INSERT:** Drizzle connects via the pooler service
 * URI which bypasses RLS. That's intentional here \u2014 we just exchanged the
 * code and have a verified `auth.users.id`, and the scouts table's RLS
 * policy would allow this same user to insert their own row anyway. Going
 * through the pooler avoids initialising a per-request authed Postgres
 * connection just to defer to a policy that's already satisfied.
 *
 * **Error handling:** any failure (missing code, exchange error, missing
 * email on the user record) bounces back to `/scout/sign-in?error=...`
 * with a short reason code so the form can render an inline message.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(
      new URL('/scout/sign-in?error=missing_code', url),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user?.id || !data.user.email) {
    const reason = error?.message ?? 'auth_failed';
    return NextResponse.redirect(
      new URL(`/scout/sign-in?error=${encodeURIComponent(reason)}`, url),
    );
  }

  // Provision the scouts row on first sign-in. ON CONFLICT DO NOTHING is
  // keyed on `auth_user_id` (which is UNIQUE in the schema). Returning
  // users skip the INSERT and keep their existing row state intact.
  await db
    .insert(schema.scouts)
    .values({
      authUserId: data.user.id,
      email: data.user.email,
    })
    .onConflictDoNothing({ target: schema.scouts.authUserId });

  return NextResponse.redirect(new URL('/scout/profile', url));
}
