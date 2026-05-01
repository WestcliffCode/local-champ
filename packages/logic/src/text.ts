/**
 * Small text utilities shared across server-rendered surfaces.
 */

/**
 * Title-case a slug for display.
 *
 * Splits on hyphens or underscores, then capitalizes each segment:
 *   `coffee`         -> `Coffee`
 *   `pet-supplies`   -> `Pet Supplies`
 *   `wood_workshop`  -> `Wood Workshop`
 *
 * Empty / undefined inputs round-trip unchanged so callers can pipe through
 * untrusted data without first guarding for empty strings.
 */
export function titleizeSlug(slug: string): string {
  if (!slug) return slug;
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
