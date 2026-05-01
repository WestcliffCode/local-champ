import type { Metadata } from 'next';
import { DirectoryHeader } from '@/components/directory-header';
import { ScoutAuthBadge } from '@/components/scout-auth-badge';
import '../globals.css';

export const metadata: Metadata = {
  title: {
    default: 'LocalChamp Directory',
    template: '%s \u00b7 LocalChamp',
  },
  description:
    'Discover and champion the best local businesses in your community.',
};

/**
 * Directory route group layout.
 *
 * Owns its own `<html><body>` shell (the canonical Payload + Next pattern \u2014
 * see Workflow Gotcha #8). Visually denser than the marketing-first
 * (frontend) layout: a sticky utility header keeps the LocalChamp wordmark
 * in view as users browse listings, while the body stays unboxed so each
 * page can compose its own hero / breadcrumb / content rhythm.
 *
 * **D2 refactor (2026-04-30):** the inline header markup was extracted to
 * `<DirectoryHeader>` (`apps/web/components/directory-header.tsx`) so the
 * (scout) route group can reuse the same shell. Auth state lives in the
 * `<ScoutAuthBadge>` Client Component slot \u2014 critical for keeping this
 * layout statically renderable. If we called `getCurrentScout()` here,
 * the entire group would flip to dynamic rendering and defeat the ISR
 * caching strategy that PR #6 + #7 set up for the directory pages.
 */
export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DirectoryHeader authBadge={<ScoutAuthBadge />} />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </body>
    </html>
  );
}
