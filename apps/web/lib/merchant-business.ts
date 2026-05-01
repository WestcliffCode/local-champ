import config from '@payload-config';
import { db, eq, schema } from '@localchamp/db';
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
