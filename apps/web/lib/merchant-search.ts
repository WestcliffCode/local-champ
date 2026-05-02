import { unstable_cache } from 'next/cache';
import { asc, db, desc, schema, sql } from '@localchamp/db';

import { directoryTag } from '@localchamp/logic';

const { businesses } = schema;

/**
 * Result-row shape for the merchant claim flow's search.
 *
 * Narrower than `DirectoryBusinessRow` in `lib/queries.ts` — the merchant
 * claim search only needs enough to render a clickable list and link to
 * `/merchant/claim/[business_id]`. Selecting fewer columns also keeps the
 * `unstable_cache` payload smaller for repeated queries.
 */
export type MerchantSearchRow = {
  id: string;
  name: string;
  citySlug: string;
  categorySlug: string;
};

/**
 * Pagination envelope for `searchBusinessesGlobal`. Mirrors the shape
 * `SearchResultPage` uses in `lib/queries.ts` but typed with
 * `MerchantSearchRow` rather than the heavier directory row.
 */
export type MerchantSearchPage = {
  rows: MerchantSearchRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

/** Default page size — kept in sync with `SEARCH_DEFAULT_PAGE_SIZE` in queries.ts. */
export const MERCHANT_SEARCH_DEFAULT_PAGE_SIZE = 20;

/**
 * Cross-city Postgres FTS search for the merchant claim flow.
 *
 * Identical scoring + paging logic to `searchBusinessesInCity` in
 * `lib/queries.ts`, but without the city scope. Used by `/merchant/claim`
 * so a merchant can find their own business by name (or any FTS-indexed
 * keyword) regardless of which city it's in.
 *
 * **Why a separate file from queries.ts:** queries.ts is the cached read
 * layer for the public directory routes. This helper is for the
 * auth-gated `(merchant)` route group, which has a different lifecycle
 * (always dynamic, no SEO concern) and a narrower result shape. Keeping
 * them in separate modules makes the audience boundary explicit.
 *
 * Cache TTL matches `searchBusinessesInCity` (5 min) — even authenticated
 * search keys have high cardinality, but popular queries do hit. Cache
 * tag is `directoryTag()` only because the result set spans all cities;
 * any business edit anywhere should invalidate.
 *
 * Same two-query pattern as `searchBusinessesInCity`: count first to
 * distinguish "no matches" (total=0) from "page out of range" (total>0
 * but offset > total). The caller doesn't care about that distinction
 * here (we never 404 the merchant search — it's a stable entry point),
 * but the pattern is preserved so a future caller could.
 *
 * The caller MUST trim and reject empty `query` values before calling.
 */
export async function searchBusinessesGlobal(
  query: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<MerchantSearchPage> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.max(
    1,
    Math.floor(options.pageSize ?? MERCHANT_SEARCH_DEFAULT_PAGE_SIZE),
  );
  const offset = (page - 1) * pageSize;

  return unstable_cache(
    async (): Promise<MerchantSearchPage> => {
      const tsQuery = sql`websearch_to_tsquery('english', ${query})`;
      const where = sql`"search_tsv" @@ ${tsQuery}`;

      const [countRow] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(businesses)
        .where(where);
      const total = Number(countRow?.total ?? 0);
      const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);

      if (total === 0 || offset >= total) {
        return { rows: [], total, page, pageSize, pageCount };
      }

      const tsRank = sql<number>`ts_rank_cd("search_tsv", ${tsQuery})`;
      const rows = await db
        .select({
          id: businesses.id,
          name: businesses.name,
          citySlug: businesses.citySlug,
          categorySlug: businesses.categorySlug,
        })
        .from(businesses)
        .where(where)
        .orderBy(desc(tsRank), desc(businesses.cpsScore), asc(businesses.name))
        .limit(pageSize)
        .offset(offset);

      return {
        rows,
        total,
        page,
        pageSize,
        pageCount,
      };
    },
    [
      'merchant',
      'searchBusinessesGlobal',
      query,
      String(page),
      String(pageSize),
    ],
    {
      tags: [directoryTag()],
      revalidate: 300,
    },
  )();
}
