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
    description: `${business.name} \u2014 local${business.addressCity ? ` in ${business.addressCity}` : ''}. Coupons, scores, and verified community details.`,
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
  return parts.join(' \u00b7 ');
}