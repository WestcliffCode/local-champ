import type { Metadata } from 'next';
import Link from 'next/link';
import '../globals.css';

export const metadata: Metadata = {
  title: {
    default: 'LocalChamp Directory',
    template: '%s · LocalChamp',
  },
  description:
    'Discover and champion the best local businesses in your community.',
};

/**
 * Directory route group layout.
 *
 * Owns its own `<html><body>` shell (the canonical Payload + Next pattern —
 * see Workflow Gotcha #8). Visually denser than the marketing-first
 * (frontend) layout: a sticky utility header keeps the LocalChamp wordmark
 * in view as users browse listings, while the body stays unboxed so each
 * page can compose its own hero / breadcrumb / content rhythm.
 */
export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <Link
              href="/"
              className="text-base font-semibold tracking-tight text-foreground hover:text-forest-green"
            >
              LocalChamp
            </Link>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                href="/"
                className="transition-colors hover:text-foreground"
              >
                All cities
              </Link>
              <a
                href="/admin"
                className="transition-colors hover:text-foreground"
              >
                Merchants
              </a>
            </nav>
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </body>
    </html>
  );
}
