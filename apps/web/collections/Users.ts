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
 *
 * The `verified_phone` field is set ONLY by the Twilio Verify flow at
 * `/merchant/claim/[business_id]` (Phase 3 D3). It carries the E.164 phone
 * number that the merchant proved control of via Voice OTP (with SMS
 * fallback), and powers the 1:1 phone-uniqueness invariant enforced
 * server-side in the claim Server Actions.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'business', 'verified_phone'],
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
      // Server-side enforcement of the tenancy invariant: merchants MUST have
      // a linked business; admins MAY have one but don't need to.
      validate: (
        value: unknown,
        args: { siblingData?: { role?: string } | null } | undefined,
      ) => {
        const role = args?.siblingData?.role;
        if (role === 'merchant' && !value) {
          return 'A merchant account must be linked to a business.';
        }
        return true;
      },
      admin: {
        description: 'Required for merchants; leave empty for admins.',
      },
      access: {
        // Only admins can change which business a merchant is linked to.
        update: ({ req: { user } }) =>
          Boolean(user && (user as { role?: string }).role === 'admin'),
      },
    },
    {
      name: 'verified_phone',
      type: 'text',
      // Indexed so the 1:1 uniqueness lookup (Step 6 of the D3 plan) doesn't
      // sequential-scan the users table. Non-unique because most rows will
      // have NULL until they complete a claim, and the uniqueness check is
      // enforced in the application layer (returns the stable error code
      // `phone_already_claimed` rather than a raw DB error).
      index: true,
      admin: {
        description:
          'E.164 phone number verified via Twilio Voice OTP during the merchant claim flow. Set by the claim Server Action — do not edit manually unless you are clearing it.',
      },
      access: {
        // Merchants must NOT be able to set this directly via UI or REST API.
        // The Twilio claim flow uses Payload's Local API, which bypasses
        // field-level access controls by design (privileged server path).
        // Admins can edit via UI/API to manually clear or correct.
        update: ({ req: { user } }) =>
          Boolean(user && (user as { role?: string }).role === 'admin'),
      },
    },
  ],
};
