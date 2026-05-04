'use server';

import { db, eq, schema } from '@localgem/db';
import { getCurrentScout } from '@/lib/auth/scout';
import {
  recomputeBusinessCps,
  recomputeScoutBadge,
} from '@/lib/scoring-hooks';
import { after } from 'next/server';

/**
 * Submit a review for a business (scout-gated server action).
 *
 * Inserts a new row into the `reviews` table via Drizzle. The unique
 * constraint `(scout_id, business_id)` enforces one review per scout
 * per business — attempting a second review returns an error.
 *
 * After persisting the review, triggers score recomputation:
 *   - Scout badge (review count changed — may cross Silver/Gold thresholds)
 *   - Business CPS (review count is a CPS input)
 *
 * Both recomputes are scheduled via `after()` for serverless reliability.
 *
 * Guards:
 *   1. Scout must be authenticated (Supabase Auth)
 *   2. Rating must be 1–5
 *   3. Business must exist (FK enforced at DB level)
 *   4. One review per scout per business (unique constraint)
 */
export async function submitReview(
  businessId: string,
  rating: number,
  body?: string,
): Promise<{ success: boolean; error?: string; reviewId?: string }> {
  // ── Auth: scout-only ──────────────────────────────────────────────────────
  const scout = await getCurrentScout();
  if (!scout) {
    return { success: false, error: 'Not authenticated — please sign in' };
  }

  // ── Validate rating ───────────────────────────────────────────────────────
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: 'Rating must be an integer between 1 and 5' };
  }

  // ── Verify business exists ────────────────────────────────────────────────
  const { businesses, reviews } = schema;
  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return { success: false, error: 'Business not found' };
  }

  // ── Insert the review ─────────────────────────────────────────────────────
  // The unique index (scout_id, business_id) will throw on duplicate reviews.
  try {
    const [inserted] = await db
      .insert(reviews)
      .values({
        scoutId: scout.id,
        businessId,
        rating,
        body: body?.trim() || null,
      })
      .returning({ id: reviews.id });

    if (!inserted) {
      return { success: false, error: 'Failed to insert review' };
    }

    // ── Score recomputes: review count changed ──────────────────────────────
    // Both scheduled via after() — the review is already persisted, so scoring
    // failure should not affect the response.
    after(async () => {
      await Promise.all([
        recomputeScoutBadge(scout.id),
        recomputeBusinessCps(businessId),
      ]);
    });

    return { success: true, reviewId: inserted.id };
  } catch (err) {
    // Handle unique constraint violation (scout already reviewed this business)
    const message =
      err instanceof Error ? err.message : String(err);
    if (message.includes('reviews_scout_business_idx') || message.includes('unique')) {
      return { success: false, error: 'You have already reviewed this business' };
    }
    throw err; // Re-throw unexpected errors
  }
}
