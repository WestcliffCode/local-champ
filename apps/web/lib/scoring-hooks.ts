/**
 * Side-effectful scoring hooks for LocalChamp.
 *
 * These functions query the database for activity counts, call the pure
 * scoring functions from `@localchamp/logic`, and write the results back
 * to the `businesses` table via Payload's Local API (which bypasses
 * field-level access restrictions on `cps_score` and `local_loop_score`).
 *
 * Designed to be called from server actions (e.g. `confirmRedemption`,
 * `submitReview`, `verifySourcingEdge`) — NOT from Payload `afterChange`
 * hooks on Businesses (that would cause infinite loops since `payload.update`
 * triggers `afterChange`).
 */

import { and, db, eq, or, schema, sql } from '@localchamp/db';
import { computeCpsScore, computeLocalLoopScore } from '@localchamp/logic';
import config from '@payload-config';
import { getPayload } from 'payload';

/* ---------------------------------------------------------------------------
 * CPS (Community Participation Score)
 * ------------------------------------------------------------------------ */

/**
 * Recompute `businesses.cps_score` for a given business.
 *
 * Queries (run in parallel via Promise.all):
 *   1. Completed redemptions (via coupons → redemptions join)
 *   2. Reviews for this business
 *   3. Verified sourcing edges (buyer or seller)
 *
 * Then writes the computed CPS back via Payload Local API.
 * The Payload `afterChange` hook on Businesses handles ISR cache
 * invalidation automatically — no manual `revalidateTag` needed.
 *
 * Errors are swallowed and logged — a scoring failure should never
 * break the primary action (e.g. redemption confirmation).
 */
export async function recomputeBusinessCps(
  businessId: string,
): Promise<void> {
  try {
    const { redemptions, coupons, reviews, sourcing } = schema;

    // Run all three independent count queries in parallel
    const [
      [redemptionResult],
      [reviewResult],
      [sourcingResult],
    ] = await Promise.all([
      // ── Completed redemptions for coupons belonging to this business ──────
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(redemptions)
        .innerJoin(coupons, eq(redemptions.couponId, coupons.id))
        .where(
          and(
            eq(coupons.businessId, businessId),
            eq(redemptions.status, 'completed'),
          ),
        ),
      // ── Reviews for this business ──────────────────────────────────────────
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(reviews)
        .where(eq(reviews.businessId, businessId)),
      // ── Verified sourcing edges (buyer or seller) ──────────────────────────
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(sourcing)
        .where(
          and(
            eq(sourcing.verified, true),
            or(
              eq(sourcing.buyerId, businessId),
              eq(sourcing.sellerId, businessId),
            ),
          ),
        ),
    ]);

    const cpsScore = computeCpsScore({
      redemptionCount: redemptionResult?.count ?? 0,
      reviewCount: reviewResult?.count ?? 0,
      verifiedSourcingCount: sourcingResult?.count ?? 0,
    });

    // Write via Payload Local API — bypasses field-level access on cps_score.
    // depth: 0 skips relation population since we discard the returned doc.
    // This also triggers `revalidateBusinessTags` via the Businesses afterChange
    // hook, invalidating ISR caches for affected directory pages.
    const payload = await getPayload({ config });
    await payload.update({
      collection: 'businesses',
      id: businessId,
      data: { cps_score: cpsScore },
      depth: 0,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[recomputeBusinessCps] Failed for business ${businessId}`,
      err,
    );
  }
}

/* ---------------------------------------------------------------------------
 * Local Loop Score
 * ------------------------------------------------------------------------ */

/**
 * Recompute `businesses.local_loop_score` for a given business.
 *
 * Counts verified sourcing edges where the business is buyer OR seller,
 * then applies the +10 modifier per edge (via `computeLocalLoopScore`).
 *
 * Written to `businesses.local_loop_score` via Payload Local API.
 * ISR cache invalidation fires automatically via the Businesses afterChange
 * hook — no manual revalidation needed.
 *
 * Errors are swallowed and logged — scoring failure should never
 * break the primary action.
 */
export async function recomputeLocalLoopScore(
  businessId: string,
): Promise<void> {
  try {
    const { sourcing } = schema;

    const [result] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(sourcing)
      .where(
        and(
          eq(sourcing.verified, true),
          or(
            eq(sourcing.buyerId, businessId),
            eq(sourcing.sellerId, businessId),
          ),
        ),
      );

    const localLoopScore = computeLocalLoopScore(result?.count ?? 0);

    const payload = await getPayload({ config });
    await payload.update({
      collection: 'businesses',
      id: businessId,
      data: { local_loop_score: localLoopScore },
      depth: 0,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[recomputeLocalLoopScore] Failed for business ${businessId}`,
      err,
    );
  }
}
