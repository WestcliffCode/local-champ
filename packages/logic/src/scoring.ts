/**
 * Scoring logic for LocalChamp.
 *
 * Three independent score families — all pure functions so they can be reused
 * server-side (Drizzle/Payload hooks) and client-side (preview UI):
 *   1. cps_score        — per business; derived from community activity blocks
 *   2. local_loop_score — per business; +10 modifier per verified sourcing edge
 *   3. badge_status     — per scout; gamified tier from redemption + review thresholds
 */

import type { ScoutBadge } from '@localchamp/types';

export type { ScoutBadge };

/* -----------------------------------------------------------------------------
 * Scout Badge
 * --------------------------------------------------------------------------- */

export interface ScoutStats {
  completedRedemptions: number;
  reviewsSubmitted: number;
}

/**
 * Initial Scout Badge thresholds. Review with product before launch.
 * Gold and silver require BOTH redemptions AND reviews; bronze is redemption-only.
 */
export const BADGE_THRESHOLDS = {
  bronze: { completedRedemptions: 5, reviewsSubmitted: 0 },
  silver: { completedRedemptions: 15, reviewsSubmitted: 3 },
  gold: { completedRedemptions: 30, reviewsSubmitted: 10 },
} as const satisfies Record<Exclude<ScoutBadge, 'none'>, ScoutStats>;

export function computeScoutBadge(stats: ScoutStats): ScoutBadge {
  const { completedRedemptions, reviewsSubmitted } = stats;

  if (
    completedRedemptions >= BADGE_THRESHOLDS.gold.completedRedemptions &&
    reviewsSubmitted >= BADGE_THRESHOLDS.gold.reviewsSubmitted
  ) {
    return 'gold';
  }
  if (
    completedRedemptions >= BADGE_THRESHOLDS.silver.completedRedemptions &&
    reviewsSubmitted >= BADGE_THRESHOLDS.silver.reviewsSubmitted
  ) {
    return 'silver';
  }
  if (completedRedemptions >= BADGE_THRESHOLDS.bronze.completedRedemptions) {
    return 'bronze';
  }
  return 'none';
}

/* -----------------------------------------------------------------------------
 * Local Loop
 * --------------------------------------------------------------------------- */

export const LOCAL_LOOP_MODIFIER = 10;

/**
 * +10 to the score per verified sourcing edge. Both buyer and seller in a
 * sourcing relationship receive the bump (see PRD §6C).
 */
export function computeLocalLoopScore(verifiedSourcingCount: number): number {
  return verifiedSourcingCount * LOCAL_LOOP_MODIFIER;
}

/* -----------------------------------------------------------------------------
 * Community Participation Score (CPS)
 * --------------------------------------------------------------------------- */

/**
 * Phase 5 implementation. Activity weights TBD with product. Recomputed on
 * Payload `afterChange` when community activity blocks change.
 */
export function computeCpsScore(_activityCount: number): number {
  return 0;
}
