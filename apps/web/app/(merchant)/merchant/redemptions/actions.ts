'use server';

import { and, db, eq, schema, sql } from '@localchamp/db';
import { computeScoutBadge } from '@localchamp/logic';
import { getCurrentMerchant } from '@/lib/auth/merchant';
import { recomputeBusinessCps } from '@/lib/scoring-hooks';
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
 * After completing the redemption, recomputes the scout's badge status
 * using `computeScoutBadge` from `@localchamp/logic` and updates
 * `scouts.badge_status` if the tier changed (badge cascade).
 *
 * Also triggers CPS recomputation for the merchant's business since
 * the completed redemption count has changed.
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

  const { redemptions, coupons, scouts, reviews } = schema;

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

  // ── Badge cascade: recompute the scout's badge ────────────────────────────
  const [completedCount] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(redemptions)
    .where(
      and(
        eq(redemptions.scoutId, redemption.scoutId),
        eq(redemptions.status, 'completed'),
      ),
    );

  const [reviewCount] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(reviews)
    .where(eq(reviews.scoutId, redemption.scoutId));

  const newBadge = computeScoutBadge({
    completedRedemptions: completedCount?.count ?? 0,
    reviewsSubmitted: reviewCount?.count ?? 0,
  });

  // Only update if badge changed — avoids unnecessary writes + updated_at bumps
  const [currentScout] = await db
    .select({ badgeStatus: scouts.badgeStatus })
    .from(scouts)
    .where(eq(scouts.id, redemption.scoutId))
    .limit(1);

  if (currentScout && currentScout.badgeStatus !== newBadge) {
    await db
      .update(scouts)
      .set({ badgeStatus: newBadge, updatedAt: new Date() })
      .where(eq(scouts.id, redemption.scoutId));
  }

  // ── CPS recompute: redemption count changed for this business ─────────────
  // Fire-and-forget — scoring failure should not break the redemption flow.
  // recomputeBusinessCps already swallows errors internally.
  void recomputeBusinessCps(businessId);

  revalidatePath('/merchant/redemptions');

  return { success: true };
}
