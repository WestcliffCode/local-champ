'use server';

import { and, db, eq, schema } from '@localchamp/db';
import { getCurrentScout } from '@/lib/auth/scout';

/**
 * Self-serve completion server action.
 *
 * Called by the countdown client component when the timer reaches zero
 * and the coupon does NOT require merchant confirmation.
 *
 * Guards:
 *   1. Scout must be authenticated
 *   2. Scout must own the redemption
 *   3. Coupon's `require_confirmation` must be false (self-serve mode)
 *   4. Redemption must still be in `pending` status
 *   5. Redemption must not have expired
 */
export async function completeRedemption(
  redemptionId: string,
): Promise<{ success: boolean; error?: string }> {
  const scout = await getCurrentScout();
  if (!scout) {
    return { success: false, error: 'Not authenticated' };
  }

  const { redemptions, coupons } = schema;

  // ── Fetch the redemption and verify ownership ─────────────────────────────
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

  if (redemption.scoutId !== scout.id) {
    return { success: false, error: 'Not authorized' };
  }

  if (redemption.status !== 'pending') {
    return { success: false, error: 'Redemption is not pending' };
  }

  if (redemption.expiresAt && new Date() > new Date(redemption.expiresAt)) {
    return { success: false, error: 'Redemption has expired' };
  }

  // ── Check coupon's require_confirmation flag ───────────────────────────────
  const [coupon] = await db
    .select({ requireConfirmation: coupons.requireConfirmation })
    .from(coupons)
    .where(eq(coupons.id, redemption.couponId))
    .limit(1);

  if (coupon?.requireConfirmation) {
    return {
      success: false,
      error: 'This coupon requires merchant confirmation',
    };
  }

  // ── Mark as completed ──────────────────────────────────────────────────────
  await db
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
    );

  return { success: true };
}
