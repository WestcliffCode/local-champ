import Link from 'next/link';
import type { ReactNode } from 'react';

export interface DirectoryHeaderProps {
  /**
   * Optional auth-aware slot rendered at the right edge of the nav.
   *
   * Layouts pass a Client Component (typically `<ScoutAuthBadge />`) here so
   * the static layout shell doesn't depend on cookies / dynamic APIs \u2014 the
   * (directory) group MUST stay statically renderable for ISR caching, so we
   * push auth state lookup into a Client Component that hydrates after the
   * initial HTML response.
   */
  authBadge?: ReactNode;
}

/**
 * The shared sticky header used by both the public directory route group
 * and the scout route group. Visually identical across both contexts \u2014 the
 * only thing that varies is the auth badge slot at the right edge of the
 * nav.
 *
 * **Stays as a Server Component on purpose.** All children render statically
 * (the `<Link>` elements from `next/link` are SSR-safe). Auth-driven state
 * lives in the `authBadge` slot, which callers populate with whatever
 * Client Component they want \u2014 keeping this header pure and reusable.
 *
 * Lives at `apps/web/components/` rather than `@localchamp/ui` because it
 * imports `next/link`, and the workspace UI package is intentionally
 * framework-agnostic (no `next` dependency \u2014 see packages/ui/package.json).
 */
export function DirectoryHeader({ authBadge }: DirectoryHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-foreground hover:text-forest-green"
        >
          LocalChamp
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            All cities
          </Link>
          <a href="/admin" className="transition-colors hover:text-foreground">
            Merchants
          </a>
          {authBadge}
        </nav>
      </div>
    </header>
  );
}
