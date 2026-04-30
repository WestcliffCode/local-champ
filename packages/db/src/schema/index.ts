/**
 * Drizzle schema entry point.
 *
 * Schema ownership (per architectural decision in Phase 0):
 *   - Drizzle owns: `scouts`, `redemptions`, `sourcing`, `reviews`, `cities`
 *   - Payload owns: `businesses`, `coupons` — hand-written introspection in `./payload`
 *     (resync rule documented in that file)
 */
export * from './enums';
export * from './scouts';
export * from './redemptions';
export * from './sourcing';
export * from './reviews';
export * from './cities';
export * from './payload';
