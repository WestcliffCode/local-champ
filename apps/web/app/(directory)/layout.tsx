import type { Metadata } from 'next';
import { Space_Grotesk, Manrope } from 'next/font/google';
import { DirectoryHeader } from '@/components/directory-header';
import { ScoutAuthBadge } from '@/components/scout-auth-badge';
import '../globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LocalGem Directory',
    template: '%s · LocalGem',
  },
  description:
    'Discover and champion the best local businesses in your community.',
};

/**
 * Directory route group layout.
 *
 * Owns its own `<html><body>` shell (the canonical Payload + Next pattern —
 * see Workflow Gotcha #8). Visually denser than the marketing-first
 * (frontend) layout: a sticky utility header keeps the LocalGem wordmark
 * in view as users browse listings, while the body stays unboxed so each
 * page can compose its own hero / breadcrumb / content rhythm.
 *
 * **D2 refactor (2026-04-30):** the inline header markup was extracted to
 * `<DirectoryHeader>` (`apps/web/components/directory-header.tsx`) so the
 * (scout) route group can reuse the same shell. Auth state lives in the
 * `<ScoutAuthBadge>` Client Component slot — critical for keeping this
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
    <html lang="en" className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <body className="antialiased">
        <DirectoryHeader authBadge={<ScoutAuthBadge />} />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </body>
    </html>
  );
}
