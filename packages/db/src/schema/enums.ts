import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Scout Badge tier (gamified status).
 * Logic in `@localchamp/logic/scoring` — recomputed on redemption `completed`
 * and on review submission.
 */
export const scoutBadgeEnum = pgEnum('scout_badge', [
  'none',
  'bronze',
  'silver',
  'gold',
]);

/**
 * Redemption lifecycle.
 * `pending`   — scout tapped Redeem; 5-minute countdown is running on the device.
 * `completed` — merchant marked the redemption confirmed in-store.
 */
export const redemptionStatusEnum = pgEnum('redemption_status', [
  'pending',
  'completed',
]);
