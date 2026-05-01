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
 * **Where the read goes:** through Drizzle, which connects via the Supabase
 * pooler service URI and bypasses RLS. That's intentional for this helper:
 *   1. We're already authenticated by the prior `supabase.auth.getUser()` call
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [row] = await db
    .select({
      id: schema.scouts.id,
      authUserId: schema.scouts.authUserId,
      email: schema.scouts.email,
      fullName: schema.scouts.fullName,
      badgeStatus: schema.scouts.badgeStatus,
    })
    .from(schema.scouts)
    .where(eq(schema.scouts.authUserId, user.id))
    .limit(1);

  return row ?? null;
}
