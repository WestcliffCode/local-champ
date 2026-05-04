import type { Metadata, Route } from 'next';
import Link from 'next/link';

import { CityCard } from '@localgem/ui';
import { stringifyJsonLd, websiteJsonLd } from '@localgem/logic';

import { getCities } from '@/lib/queries';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://local-gem.vercel.app';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Champion the businesses that make your community',
  description:
    'LocalGem is a community-first directory of verified local businesses, with tap-to-redeem coupons and a Scout Badge program that rewards you for showing up.',
  openGraph: {
    title: 'LocalGem — Champion your community',
    description:
      'A community-first directory of verified local businesses. Discover, claim, and reward the businesses that make your neighborhood worth living in.',
    url: SITE_URL,
    type: 'website',
  },
};

export default async function HomePage() {
  const cities = await getCities();
  const websiteSchema = websiteJsonLd({
    siteName: 'LocalGem',
    siteUrl: SITE_URL,
    description:
      'A community-first directory of verified local businesses, with tap-to-redeem coupons and Scout Badge gamification.',
  });

  return (
    <main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(websiteSchema) }}
      />

      {/* Hero */}
      <section className="px-6 pb-16 pt-20 sm:pb-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-green">
            LocalGem
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Champion your community.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Discover, claim, and reward the businesses that make your neighborhood
            worth living in. Two tracks, one mission: scouts find the spots that
            matter; merchants earn loyalty by giving back.
          </p>
        </div>
      </section>

      {/* Find your city */}
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Find your city</h2>
            <p className="mt-3 text-muted-foreground">
              We&apos;re starting where the energy is highest. More cities rolling
              out as scouts sign up.
            </p>
          </div>

          {cities.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No cities are live yet — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/${city.slug}` as Route}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
                  aria-label={`Browse ${city.displayName}`}
                >
                  <CityCard
                    city={{
                      slug: city.slug,
                      displayName: city.displayName,
                      state: city.state,
                      region: city.region,
                      heroImageUrl: city.heroImageUrl,
                    }}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer-style admin link (carry-over from Phase 1 placeholder) */}
      <section className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-xs text-muted-foreground">
          Merchants — manage your listing at{' '}
          <a
            href="/admin"
            className="underline underline-offset-2 hover:text-foreground"
          >
            /admin
          </a>
          .
        </div>
      </section>
    </main>
  );
}
