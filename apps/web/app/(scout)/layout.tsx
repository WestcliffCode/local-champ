import type { Metadata } from 'next';
import { DirectoryHeader } from '@/components/directory-header';
import { ScoutAuthBadge } from '@/components/scout-auth-badge';
import '../globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Scout · LocalGem',
    template: '%s · LocalGem',
  },
  description:
    'Sign in to your LocalGem Scout account to redeem coupons, track your badge progress, and champion local businesses.',
  // Scout pages are auth-gated and not SEO-targeted — no value in indexing.
  robots: { index: false, follow: false },
};

/**
 * Scout route group layout.
 *
 * Owns its own `<html><body>` shell (per Workflow Gotcha #8 — Payload's
 * RootLayout renders its own document tags, so the root layout has to be
 * passthrough and each route group provides its own).
 *
 * Visually mirrors the (directory) layout: same sticky header with the
 * LocalGem wordmark, "All cities", "Merchants", and the auth badge. The
 * scout group is dynamic (auth-aware) — every page inside reads cookies,
 * either through the `<ScoutAuthBadge>` Client Component (client-side
 * fetch) or through `getCurrentScout()` (server-side, on individual
 * pages).
 *
 * No `revalidate` on this layout: it's inherently dynamic. The directory
 * layout pairs this same shell with the same Client `<ScoutAuthBadge>` to
 * stay statically renderable for ISR caching. Both layouts share
 * `<DirectoryHeader>` so the visual contract is one source of truth.
 */
export default function ScoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DirectoryHeader authBadge={<ScoutAuthBadge />} />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </body>
    </html>
  );
}
