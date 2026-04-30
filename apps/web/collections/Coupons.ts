import type { CollectionConfig } from 'payload';

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
    // Merchants can create coupons (constrained to their own business by hook below).
    // Admins can create any.
    create: ({ req: { user } }) => Boolean(user),
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
