import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { scoutBadgeEnum } from './enums';

/**
 * Scouts — the canonical consumer profile entity for LocalGem.
 *
 * One row per Supabase Auth user (linked via `auth_user_id` → `auth.users.id`).
 * RLS: scouts can read/update their own row. Service role bypasses RLS for
 * server-side writes (sign-up, badge recompute, etc.).
 */
export const scouts = pgTable(
  'scouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** FK-by-convention to `auth.users.id`. We don't add a hard FK so that
     *  scout profile creation can run before/independent of auth.users
     *  reference integrity (Supabase Auth manages that table). */
    authUserId: uuid('auth_user_id').notNull().unique(),
    email: text('email').notNull().unique(),
    fullName: text('full_name'),
    /** Optional phone — captured at first redemption via nudge (Phase 4). */
    phone: text('phone'),
    badgeStatus: scoutBadgeEnum('badge_status').notNull().default('none'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('scouts_badge_idx').on(t.badgeStatus)],
);
