import { db, eq, schema } from '@localchamp/db';
import { createSupabaseServerClient } from '../supabase/server';

/**
 * The shape returned by `getCurrentScout()`. Narrowed to the columns the
 * directory header and `/scout/profile` need today; expand as PR D2 + later
 * phases add fields to those surfaces.
 *
 * Derived from the Drizzle schema via `$inferSelect` so adding a column to
 * `scouts` (e.g. `phone`, `avatarUrl`) and adding it to this `Pick` is the
 * only change required — the underlying types stay in sync.
 */
type ScoutSelect = typeof schema.scouts.$inferSelect;
export type CurrentScout = Pick<
  ScoutSelect,
  'id' | 'authUserId' | 'email' | 'fullName' | 'badgeStatus'
>;

/**
 * Resolve the currently signed-in scout, if any.
 *
 * Returns `null` for:
 *   - anonymous visitors (no Supabase session)
 *   - signed-in Supabase users who don't yet have a `scouts` row (i.e. the
 *     user verified their magic link but the first-time profile-creation
 *     INSERT hasn't completed — that's PR D2's responsibility on the
 *     `/scout/auth/callback` route)
 *
 * Callers that require a guaranteed scout (`/scout/profile`, future
 * redemption-tracking pages) MUST handle the null case explicitly — typically
 * `redirect('/scout/sign-in')`.
 *
 * **Why getClaims() and not getUser():** `getClaims()` validates the JWT
 * locally against Supabase's JWKS (cached client-side after the first hit)
 * and returns the decoded claims. The common case is zero network
 * round-trips. `getUser()` always hits the Auth server. We only need
 * `claims.sub` (the `auth.uid()`) to look up the scouts row, so the
 * local-validation path is strictly better for performance with identical
 * security properties — both return only after the JWT signature is
 * verified.
 *
 * Per Supabase docs (https://supabase.com/docs/reference/javascript/auth-getclaims):
 * if the access token is near expiry when this is called, the session
 * is refreshed before validation. Same refresh semantics as `getUser()`,
 * just without the unnecessary user-lookup round-trip.
 *
 * **Where the read goes:** through Drizzle, which connects via the Supabase
 * pooler service URI and bypasses RLS. That's intentional for this helper:
 *   1. The JWT was already validated by the prior `getClaims()` call
 *   2. The lookup is by the user's own `auth.uid()` — there's no cross-tenant
 *      risk
 *   3. Initialising a per-request authed Postgres connection just to defer
 *      to the same RLS policy this lookup already satisfies would add latency
 *      with zero security benefit
 *
 * If a future caller needs a Supabase-RLS-protected read (e.g. listing OTHER
 * scouts under a public-leaderboard policy), reach for the Supabase client
 * directly via `createSupabaseServerClient()` rather than extending this helper.
 */
export async function getCurrentScout(): Promise<CurrentScout | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  // No session, JWT validation failure, or missing `sub` claim — all map
  // to "no signed-in scout" from the caller's perspective.
  if (error || !data?.claims?.sub) return null;

  const authUserId = data.claims.sub;

  const [row] = await db
    .select({
      id: schema.scouts.id,
      authUserId: schema.scouts.authUserId,
      email: schema.scouts.email,
      fullName: schema.scouts.fullName,
      badgeStatus: schema.scouts.badgeStatus,
    })
    .from(schema.scouts)
    .where(eq(schema.scouts.authUserId, authUserId))
    .limit(1);

  return row ?? null;
}
