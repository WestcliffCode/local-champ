import path from 'node:path';
import { fileURLToPath } from 'node:url';

import nextEnv from '@next/env';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { Businesses } from './collections/Businesses';
import { Coupons } from './collections/Coupons';
import { Users } from './collections/Users';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Load .env files BEFORE reading any process.env values.
 *
 * Next.js auto-loads .env.local during `next dev` / `next build` via this
 * same `loadEnvConfig` helper. Vercel injects env vars at runtime in
 * production, so the .env files don't exist there and `loadEnvConfig`
 * silently no-ops.
 *
 * The Payload CLI (`migrate:create`, `generate:types`, etc.) spawns Node
 * directly via tsx — it does NOT go through Next.js, so without this call,
 * the fail-fast checks below would throw even when `.env.local` is fully
 * populated. Calling `loadEnvConfig` mirrors Next's behavior so the CLI
 * commands see exactly the same env vars `next dev` does.
 *
 * Precedence (matches Next.js):
 *   .env.local > .env.development > .env  (in dev)
 *   .env.production > .env                (in prod, when .env files exist)
 *
 * **Force dev mode (`true` as 2nd arg).** `loadEnvConfig` defaults `dev`
 * to `process.env.NODE_ENV !== 'production'`. Payload's CLI may set
 * NODE_ENV=production internally before this evaluates, which would skip
 * `.env.local`. The CLI is never invoked in actual production deploys
 * (Vercel injects env from the platform), so forcing dev mode here is
 * always correct for the cases that matter.
 *
 * Default-import + destructure pattern: `@next/env` ships as CJS, so
 * named ESM imports (`import { loadEnvConfig }`) fail under Node's strict
 * ESM loader. Default import + destructure works for both CJS (default =
 * module.exports object) and any future ESM build of the same shape.
 */
const { loadEnvConfig } = nextEnv;
loadEnvConfig(dirname, true);

/**
 * LocalGem Payload CMS configuration.
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

// ── Build-safe env var resolution ────────────────────────────────────────
//
// During `next build`, withPayload() evaluates this config to generate the
// Payload admin bundle and import map. No DB connections or crypto operations
// happen at build time, so placeholder values are safe.
//
// At runtime (`next dev` / `next start`), real values are required — the
// fail-fast checks below throw immediately if they're missing.
//
// This allows `pnpm build` to succeed on CI or a fresh checkout without
// `.env.local`, while keeping strict validation during development and
// production.

// NOTE: NEXT_PHASE is an internal / undocumented Next.js env var set during
// `next build` (value: 'phase-production-build'). It has been stable since
// Next.js ~v12 and is widely relied upon in the ecosystem, but it is NOT
// part of the public API and could change in a future major version. If this
// detection breaks after a Next.js upgrade, replace with a custom env var
// (e.g. SKIP_ENV_VALIDATION=1 set in a build script) or treat the absence
// of both PAYLOAD_SECRET and DATABASE_URL as a proxy for build mode.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const PAYLOAD_SECRET = process.env.PAYLOAD_SECRET;
if (!PAYLOAD_SECRET && !isBuildPhase) {
  throw new Error(
    'PAYLOAD_SECRET is not set. Generate one with `openssl rand -hex 32` and add it to .env.local (development) or your hosting provider env vars (production).',
  );
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL && !isBuildPhase) {
  throw new Error(
    'DATABASE_URL is not set. Use the Supabase pooler "Session" URI from Settings → Database → Connection string.',
  );
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · LocalGem Admin',
    },
  },
  collections: [Businesses, Coupons, Users],
  editor: lexicalEditor(),
  secret: PAYLOAD_SECRET || 'build-placeholder-not-for-runtime',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: DATABASE_URL || 'postgresql://build-placeholder:5432/placeholder',
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
