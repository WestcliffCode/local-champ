export * from './client';
export * as schema from './schema';

/**
 * Re-export drizzle-orm query builder helpers so consumers (e.g. apps/web)
 * don't need a direct `drizzle-orm` dependency. Keeps the ORM choice owned
 * by this package — if we ever swap Drizzle for another ORM, callers don't
 * have to update their imports.
 *
 * Add new helpers here as they're needed; the surface is intentionally
 * narrow rather than `export *` so we can audit what the workspace uses.
 */
export {
  and,
  or,
  not,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  like,
  ilike,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  between,
  exists,
  asc,
  desc,
  sql,
} from 'drizzle-orm';
