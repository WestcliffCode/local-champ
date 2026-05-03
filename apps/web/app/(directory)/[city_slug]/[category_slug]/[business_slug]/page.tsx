import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  BreadcrumbTrail,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MapPin,
  Phone,
  ScoreBadge,
  Separator,
  Star,
  Tag,
} from '@localchamp/ui';
import {
  breadcrumbJsonLd,
  localBusinessJsonLd,
  stringifyJsonLd,
  titleizeSlug,
} from '@localchamp/logic';

import {
  getBusinessBySlug,
  getCityBySlug,
  getCouponsForBusiness,
  getSourcingForBusiness,
  getStaticBusinessParams,
} from '@/lib/queries';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://local-champ.vercel.app';

export const revalidate = 3600;
/**
 * Allow on-demand rendering of business slugs that fall outside the top-100
 * static prebuild set. New verified businesses appear immediately on first
 * request without waiting for the next deploy.
 */
export const dynamicParams = true;

interface PageProps {
  params: Promise<{
    city_slug: string;
    category_slug: string;
    business_slug: string;
  }>;
}

export async function generateStaticParams() {
  return getStaticBusinessParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city_slug, category_slug, business_slug } = await params;
  const business = await getBusinessBySlug(
    city_slug,
    category_slug,
    business_slug,
  );
  if (!business) return { title: 'Not found' };
  return {
    title: business.name,
    description: `${business.name} — local${business.addressCity ? ` in ${business.addressCity}` : ''}. Coupons, scores, and verified community details.`,
    alternates: {
      canonical: `${SITE_URL}/${city_slug}/${category_slug}/${business_slug}`,
    },
  };
}

function formatAddressLine(business: {
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
}): string {
  const parts = [
    business.addressStreet,
    [business.addressCity, business.addressState].filter(Boolean).join(', '),
    business.addressPostalCode,
  ].filter((s): s is string => Boolean(s));
  return parts.join(' · ');
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { city_slug, category_slug, business_slug } = await params;

  // Fetch business + city in parallel. City lookup is needed for the
  // breadcrumb display name (e.g. 'Boulder' instead of the 'boulder' slug).
  const [business, city] = await Promise.all([
    getBusinessBySlug(city_slug, category_slug, business_slug),
    getCityBySlug(city_slug),
  ]);
  if (!business) notFound();

  const [coupons, sourcing] = await Promise.all([
    getCouponsForBusiness(business.id),
    getSourcingForBusiness(business.id),
  ]);

  // Display name fallbacks: if the city row isn't in the DB (shouldn't happen
  // for a business whose city_slug exists, but defensive), title-case the slug.
  const cityDisplayName = city?.displayName ?? titleizeSlug(business.citySlug);
  const categoryDisplayName = titleizeSlug(business.categorySlug);

  const businessUrl = `${SITE_URL}/${city_slug}/${category_slug}/${business_slug}`;
  const categoryUrl = `${SITE_URL}/${city_slug}/${category_slug}`;
  const cityUrl = `${SITE_URL}/${city_slug}`;

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: cityDisplayName, url: cityUrl },
    { name: categoryDisplayName, url: categoryUrl },
    { name: business.name, url: businessUrl },
  ]);

  const localBusiness = localBusinessJsonLd({
    name: business.name,
    url: businessUrl,
    telephone: business.phone,
    address: {
      street: business.addressStreet,
      city: business.addressCity,
      state: business.addressState,
      postalCode: business.addressPostalCode,
    },
    geo: business.geo,
    aggregateRating:
      business.starRating != null && business.reviewCount > 0
        ? {
            ratingValue: business.starRating,
            reviewCount: business.reviewCount,
          }
        : null,
  });

  const addressLine = formatAddressLine(business);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(localBusiness) }}
      />

      <section className="mx-auto max-w-4xl px-6 py-10">
        <BreadcrumbTrail
          items={[
            { label: 'Home', href: '/' },
            { label: cityDisplayName, href: `/${business.citySlug}` },
            {
              label: categoryDisplayName,
              href: `/${business.citySlug}/${business.categorySlug}`,
            },
            { label: business.name },
          ]}
        />

        {/* Hero */}
        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <span>{categoryDisplayName}</span>
            <span aria-hidden>·</span>
            <span>{cityDisplayName}</span>
            {business.status === 'verified' && (
              <>
                <span aria-hidden>·</span>
                <span className="font-semibold text-forest-green">
                  Verified
                </span>
              </>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {business.name}
          </h1>
          {business.starRating != null && business.reviewCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-current" aria-hidden />
              <span className="font-semibold">
                {business.starRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({business.reviewCount.toLocaleString()} reviews)
              </span>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {business.cpsScore > 0 && (
              <ScoreBadge variant="cps" value={business.cpsScore} />
            )}
            {business.localLoopScore > 0 && (
              <ScoreBadge variant="local-loop" value={business.localLoopScore} />
            )}
          </div>
        </header>

        {/* Practical info */}
        {(addressLine || business.phone) && (
          <Card className="mt-8">
            <CardContent className="flex flex-col gap-3 pt-6 text-sm">
              {addressLine && (
                <div className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span>{addressLine}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-start gap-3">
                  <Phone
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <a
                    href={`tel:${business.phone}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {business.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Coupons */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold sm:text-2xl">Coupons</h2>
            {coupons.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {coupons.length} active
              </span>
            )}
          </div>
          {coupons.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              No active coupons right now. Check back — merchants add new ones
              regularly.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {coupons.map((c) => (
                <Card key={c.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-start gap-2 text-base">
                      <Tag
                        className="mt-1 h-4 w-4 shrink-0 text-forest-green"
                        aria-hidden
                      />
                      <span>{c.title}</span>
                    </CardTitle>
                    <p className="text-sm font-semibold text-forest-green">
                      {c.discountValue}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                    {c.description && (
                      <p className="text-sm text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                    {c.terms && (
                      <p className="text-xs italic text-muted-foreground">
                        {c.terms}
                      </p>
                    )}
                    <div className="mt-auto pt-3">
                      <Link
                        href={`/redeem?coupon=${c.id}`}
                        className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        Redeem
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-12" />

        {/* Local Loop / sourcing */}
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">
            Local Loop partners
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Verified B2B sourcing relationships with other local businesses.
            Each verified partnership earns both businesses +10 to their Local
            Loop score.
          </p>
          {sourcing.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              No verified Local Loop partners yet for this business.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {sourcing.map((edge) => (
                <Link
                  key={edge.id}
                  href={
                    `/${edge.partnerCitySlug}/${edge.partnerCategorySlug}/${edge.partnerSlug}` as Route
                  }
                  className="block rounded-lg border border-border bg-background p-4 shadow-sm transition-all hover:shadow-md hover:border-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {edge.direction === 'sells_to' ? 'Sells to' : 'Buys from'}
                  </div>
                  <div className="mt-1 font-semibold">{edge.partnerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {titleizeSlug(edge.partnerCategorySlug)} ·{' '}
                    {titleizeSlug(edge.partnerCitySlug)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
