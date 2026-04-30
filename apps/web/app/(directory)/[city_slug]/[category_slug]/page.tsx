import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BreadcrumbTrail, BusinessCard, DirectoryHero } from '@localchamp/ui';
import { breadcrumbJsonLd, itemListJsonLd } from '@localchamp/logic';

import {
  getBusinessesByCategory,
  getCategoriesForCity,
  getCities,
  getCityBySlug,
} from '@/lib/queries';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://local-champ.vercel.app';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ city_slug: string; category_slug: string }>;
}

export async function generateStaticParams() {
  // Build the full city × category cross-product so every seeded combo
  // prebuilds. With 2 cities and 3 categories at MVP that's 6 pages — cheap.
  const allCities = await getCities();
  const out: Array<{ city_slug: string; category_slug: string }> = [];
  for (const c of allCities) {
    const cats = await getCategoriesForCity(c.slug);
    for (const cat of cats) {
      out.push({ city_slug: c.slug, category_slug: cat.slug });
    }
  }
  return out;
}

function titleizeCategory(slug: string): string {
  // Categories are single-word slugs at MVP (coffee, florist, bookstore).
  // Capitalize the first letter, leave hyphens/underscores intact for future.
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city_slug, category_slug } = await params;
  const city = await getCityBySlug(city_slug);
  if (!city) return { title: 'Not found' };
  const category = titleizeCategory(category_slug);
  return {
    title: `Best ${category.toLowerCase()} in ${city.displayName}`,
    description: `Top-rated ${category.toLowerCase()} spots in ${city.displayName}, ${city.state} — ranked by community participation and verified by scouts.`,
    alternates: {
      canonical: `${SITE_URL}/${city.slug}/${category_slug}`,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { city_slug, category_slug } = await params;

  const city = await getCityBySlug(city_slug);
  if (!city) notFound();

  const businesses = await getBusinessesByCategory(city_slug, category_slug);
  if (businesses.length === 0) notFound();

  const category = titleizeCategory(category_slug);
  const pageUrl = `${SITE_URL}/${city.slug}/${category_slug}`;

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: city.displayName, url: `${SITE_URL}/${city.slug}` },
    { name: category, url: pageUrl },
  ]);

  const itemList = itemListJsonLd({
    name: `Best ${category.toLowerCase()} in ${city.displayName}`,
    url: pageUrl,
    items: businesses.map((b) => ({
      name: b.name,
      url: `${SITE_URL}/${b.citySlug}/${b.categorySlug}/${b.slug}`,
    })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <DirectoryHero
        title={`Best ${category.toLowerCase()} in ${city.displayName}`}
        subtitle={
          <>
            {businesses.length} verified{' '}
            {businesses.length === 1 ? 'spot' : 'spots'}, ranked by community
            participation.
          </>
        }
        searchAction={`/${city.slug}/search`}
        searchPlaceholder={`Search ${city.displayName}…`}
      />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <BreadcrumbTrail
          items={[
            { label: 'Home', href: '/' },
            { label: city.displayName, href: `/${city.slug}` },
            { label: category },
          ]}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
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
      </section>
    </>
  );
}
