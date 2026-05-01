import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  BreadcrumbTrail,
  BusinessCard,
  DirectoryHero,
} from '@localchamp/ui';
import { breadcrumbJsonLd, stringifyJsonLd } from '@localchamp/logic';

import { getCityBySlug, searchBusinessesInCity } from '@/lib/queries';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://local-champ.vercel.app';

interface PageProps {
  params: Promise<{ city_slug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

/** Defensive parse of the `?page=` query param. Always returns ≥ 1. */
function parsePageParam(raw: string | undefined): number {
  if (!raw) return 1;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

/**
 * Compose the search-page URL for a given query + page. Centralized so the
 * `Link` hrefs and the canonical `<link>` always agree on encoding.
 */
function buildSearchHref(citySlug: string, q: string, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/${citySlug}/search?${qs}` : `/${citySlug}/search`;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const [{ city_slug }, sp] = await Promise.all([params, searchParams]);
  const city = await getCityBySlug(city_slug);

  // Search results are wayfinding, not indexable content. Google has
  // historically treated indexed internal-search pages as soft-404 / thin
  // content. Our indexed surface is the city / category / business pages.
  const robots = { index: false, follow: true } as const;

  if (!city) return { title: 'Search', robots };

  const q = (sp.q ?? '').trim();
  const page = parsePageParam(sp.page);
  const canonicalPath = buildSearchHref(city.slug, q, page);

  return {
    title: q ? `Search "${q}" in ${city.displayName}` : `Search · ${city.displayName}`,
    description: q
      ? `Find local businesses matching "${q}" in ${city.displayName}, ${city.state}.`
      : `Search local businesses in ${city.displayName}, ${city.state}.`,
    alternates: {
      canonical: `${SITE_URL}${canonicalPath}`,
    },
    robots,
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const [{ city_slug }, sp] = await Promise.all([params, searchParams]);
  const city = await getCityBySlug(city_slug);
  if (!city) notFound();

  const q = (sp.q ?? '').trim();
  const page = parsePageParam(sp.page);

  const cityUrl = `${SITE_URL}/${city.slug}`;
  const searchBaseUrl = `${SITE_URL}/${city.slug}/search`;

  // ---------- Empty input: skip the DB query, render a guidance state ----------
  if (!q) {
    const breadcrumb = breadcrumbJsonLd([
      { name: 'Home', url: SITE_URL },
      { name: city.displayName, url: cityUrl },
      { name: 'Search', url: searchBaseUrl },
    ]);

    return (
      <>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumb) }}
        />

        <DirectoryHero
          title={`Search ${city.displayName}`}
          subtitle="Type a business name, category, or keyword to find local spots."
          searchAction={`/${city.slug}/search`}
          searchPlaceholder={`Search ${city.displayName}…`}
        />

        <section className="mx-auto max-w-3xl px-6 py-10">
          <BreadcrumbTrail
            items={[
              { label: 'Home', href: '/' },
              { label: city.displayName, href: `/${city.slug}` },
              { label: 'Search' },
            ]}
          />
          <p className="mt-12 text-center text-muted-foreground">
            Looking for something specific? Try{' '}
            <span className="font-semibold text-foreground">coffee</span>,{' '}
            <span className="font-semibold text-foreground">florist</span>, or
            browse{' '}
            <Link
              href={`/${city.slug}` as Route}
              className="underline underline-offset-2 hover:text-foreground"
            >
              all categories in {city.displayName}
            </Link>
            .
          </p>
        </section>
      </>
    );
  }

  // ---------- Run the search ----------
  const result = await searchBusinessesInCity(city.slug, q, { page });

  // Out-of-range page → 404 (cleaner than rendering "no results" when there
  // ARE results just on a different page). The query helper guarantees that
  // total > 0 implies pageCount ≥ 1; if page > pageCount we know it's a
  // typed-by-hand bad URL.
  if (result.total > 0 && page > result.pageCount) notFound();

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: city.displayName, url: cityUrl },
    { name: `Search: ${q}`, url: `${SITE_URL}${buildSearchHref(city.slug, q, 1)}` },
  ]);

  const subtitle =
    result.total === 0 ? (
      <>
        No matches for{' '}
        <span className="font-semibold">&ldquo;{q}&rdquo;</span> in{' '}
        {city.displayName}.
      </>
    ) : (
      <>
        {result.total} {result.total === 1 ? 'match' : 'matches'} for{' '}
        <span className="font-semibold">&ldquo;{q}&rdquo;</span>
      </>
    );

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumb) }}
      />

      <DirectoryHero
        title={`Search ${city.displayName}`}
        subtitle={subtitle}
        searchAction={`/${city.slug}/search`}
        searchDefaultValue={q}
        searchPlaceholder={`Search ${city.displayName}…`}
      />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <BreadcrumbTrail
          items={[
            { label: 'Home', href: '/' },
            { label: city.displayName, href: `/${city.slug}` },
            { label: `Search: ${q}` },
          ]}
        />

        {result.total === 0 ? (
          <div className="mt-12 text-center text-muted-foreground">
            <p>
              Try a different keyword, or{' '}
              <Link
                href={`/${city.slug}` as Route}
                className="underline underline-offset-2 hover:text-foreground"
              >
                browse {city.displayName}
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.rows.map((b) => (
                <Link
                  key={b.id}
                  href={`/${b.citySlug}/${b.categorySlug}/${b.slug}` as Route}
                  className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={b.name}
                >
                  <BusinessCard business={b} />
                </Link>
              ))}
            </div>

            {result.pageCount > 1 && (
              <nav
                aria-label="Search results pagination"
                className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-6 text-sm"
              >
                {page > 1 ? (
                  <Link
                    href={buildSearchHref(city.slug, q, page - 1) as Route}
                    rel="prev"
                    className="text-foreground hover:underline"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span aria-hidden />
                )}

                <span className="text-muted-foreground">
                  Page {page} of {result.pageCount}
                  {' · '}
                  {result.total} {result.total === 1 ? 'result' : 'results'}
                </span>

                {page < result.pageCount ? (
                  <Link
                    href={buildSearchHref(city.slug, q, page + 1) as Route}
                    rel="next"
                    className="text-foreground hover:underline"
                  >
                    Next →
                  </Link>
                ) : (
                  <span aria-hidden />
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}
