import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { Businesses } from './collections/Businesses.js';
import { Coupons } from './collections/Coupons.js';
import { Users } from './collections/Users.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * LocalChamp Payload CMS configuration.
 *
 * Payload owns the `businesses`, `coupons`, and `users` (merchant auth) tables.
 * The Drizzle-owned tables (`scouts`, `redemptions`, `sourcing`, `reviews`)
 * coexist in the same Postgres but are managed separately — see
 * `packages/db/src/schema/`.
 *
 * Migration mode: `push: false` always, so schema changes flow through
 * version-controlled migration files in `apps/web/migrations/`. This is
 * critical because dev and prod point at the same Supabase project — `push`
 * mode would auto-mutate schema based on local code, which is unsafe on shared DBs.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · LocalChamp Admin',
    },
  },
  collections: [Businesses, Coupons, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL ?? '',
    },
    push: false,
    // UUID primary keys across all Payload collections — matches PRD spec
    // and the FK conventions our Drizzle-owned tables expect.
    idType: 'uuid',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  // Disable GraphQL playground in production.
  graphQL: {
    disablePlaygroundInProduction: true,
  },
});
