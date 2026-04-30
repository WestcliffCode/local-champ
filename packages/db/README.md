# `@localchamp/db`

Drizzle ORM schemas, migrations, and Supabase-aware client for LocalChamp.

## Schema ownership split

The Postgres database is shared between two systems:

| Owned by | Tables |
|---|---|
| **Drizzle** (this package) | `scouts`, `redemptions`, `sourcing`, `reviews`, `cities` |
| **Payload CMS** (`apps/web/collections/`) | `businesses`, `coupons`, `users`, `users_sessions`, `payload_*` |

Drizzle defines its tables canonically in `src/schema/*.ts`. Payload defines its tables via collection configs and emits its own migrations to `apps/web/migrations/`.

To let Drizzle queries read Payload-owned tables in pSEO routes, we mirror the Payload schema here in `src/schema/payload.ts` (hand-written). **It is not the source of truth — Payload is.** Re-sync this file whenever Payload's collection configs change.

## Migration files

```
packages/db/drizzle/
├── 0000_silly_black_panther.sql      # Phase 1.A — initial Drizzle tables
├── 0001_rls_policies.sql             # Phase 1.A — RLS on Drizzle-owned tables
├── 0002_payload_fks.sql              # Phase 1.C — FKs from Drizzle → Payload tables
├── 0003_cities_and_fts.sql           # Phase 2.A — cities table + FTS column
└── meta/                             # drizzle-kit snapshot (0000 only — see note below)
```

### Why migrations 0001+ aren't in `meta/_journal.json`

Drizzle-kit's migrator runs migrations whose names are registered in `meta/_journal.json`. We applied 0001+ directly to Supabase via the Composio integration during development (no programmatic migration runner) so they aren't in the journal.

For production deployments with proper migration tooling, register them in the journal and add corresponding snapshot files. For MVP velocity, manual application is fine — every migration file is version-controlled and idempotent (`IF NOT EXISTS` / `EXCEPTION WHEN duplicate_object`).

## Common operations

```bash
# Generate a migration from schema diffs (when adding new Drizzle-owned tables)
pnpm --filter @localchamp/db db:generate

# Apply a migration to the dev database
# (set DATABASE_URL first, or use the Supabase Composio integration)
pnpm --filter @localchamp/db db:push

# Open Drizzle Studio against the connected DB
pnpm --filter @localchamp/db db:studio

# Apply seed data (idempotent — safe to re-run)
psql "$DATABASE_URL" -f packages/db/scripts/seed.sql
# Or paste packages/db/scripts/seed.sql in the Supabase SQL editor.
```

## When Payload changes

If `apps/web/collections/Businesses.ts` or `Coupons.ts` adds, removes, or renames fields:

1. Run `pnpm --filter @localchamp/web payload:migrate:create` to generate Payload's migration
2. Apply the new Payload migration to the database
3. Update `src/schema/payload.ts` to mirror the new shape (column additions/types/etc.)
4. Update any pSEO route handlers that select from the changed tables

This is a manual sync. We accept the maintenance cost in exchange for keeping Drizzle's type-safety on read paths through Payload-owned data.
