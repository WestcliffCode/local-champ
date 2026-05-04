import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  BreadcrumbTrail,
  BusinessCard,
  DirectoryHero,
} from '@localgem/ui';
import {
  breadcrumbJsonLd,
  itemListJsonLd,
  stringifyJsonLd,
} from '@localgem/logic';

import {
  getCategoriesForCity,
  getCities,
  getCityBySlug,
  getFeaturedBusinesses,
} from '@/lib/queries';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://local-gem.vercel.app';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ city_slug: string }>;
}

export async function generateStaticParams() {
  const allCities = await getCities();
  return allCities.map((c) => ({ city_slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city_slug } = await params;
  const city = await getCityBySlug(city_slug);
  if (!city) return { title: 'City not found' };
  return {
    title: `Best of ${city.displayName}`,
    description: `Discover and champion the best local businesses in ${city.displayName}, ${city.state}. Verified spots, community-driven scoring, and tap-to-redeem coupons.`,
    alternates: {
      canonical: `${SITE_URL}/${city.slug}`,
    },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city_slug } = await params;
  const city = await getCityBySlug(city_slug);
  if (!city) notFound();

  const [categories, featured] = await Promise.all([
    getCategoriesForCity(city_slug),
    getFeaturedBusinesses(city_slug, 6),
  ]);

  const cityUrl = `${SITE_URL}/${city.slug}`;
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: city.displayName, url: cityUrl },
  ]);
  const featuredList = itemListJsonLd({
    name: `Featured businesses in ${city.displayName}`,
    url: cityUrl,
    items: featured.map((b) => ({
      name: b.name,
      url: `${SITE_URL}/${b.citySlug}/${b.categorySlug}/${b.slug}`,
    })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumb) }}
      />
      {featured.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(featuredList) }}
        />
      )}

      <DirectoryHero
        title={`Best of ${city.displayName}`}
        subtitle={
          <>
            {city.state}
            {city.region ? ` · ${city.region}` : ''} — community-verified spots
            and tap-to-redeem coupons.
          </>
        }
        searchAction={`/${city.slug}/search`}
        searchPlaceholder={`Search ${city.displayName}…`}
      />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <BreadcrumbTrail
          items={[
            { label: 'Home', href: '/' },
            { label: city.displayName },
          ]}
        />

        {/* Browse by category */}
        <div className="mt-10">
          <h2 className="text-xl font-bold sm:text-2xl">Browse by category</h2>
          {categories.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              No categories yet for {city.displayName}.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${city.slug}/${cat.slug}` as Route}
                  className="block rounded-lg border border-border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="text-lg font-semibold">{cat.displayName}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {cat.businessCount}{' '}
                    {cat.businessCount === 1 ? 'business' : 'businesses'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Featured businesses */}
        <div className="mt-16">
          <h2 className="text-xl font-bold sm:text-2xl">
            Featured in {city.displayName}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Top-scoring spots by community participation.
          </p>
          {featured.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              No featured businesses yet.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((b) => (
                <Link
                  key={b.id}
                  href={`/${b.citySlug}/${b.categorySlug}/${b.slug}` as Route}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
                  aria-label={b.name}
                >
                  <BusinessCard business={b} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
