import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { titleizeSlug } from '@localgem/logic';

import { getCurrentMerchant } from '@/lib/auth/merchant';
import { searchBusinessesGlobal } from '@/lib/merchant-search';

export const metadata: Metadata = {
  title: 'Claim your business',
  description:
    'Find and claim your business listing on LocalGem. Verified via Twilio Voice OTP.',
};

interface PageProps {
  // Next.js searchParams values can be `string | string[] | undefined` —
  // repeated params (`?q=foo&q=bar`) come through as arrays. Reflecting
  // that in the type so the call sites are forced to handle it via
  // `firstParam` rather than crashing on `.trim()` etc. (Workflow Gotcha #12.)
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
}

/**
 * Coerce a possibly-array search param to a single string. Browsers
 * serialize repeated `?q=foo&q=bar` as `q=['foo','bar']` server-side.
 * We treat the FIRST occurrence as canonical (matches what browsers send
 * when a form has duplicate inputs anyway).
 */
function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Defensive parse of the `?page=` query param. Always returns >= 1. */
function parsePageParam(raw: string | undefined): number {
  if (!raw) return 1;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

/**
 * Compose the claim-search URL for a given query + page. Centralized so
 * pagination `<Link>`s and the form submission target always agree on
 * encoding.
 *
 * **URL is `/claim`, not `/merchant/claim`.** Route groups (parens) don't
 * add to the URL path — `app/(merchant)/claim/page.tsx` resolves at
 * `/claim`. The `(merchant)` group is for layout + auth-gating only.
 * Same convention as the existing scout routes (`(scout)/sign-in` →
 * `/sign-in`).
 */
function buildClaimSearchHref(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/claim?${qs}` : '/claim';
}

/**
 * Step 1 of the merchant claim flow: business search.
 *
 * The merchant has already authenticated (the `(merchant)/layout.tsx`
 * gate ensures a Payload session). This page lets them find their
 * business by name (or any FTS-indexed keyword), then click through to
 * Step 2 at `/claim/[business_id]` to confirm phone + verify.
 *
 * **Already-claimed merchants get bounced to `/admin`.** A merchant whose
 * `business` field is already set finished the claim flow in a prior
 * session — they have no business here. They should be in `/admin`
 * editing their business, not searching for another one. Admins (whose
 * `business` field may be empty) pass through unaffected.
 *
 * **Cross-city search.** Unlike the public directory search which scopes
 * to a city, this view searches all cities via `searchBusinessesGlobal`.
 * Merchants don't necessarily know their city's slug — they want to
 * find their own business by name, possibly anywhere.
 *
 * **No JSON-LD breadcrumbs / SEO chrome.** Behind auth and
 * `robots: noindex/nofollow` (inherited from layout metadata), so we
 * skip the breadcrumbJsonLd dance the public search page does.
 *
 * UX rhythm:
 *   - Empty `?q=` → form + onboarding hint, skip the DB query
 *   - With `?q=` → run search, show results in a clickable list
 *   - Each row → click-through to `/claim/[business_id]`
 *   - Pagination matches the directory search (>= 1, 404-on-out-of-range
 *     is left to the [business_id] page since this view is a stable
 *     entry point we don't want to 404 on a typo)
 */
export default async function MerchantClaimSearchPage({
  searchParams,
}: PageProps) {
  const user = await getCurrentMerchant();
  // Defensive null check: layout already redirects unauthenticated users,
  // but TypeScript doesn't know that across the boundary. Re-check so the
  // type narrows and we don't pass `undefined.business` below.
  if (!user) {
    redirect('/admin/login');
  }

  // Already-claimed merchants belong in /admin, not here. Admins (no
  // business association required) pass through.
  if (user.business) {
    redirect('/admin');
  }

  const sp = await searchParams;
  const q = (firstParam(sp.q) ?? '').trim();
  const page = parsePageParam(firstParam(sp.page));

  // -------- Empty input: skip the DB query, render guidance + form --------
  if (!q) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Claim your business
          </h1>
          <p className="mt-2 text-muted-foreground">
            Search for your business by name to start the claim process.
            We&rsquo;ll verify you with a one-time call to your business phone
            number.
          </p>
        </header>

        <form
          method="get"
          action="/claim"
          className="flex items-center gap-3"
        >
          <input
            type="search"
            name="q"
            placeholder="e.g. Asheville Books and Bindery"
            className="h-11 flex-1 rounded-md border border-border bg-background px-4 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Business name"
            autoFocus
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-forest-green px-5 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </form>

        <p className="mt-12 text-sm text-muted-foreground">
          Tip: search for any part of your business name. If you don&rsquo;t
          see your business, it may not be in our directory yet &mdash;{' '}
          <a
            href="mailto:hello@localgem.com"
            className="underline underline-offset-2 hover:text-foreground"
          >
            email us
          </a>{' '}
          to add it.
        </p>
      </div>
    );
  }

  // -------- Run the search --------
  const result = await searchBusinessesGlobal(q, { page });

  // Out-of-range page guard: a user manually setting `?page=50` on a 2-page
  // result would otherwise see "Page 50 of 2" + an empty list, with the
  // pagination "Previous" link pointing at another out-of-range page.
  // Redirect to the last valid page instead. The page is a stable entry
  // point; 404'ing on a typo would be hostile (CodeRabbit #7).
  //
  // **typedRoutes assertion:** `redirect()` is strictly typed under
  // `experimental.typedRoutes` (same as `<Link href>`). Helper-function
  // returns need `as Route` casts.
  if (result.total > 0 && page > result.pageCount) {
    redirect(buildClaimSearchHref(q, result.pageCount) as Route);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Claim your business
        </h1>
        <p className="mt-2 text-muted-foreground">
          {result.total === 0 ? (
            <>
              No matches for{' '}
              <span className="font-semibold">&ldquo;{q}&rdquo;</span>. Try a
              different keyword or check spelling.
            </>
          ) : (
            <>
              {result.total} {result.total === 1 ? 'match' : 'matches'} for{' '}
              <span className="font-semibold">&ldquo;{q}&rdquo;</span>. Click
              your business to start verification.
            </>
          )}
        </p>
      </header>

      <form
        method="get"
        action="/claim"
        className="mb-8 flex items-center gap-3"
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          className="h-11 flex-1 rounded-md border border-border bg-background px-4 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Business name"
        />
        <button
          type="submit"
          className="h-11 rounded-md bg-forest-green px-5 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </form>

      {result.total > 0 ? (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {result.rows.map((b) => (
            <li key={b.id}>
              <Link
                href={`/claim/${b.id}` as Route}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent focus:outline-none focus-visible:bg-accent"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {b.name}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {titleizeSlug(b.citySlug)} &middot;{' '}
                    {titleizeSlug(b.categorySlug)}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium text-forest-green">
                  Claim &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-md border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          <p>
            Don&rsquo;t see your business?{' '}
            <a
              href="mailto:hello@localgem.com"
              className="underline underline-offset-2 hover:text-foreground"
            >
              email us
            </a>{' '}
            to add it to the directory.
          </p>
        </div>
      )}

      {result.pageCount > 1 && (
        <nav
          aria-label="Search results pagination"
          className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6 text-sm"
        >
          {page > 1 ? (
            <Link
              href={buildClaimSearchHref(q, page - 1) as Route}
              rel="prev"
              className="text-foreground hover:underline"
            >
              &larr; Previous
            </Link>
          ) : (
            <span aria-hidden />
          )}
          <span className="text-muted-foreground">
            Page {page} of {result.pageCount} &middot; {result.total}{' '}
            {result.total === 1 ? 'result' : 'results'}
          </span>
          {page < result.pageCount ? (
            <Link
              href={buildClaimSearchHref(q, page + 1) as Route}
              rel="next"
              className="text-foreground hover:underline"
            >
              Next &rarr;
            </Link>
          ) : (
            <span aria-hidden />
          )}
        </nav>
      )}
    </div>
  );
}
