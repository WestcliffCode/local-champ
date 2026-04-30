import type { CollectionAfterChangeHook, CollectionConfig, FieldHook } from 'payload';
import { revalidateTag } from 'next/cache';
import {
  businessSlugTag,
  businessTag,
  categoryTag,
  cityTag,
  directoryTag,
} from '@localchamp/logic';

/**
 * Slug auto-generation: derive from `name` if not explicitly set.
 * Lowercases, replaces non-alphanumerics with `-`, trims leading/trailing hyphens.
 */
const slugifyFromName: FieldHook = ({ value, data }) => {
  if (typeof value === 'string' && value.length > 0) return value;
  const source = (data as { name?: unknown } | undefined)?.name;
  if (typeof source !== 'string' || source.length === 0) return value;
  return source
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Trigger Next.js ISR invalidation when a business is created or updated.
 *
 * Tag granularity:
 *   - business:{id}                  always
 *   - business:slug:{slug}           always (current slug)
 *   - category:{city}:{category}     always (current combo)
 *   - city:{city}                    always
 *   - directory                      always (broadest — marketing home)
 *
 * If the slug, city_slug, or category_slug changed, ALSO invalidate the old
 * tag values so the previous URL surfaces the updated row (or 404s, depending
 * on what the new state implies).
 *
 * Failures are swallowed: this hook runs after the database write has already
 * succeeded, so we never want to fail the merchant's edit because cache
 * invalidation hit a transient error. Errors are logged for diagnosability.
 */
const revalidateBusinessTags: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
}) => {
  if (operation !== 'create' && operation !== 'update') return doc;

  const tags = new Set<string>();
  tags.add(directoryTag());
  tags.add(businessTag(doc.id));
  tags.add(businessSlugTag(doc.slug));
  tags.add(cityTag(doc.city_slug));
  tags.add(categoryTag(doc.city_slug, doc.category_slug));

  // If slug-bearing fields shifted, invalidate the OLD tag combinations too.
  if (previousDoc && operation === 'update') {
    if (previousDoc.slug && previousDoc.slug !== doc.slug) {
      tags.add(businessSlugTag(previousDoc.slug));
    }
    if (previousDoc.city_slug && previousDoc.city_slug !== doc.city_slug) {
      tags.add(cityTag(previousDoc.city_slug));
    }
    if (
      previousDoc.city_slug &&
      previousDoc.category_slug &&
      (previousDoc.city_slug !== doc.city_slug ||
        previousDoc.category_slug !== doc.category_slug)
    ) {
      tags.add(categoryTag(previousDoc.city_slug, previousDoc.category_slug));
    }
  }

  await Promise.all(
    Array.from(tags).map(async (tag) => {
      try {
        await revalidateTag(tag);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[Businesses.afterChange] revalidateTag('${tag}') failed`, err);
      }
    }),
  );

  return doc;
};

export const Businesses: CollectionConfig = {
  slug: 'businesses',
  labels: {
    singular: 'Business',
    plural: 'Businesses',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city_slug', 'category_slug', 'status', 'cps_score'],
    description:
      'Local businesses listed in the LocalChamp directory. Each row drives a pSEO page at /[city_slug]/[category_slug]/[business_slug].',
  },
  access: {
    // Public read so pSEO pages can render via the Local API.
    read: () => true,
    // Only admins can create new businesses (merchants claim existing ones via Twilio Verify).
    create: ({ req: { user } }) =>
      Boolean(user && (user as { role?: string }).role === 'admin'),
    // Merchants can edit only their own business; admins can edit any.
    update: ({ req: { user }, id }) => {
      if (!user) return false;
      const u = user as { role?: string; business?: string };
      if (u.role === 'admin') return true;
      if (!id || !u.business) return false;
      return String(u.business) === String(id);
    },
    delete: ({ req: { user } }) =>
      Boolean(user && (user as { role?: string }).role === 'admin'),
  },
  hooks: {
    afterChange: [
      revalidateBusinessTags,
      // Phase 5: also recompute cps_score from community activity blocks
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [slugifyFromName] },
      admin: {
        description: 'Auto-generated from name if blank. URL-safe lowercase.',
      },
    },
    {
      name: 'city_slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'URL slug for the city — drives pSEO routing.',
      },
    },
    {
      name: 'category_slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'URL slug for the category (e.g. "coffee", "florist").',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'unverified',
      index: true,
      options: [
        { label: 'Unverified', value: 'unverified' },
        { label: 'Verified', value: 'verified' },
        { label: 'Premium', value: 'premium' },
      ],
    },
    { name: 'is_franchise', type: 'checkbox', defaultValue: false },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'postalCode', type: 'text' },
      ],
    },
    {
      name: 'location',
      type: 'point',
      admin: {
        description: 'Longitude/latitude. Stored as PostGIS geometry(Point, 4326).',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'E.164 format phone number — used for Twilio Verify "Claim Business" flow.',
      },
    },
    { name: 'google_place_id', type: 'text', unique: true },
    { name: 'star_rating', type: 'number', min: 0, max: 5 },
    { name: 'review_count', type: 'number', defaultValue: 0 },
    {
      name: 'cps_score',
      type: 'number',
      defaultValue: 0,
      index: true,
      // Field-level write access blocks merchants from tampering via the
      // REST/GraphQL API. The score is computed by an afterChange hook in
      // Phase 5; that hook uses the Local API which bypasses field access.
      access: {
        create: ({ req: { user } }) =>
          Boolean(user && (user as { role?: string }).role === 'admin'),
        update: ({ req: { user } }) =>
          Boolean(user && (user as { role?: string }).role === 'admin'),
      },
      admin: {
        description:
          'Community Participation Score — computed by Phase 5 hooks. Admin-only manual override.',
      },
    },
    {
      name: 'local_loop_score',
      type: 'number',
      defaultValue: 0,
      access: {
        create: ({ req: { user } }) =>
          Boolean(user && (user as { role?: string }).role === 'admin'),
        update: ({ req: { user } }) =>
          Boolean(user && (user as { role?: string }).role === 'admin'),
      },
      admin: {
        description:
          '+10 per verified sourcing edge (see @localchamp/logic/scoring). Admin-only manual override.',
      },
    },
  ],
};
