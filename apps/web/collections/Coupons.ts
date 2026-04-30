import type { CollectionAfterChangeHook, CollectionConfig } from 'payload';
import { revalidateTag } from 'next/cache';
import { businessTag, directoryTag } from '@localchamp/logic';

/**
 * Trigger Next.js ISR invalidation when a coupon is created or updated.
 *
 * Coupons render on the parent business's detail page, so we invalidate
 * `business:{id}` for the parent. We also bust `directory` so the marketing
 * home (which counts active coupons in future iterations) stays fresh.
 *
 * The `business` field on a coupon is a relationship — Payload returns it
 * as either a string ID (depth 0) or a populated object (depth >= 1).
 * Handle both shapes defensively.
 *
 * Failures are swallowed but logged: cache misses are recoverable; failing
 * the merchant's edit on a transient cache error is not.
 */
const revalidateCouponTags: CollectionAfterChangeHook = async ({
  doc,
  operation,
}) => {
  if (operation !== 'create' && operation !== 'update') return doc;

  const businessRef = doc.business as
    | string
    | { id?: string }
    | null
    | undefined;
  const businessId =
    typeof businessRef === 'string'
      ? businessRef
      : (businessRef?.id ?? null);

  const tags = [directoryTag()];
  if (businessId) tags.push(businessTag(businessId));

  await Promise.all(
    tags.map(async (tag) => {
      try {
        await revalidateTag(tag);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[Coupons.afterChange] revalidateTag('${tag}') failed`, err);
      }
    }),
  );

  return doc;
};

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  labels: {
    singular: 'Coupon',
    plural: 'Coupons',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'business', 'discount_value', 'is_active'],
    description: 'Merchant-issued coupons. Redeemed by scouts via the tap-to-redeem flow.',
  },
  access: {
    // Public read — coupons render on business detail pages.
    read: () => true,
    // Admins can create any. Merchants must have a business linked, otherwise
    // the beforeChange hook can't pin `business` and we'd accept whatever the
    // client sent — a tenancy escape. Block at the access layer.
    create: ({ req: { user } }) => {
      if (!user) return false;
      const u = user as { role?: string; business?: string };
      if (u.role === 'admin') return true;
      return Boolean(u.business);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      const u = user as { role?: string; business?: string };
      if (u.role === 'admin') return true;
      if (!u.business) return false;
      return { business: { equals: u.business } };
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      const u = user as { role?: string; business?: string };
      if (u.role === 'admin') return true;
      if (!u.business) return false;
      return { business: { equals: u.business } };
    },
  },
  hooks: {
    beforeChange: [
      ({ req: { user }, data, operation }) => {
        // For non-admin merchants, force `business` to their own on both
        // create AND update — prevents reassignment of an existing coupon to
        // a different business.
        if (!user) return data;
        if (operation !== 'create' && operation !== 'update') return data;
        const u = user as { role?: string; business?: string };
        if (u.role === 'admin') return data;
        if (u.business) {
          return { ...data, business: u.business };
        }
        return data;
      },
    ],
    afterChange: [revalidateCouponTags],
  },
  fields: [
    {
      name: 'business',
      type: 'relationship',
      relationTo: 'businesses',
      required: true,
      index: true,
      // Field-level access: only admins can change `business` after create.
      // Combined with the beforeChange hook above, this is belt-and-suspenders
      // protection against merchants reassigning a coupon to a different business.
      access: {
        update: ({ req: { user } }) =>
          Boolean(user && (user as { role?: string }).role === 'admin'),
      },
      admin: {
        description:
          'For merchants, this is automatically set to your own business and cannot be changed after creation.',
      },
    },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'discount_value',
      type: 'text',
      required: true,
      admin: {
        description: 'Free-form display text — e.g. "20% off", "$5 off lunch", "Free dessert".',
      },
    },
    { name: 'terms', type: 'textarea' },
    {
      name: 'is_active',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
  ],
};
