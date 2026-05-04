'use server';

import { and, db, eq, schema } from '@localchamp/db';
import { getCurrentMerchant } from '@/lib/auth/merchant';
import {
  recomputeBusinessCps,
  recomputeScoutBadge,
} from '@/lib/scoring-hooks';
import { after } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Merchant-side redemption confirmation server action.
 *
 * Called from the `/merchant/redemptions` page when a merchant clicks
 * "Confirm" on a pending redemption. Guards:
 *   1. Merchant must be authenticated with a claimed business
 *   2. Redemption must exist and be `pending`
 *   3. Coupon must belong to the merchant's business
 *   4. Redemption must not have expired (`expiresAt > now()`)
 *
 * After completing the redemption:
 *   - Recomputes the scout's badge via shared `recomputeScoutBadge` helper
 *   - Schedules CPS recomputation via `after()` for serverless reliability
 */
export async function confirmRedemption(
  redemptionId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentMerchant();
  if (!user || !user.business) {
    return { success: false, error: 'Not authenticated or no business claimed' };
  }

  const businessId =
    typeof user.business === 'string' ? user.business : user.business.id;

  const { redemptions, coupons } = schema;

  // ── Fetch the redemption ──────────────────────────────────────────────────
  const [redemption] = await db
    .select({
      id: redemptions.id,
      scoutId: redemptions.scoutId,
      couponId: redemptions.couponId,
      status: redemptions.status,
      expiresAt: redemptions.expiresAt,
    })
    .from(redemptions)
    .where(eq(redemptions.id, redemptionId))
    .limit(1);

  if (!redemption) {
    return { success: false, error: 'Redemption not found' };
  }

  if (redemption.status !== 'pending') {
    return { success: false, error: 'Redemption is not pending' };
  }

  // ── Verify the coupon belongs to this merchant's business ─────────────────
  const [coupon] = await db
    .select({ id: coupons.id, businessId: coupons.businessId })
    .from(coupons)
    .where(eq(coupons.id, redemption.couponId))
    .limit(1);

  if (!coupon || coupon.businessId !== businessId) {
    return { success: false, error: 'Not authorized — coupon does not belong to your business' };
  }

  // ── Check expiry ──────────────────────────────────────────────────────────
  if (redemption.expiresAt && new Date() > new Date(redemption.expiresAt)) {
    return { success: false, error: 'Redemption has expired' };
  }

  // ── Mark as completed ─────────────────────────────────────────────────────
  const [updated] = await db
    .update(redemptions)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(
      and(
        eq(redemptions.id, redemptionId),
        eq(redemptions.status, 'pending'),
      ),
    )
    .returning({ id: redemptions.id });

  if (!updated) {
    return { success: false, error: 'Redemption was already completed or no longer exists.' };
  }

  // ── Badge cascade + CPS recompute ─────────────────────────────────────────
  // Badge recompute is awaited inline (scout might refresh profile immediately).
  // CPS recompute fires via after() for serverless reliability.
  await recomputeScoutBadge(redemption.scoutId);
  after(() => recomputeBusinessCps(businessId));

  revalidatePath('/merchant/redemptions');

  return { success: true };
}
