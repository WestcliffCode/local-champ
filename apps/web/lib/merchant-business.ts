import config from '@payload-config';
import { db, eq, schema } from '@localgem/db';
import { getPayload } from 'payload';

import type { User } from '@/payload-types';

const { businesses } = schema;

/**
 * Read shape for the merchant claim flow's business detail.
 *
 * Narrower than `BusinessDetail` in `lib/queries.ts` — only includes the
 * fields the claim flow needs (verifying ownership of the listed phone,
 * displaying name + city/category for context, and the slug for "view
 * this business publicly" links).
 */
export type ClaimBusiness = {
  id: string;
  name: string;
  slug: string;
  citySlug: string;
  categorySlug: string;
  phone: string | null;
};

/**
 * Fetch a business by id for the merchant claim flow. Returns null when
 * not found.
 *
 * Not cached: claim-flow lookups are rare (one per merchant onboarding
 * attempt) and cache misses on the cold path don't justify the
 * invalidation complexity. The page wrapper renders fully dynamically
 * anyway.
 */
export async function getBusinessForClaim(
  businessId: string,
): Promise<ClaimBusiness | null> {
  const [row] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      citySlug: businesses.citySlug,
      categorySlug: businesses.categorySlug,
      phone: businesses.phone,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  return row ?? null;
}

/**
 * Check whether a business is already linked to a Payload user via the
 * `users.business` relationship. Returns the existing claimer's email if
 * one exists, or `null` if the business is unclaimed.
 *
 * Used to gate the claim flow at `/merchant/claim/[business_id]`: if
 * the business already has a claim, we render an "already claimed"
 * state instead of the Twilio verify form. Same posture as the 1:1
 * phone-uniqueness check (Step 6) — the application layer enforces the
 * invariant; the DB has no constraint.
 *
 * Goes through Payload's Local API rather than a direct Drizzle query
 * because `users` is owned by Payload (schema-ownership rule). Local
 * API bypasses field-level access by design — exactly what we want for
 * this server-side check.
 */
export async function findExistingBusinessClaim(
  businessId: string,
): Promise<{ email: string } | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'users',
    where: { business: { equals: businessId } },
    limit: 1,
    depth: 0,
  });
  if (result.docs.length === 0) return null;
  const claimer = result.docs[0] as User;
  return { email: claimer.email };
}

/**
 * Step 6: enforce the 1:1 phone-to-merchant invariant.
 *
 * Returns the existing claimer's email if any user OTHER than
 * `excludeUserId` has `verified_phone` equal to the given E.164 phone,
 * or `null` if the phone is free.
 *
 * Called from the claim Server Action before EVERY Twilio interaction
 * (start_voice, start_sms, submit_code) — not just before
 * startVerification. Defense-in-depth against the user racing /
 * reloading between stages: if Account A's phone X claimed Business Y1
 * mid-flow, Account B trying to use phone X for Y2 should be rejected
 * even if they already started a verification.
 *
 * **Why excludeUserId:** the current user's own row may already exist
 * with verified_phone set (if they started a claim, succeeded server-
 * side, but their browser hasn't redirected yet). Excluding them by
 * `id != current` makes the check robust to that race. In normal
 * operation the current user has `verified_phone === null` until the
 * approval write happens, so the exclude is a no-op; it's purely for
 * defense.
 *
 * Goes through Payload's Local API for the same reason as
 * `findExistingBusinessClaim` — `users` is Payload-owned and we want
 * the abstractions Payload provides (access controls, hooks) to apply
 * uniformly. Local API bypasses field-level access by design.
 */
export async function findUserByVerifiedPhone(
  phone: string,
  excludeUserId: string,
): Promise<{ email: string } | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'users',
    where: {
      and: [
        { verified_phone: { equals: phone } },
        { id: { not_equals: excludeUserId } },
      ],
    },
    limit: 1,
    depth: 0,
  });
  if (result.docs.length === 0) return null;
  const owner = result.docs[0] as User;
  return { email: owner.email };
}
