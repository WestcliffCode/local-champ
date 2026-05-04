'use server';

import { and, db, eq, schema } from '@localchamp/db';
import { getCurrentMerchant } from '@/lib/auth/merchant';
import {
  recomputeBusinessCps,
  recomputeLocalLoopScore,
} from '@/lib/scoring-hooks';
import { after } from 'next/server';

/**
 * Verify a sourcing edge (admin-only server action).
 *
 * Sets `sourcing.verified = true` and `sourcing.verified_at = now()`,
 * then triggers score recomputation for BOTH the buyer and seller:
 *   - Local Loop score (verified sourcing count changed)
 *   - CPS (verified sourcing count is a CPS input)
 *
 * Guards:
 *   1. Caller must be authenticated as an admin (Payload auth)
 *   2. Sourcing edge must exist
 *   3. Sourcing edge must not already be verified (idempotent guard)
 *
 * Score recomputation is scheduled via `after()` to complete reliably
 * in serverless environments without blocking the response.
 */
export async function verifySourcingEdge(
  sourcingId: string,
): Promise<{ success: boolean; error?: string }> {
  // ── Auth: admin-only ──────────────────────────────────────────────────────
  const user = await getCurrentMerchant();
  if (!user || (user as { role?: string }).role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  const { sourcing } = schema;

  // ── Fetch the sourcing edge ───────────────────────────────────────────────
  const [edge] = await db
    .select({
      id: sourcing.id,
      buyerId: sourcing.buyerId,
      sellerId: sourcing.sellerId,
      verified: sourcing.verified,
    })
    .from(sourcing)
    .where(eq(sourcing.id, sourcingId))
    .limit(1);

  if (!edge) {
    return { success: false, error: 'Sourcing edge not found' };
  }

  if (edge.verified) {
    return { success: false, error: 'Sourcing edge is already verified' };
  }

  // ── Mark as verified ──────────────────────────────────────────────────────
  const [updated] = await db
    .update(sourcing)
    .set({
      verified: true,
      verifiedAt: new Date(),
    })
    .where(
      and(
        eq(sourcing.id, sourcingId),
        eq(sourcing.verified, false),
      ),
    )
    .returning({ id: sourcing.id });

  if (!updated) {
    return { success: false, error: 'Sourcing edge was already verified or no longer exists.' };
  }

  // ── Recompute scores for BOTH businesses ──────────────────────────────────
  // Both buyer and seller receive the Local Loop bump (PRD §6C).
  // CPS also changes because verified sourcing count is a CPS input.
  // Scheduled via after() to complete reliably in serverless.
  after(async () => {
    await Promise.all([
      recomputeLocalLoopScore(edge.buyerId),
      recomputeLocalLoopScore(edge.sellerId),
      recomputeBusinessCps(edge.buyerId),
      recomputeBusinessCps(edge.sellerId),
    ]);
  });

  return { success: true };
}

/**
 * Unverify a sourcing edge (admin-only server action).
 *
 * Reverses a previous verification: sets `verified = false` and clears
 * `verified_at`. Triggers score recomputation for both businesses.
 *
 * Use case: admin corrects a mistaken verification.
 */
export async function unverifySourcingEdge(
  sourcingId: string,
): Promise<{ success: boolean; error?: string }> {
  // ── Auth: admin-only ──────────────────────────────────────────────────────
  const user = await getCurrentMerchant();
  if (!user || (user as { role?: string }).role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  const { sourcing } = schema;

  // ── Fetch the sourcing edge ───────────────────────────────────────────────
  const [edge] = await db
    .select({
      id: sourcing.id,
      buyerId: sourcing.buyerId,
      sellerId: sourcing.sellerId,
      verified: sourcing.verified,
    })
    .from(sourcing)
    .where(eq(sourcing.id, sourcingId))
    .limit(1);

  if (!edge) {
    return { success: false, error: 'Sourcing edge not found' };
  }

  if (!edge.verified) {
    return { success: false, error: 'Sourcing edge is not verified' };
  }

  // ── Mark as unverified ────────────────────────────────────────────────────
  const [updated] = await db
    .update(sourcing)
    .set({
      verified: false,
      verifiedAt: null,
    })
    .where(
      and(
        eq(sourcing.id, sourcingId),
        eq(sourcing.verified, true),
      ),
    )
    .returning({ id: sourcing.id });

  if (!updated) {
    return { success: false, error: 'Sourcing edge was already unverified or no longer exists.' };
  }

  // ── Recompute scores for BOTH businesses ──────────────────────────────────
  after(async () => {
    await Promise.all([
      recomputeLocalLoopScore(edge.buyerId),
      recomputeLocalLoopScore(edge.sellerId),
      recomputeBusinessCps(edge.buyerId),
      recomputeBusinessCps(edge.sellerId),
    ]);
  });

  return { success: true };
}
