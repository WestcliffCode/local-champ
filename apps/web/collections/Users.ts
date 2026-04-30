import type { CollectionConfig } from 'payload';

/**
 * Users — Payload-managed auth for merchants and admins.
 *
 * Architectural reminder:
 *   - This `users` table is for the Payload (CMS) auth system, gating /admin
 *     and /merchant routes.
 *   - End-consumers ("scouts") use Supabase Auth — see `scouts` table in
 *     packages/db/src/schema/scouts.ts.
 *
 * The `business` relationship links a merchant to the single business they
 * own/operate. Admins don't need a business association.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'business'],
    description: 'Merchant + admin auth accounts for the CMS.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      const u = user as { role?: string; id?: string };
      if (u.role === 'admin') return true;
      // Merchants can read only their own user record.
      return { id: { equals: u.id } };
    },
    create: ({ req: { user } }) =>
      Boolean(user && (user as { role?: string }).role === 'admin'),
    update: ({ req: { user }, id }) => {
      if (!user) return false;
      const u = user as { role?: string; id?: string };
      if (u.role === 'admin') return true;
      return String(u.id) === String(id);
    },
    delete: ({ req: { user } }) =>
      Boolean(user && (user as { role?: string }).role === 'admin'),
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'merchant',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Merchant', value: 'merchant' },
      ],
      access: {
        // Only admins can change role.
        update: ({ req: { user } }) =>
          Boolean(user && (user as { role?: string }).role === 'admin'),
      },
    },
    {
      name: 'business',
      type: 'relationship',
      relationTo: 'businesses',
      admin: {
        description: 'Required for merchants; leave empty for admins.',
      },
      access: {
        // Only admins can change which business a merchant is linked to.
        update: ({ req: { user } }) =>
          Boolean(user && (user as { role?: string }).role === 'admin'),
      },
    },
  ],
};
