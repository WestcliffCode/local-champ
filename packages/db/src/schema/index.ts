/**
 * Drizzle schema entry point.
 *
 * Schema ownership (per architectural decision in Phase 0):
 *   - Drizzle owns: `scouts`, `redemptions`, `sourcing`, `reviews`
 *   - Payload owns: `businesses`, `coupons` — introspected types added in Phase 1.B
 */
export * from './enums';
export * from './scouts';
export * from './redemptions';
export * from './sourcing';
export * from './reviews';
