/**
 * AEO (Answer Engine Optimization) helpers — Schema.org JSON-LD generators.
 *
 * Each helper returns a plain object intended to be JSON-stringified into
 * `<script type="application/ld+json">` tags inside pSEO pages. Generators
 * are pure (no I/O, no global state) so they're safe to call from any layer.
 *
 * Coverage in Phase 2:
 *   - `websiteJsonLd`        — WebSite schema for the marketing home (enables
 *                              Google sitelink search box hooks in 2.C).
 *   - `breadcrumbJsonLd`     — BreadcrumbList for every directory page.
 *   - `itemListJsonLd`       — ItemList for category listings + city featured grid.
 *   - `localBusinessJsonLd`  — LocalBusiness for the business detail page.
 *   - `stringifyJsonLd`      — XSS-safe serializer for `dangerouslySetInnerHTML`.
 *
 * Deferred (post-MVP):
 *   - openingHours: needs an `opening_hours` field on `businesses` (TBD)
 *   - priceRange: same — not in collection yet
 *   - image: revisit when business photos land
 */

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonLdValue }
  | JsonLdValue[];

// ---------- Safe serialization ----------

/**
 * Serialize a JSON-LD object for safe injection into a `<script>` tag.
 *
 * Plain `JSON.stringify` is unsafe inside `dangerouslySetInnerHTML` because
 * any string field that contains `</script>` (or HTML-comment delimiters, or
 * the U+2028 / U+2029 separators that break some JS parsers) can break out
 * of the script context and execute as page markup. Even our own data is
 * a risk vector — a merchant whose business description is "Best `</script>`
 * coffee in Boulder" would otherwise inject markup into the page.
 *
 * Replacements:
 *   - `<`        → `\u003C`   (defeats `</script>`, `<!--`, `<![CDATA[`)
 *   - `\u2028`   → `\\u2028`  (LINE SEPARATOR — invalid in JS string literals)
 *   - `\u2029`   → `\\u2029`  (PARAGRAPH SEPARATOR — same)
 *
 * Output is still valid JSON and parses identically to the original on the
 * Schema.org consumer side.
 */
export function stringifyJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003C')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// ---------- WebSite ----------

export interface WebSiteJsonLdInput {
  siteName: string;
  siteUrl: string;
  description?: string;
}

export function websiteJsonLd(input: WebSiteJsonLdInput) {
  const result: Record<string, JsonLdValue> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.siteName,
    url: input.siteUrl,
  };
  if (input.description) {
    result.description = input.description;
  }
  return result;
}

// ---------- BreadcrumbList ----------

export interface BreadcrumbCrumb {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbCrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ---------- ItemList ----------

export interface ItemListJsonLdInput {
  /** Display name for the list, e.g. "Best coffee in Boulder". */
  name: string;
  /** Canonical URL where this list is rendered. */
  url: string;
  /** List items. Order matters — used as `position`. */
  items: Array<{ name: string; url: string }>;
}

export function itemListJsonLd(input: ItemListJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.name,
    url: input.url,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url,
      name: item.name,
    })),
  };
}

// ---------- LocalBusiness ----------

export interface LocalBusinessAddress {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

export interface LocalBusinessGeo {
  latitude: number;
  longitude: number;
}

export interface LocalBusinessAggregateRating {
  /** 0–5 star rating. */
  ratingValue: number;
  /** Total number of reviews — must be > 0 for the schema to render. */
  reviewCount: number;
}

export interface LocalBusinessJsonLdInput {
  name: string;
  /** Canonical detail-page URL. */
  url: string;
  telephone?: string | null;
  address?: LocalBusinessAddress | null;
  geo?: LocalBusinessGeo | null;
  aggregateRating?: LocalBusinessAggregateRating | null;
  /** Optional photo URL. Skipped at MVP — no business photos yet. */
  image?: string | null;
  /** Optional `$`/`$$`/`$$$` price range. Skipped at MVP — no field. */
  priceRange?: string | null;
}

/**
 * Build a Schema.org `LocalBusiness` JSON-LD object from a business row.
 *
 * Optional fields are conditionally omitted (vs. emitted as `null`) — Google's
 * structured-data validator tolerates absent fields but flags `null` values.
 *
 * `aggregateRating` is only emitted when `reviewCount > 0`. A business with
 * zero reviews shouldn't claim an aggregate rating.
 */
export function localBusinessJsonLd(input: LocalBusinessJsonLdInput) {
  const result: Record<string, JsonLdValue> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: input.name,
    url: input.url,
  };

  if (input.telephone) result.telephone = input.telephone;
  if (input.image) result.image = input.image;
  if (input.priceRange) result.priceRange = input.priceRange;

  if (input.address) {
    const { street, city, state, postalCode } = input.address;
    if (street || city || state || postalCode) {
      const postalAddress: Record<string, JsonLdValue> = {
        '@type': 'PostalAddress',
      };
      if (street) postalAddress.streetAddress = street;
      if (city) postalAddress.addressLocality = city;
      if (state) postalAddress.addressRegion = state;
      if (postalCode) postalAddress.postalCode = postalCode;
      result.address = postalAddress;
    }
  }

  if (input.geo) {
    result.geo = {
      '@type': 'GeoCoordinates',
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
    };
  }

  if (input.aggregateRating && input.aggregateRating.reviewCount > 0) {
    result.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.aggregateRating.ratingValue,
      reviewCount: input.aggregateRating.reviewCount,
    };
  }

  return result;
}
