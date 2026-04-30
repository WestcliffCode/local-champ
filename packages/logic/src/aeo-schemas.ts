/**
 * AEO (Answer Engine Optimization) helpers.
 *
 * Maps Drizzle business records to Schema.org JSON-LD for embedding in pSEO pages.
 * Phase 2 expands this with full LocalBusiness, BreadcrumbList, ItemList schemas.
 */

import type { Business } from '@localchamp/types';

export function localBusinessJsonLd(business: Business) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    // Phase 2: address, geo, openingHours, image, priceRange, aggregateRating, telephone, url
  } as const;
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  } as const;
}
