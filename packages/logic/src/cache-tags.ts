/**
 * Cache tag generators for Next.js `revalidateTag()` invalidation.
 *
 * Single source of truth for tag naming. Both the read side
 * (apps/web/lib/queries.ts wraps cached fetchers with these tags) AND the
 * write side (apps/web/collections/Businesses.ts and Coupons.ts fire these
 * tags from afterChange hooks) import from here so the two sides can never
 * disagree on a tag name.
 *
 * Naming convention: `<scope>:<discriminator>[:<sub-discriminator>]`
 *   - `directory`                   — broadest invalidation (marketing home + every
 *                                     listing). Use sparingly.
 *   - `city:{slug}`                 — city landing + featured business set
 *   - `category:{city}:{cat}`       — category listing scoped to a city
 *   - `business:{id}`               — single business, by primary key
 *   - `business:slug:{slug}`        — single business, by slug (cheaper from page params)
 *
 * Tag granularity rule of thumb: invalidate the SMALLEST set you can prove
 * affects the user-visible page. A coupon edit only touches its parent business
 * page (so just `business:{id}`); a business slug change can flip the URL of
 * its detail page AND the listing it appears on (so `business:{id}` +
 * `business:slug:{old}` + `business:slug:{new}` + `category:{city}:{cat}` +
 * `city:{slug}`).
 */

export function directoryTag(): string {
  return 'directory';
}

export function cityTag(citySlug: string): string {
  return `city:${citySlug}`;
}

export function categoryTag(citySlug: string, categorySlug: string): string {
  return `category:${citySlug}:${categorySlug}`;
}

export function businessTag(businessId: string): string {
  return `business:${businessId}`;
}

export function businessSlugTag(businessSlug: string): string {
  return `business:slug:${businessSlug}`;
}
