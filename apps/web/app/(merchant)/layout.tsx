import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { getCurrentMerchant } from '@/lib/auth/merchant';

import '../globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Merchant \u00b7 LocalChamp',
    template: '%s \u00b7 LocalChamp',
  },
  description:
    'Claim and manage your LocalChamp business listing. Voice OTP verification keeps merchant accounts trustworthy and 1:1.',
  // Merchant routes are auth-gated and not SEO-targeted \u2014 no value in indexing.
  robots: { index: false, follow: false },
};

/**
 * (merchant) route group layout.
 *
 * **Auth gate.** Every route inside `(merchant)` requires a Payload session
 * (merchant or admin role). Anonymous requests are redirected to
 * `/admin/login`. Both roles pass through \u2014 admins occasionally need to
 * walk through the claim flow on behalf of a merchant (e.g. concierge
 * onboarding for a high-value business), and there's no harm in giving
 * them access since their UI affordances stay the same.
 *
 * The auth check happens in the layout (not in each page) so the
 * assertion lives in exactly one place. Pages inside the group can call
 * `getCurrentMerchant()` again to pull the user object \u2014 React.cache()
 * deduplicates the Payload Local API round-trip across the layout +
 * page render in the same request.
 *
 * **Owns its own `<html><body>` shell** (per Workflow Gotcha #8 \u2014
 * Payload's RootLayout renders its own document tags, so the root
 * layout has to be passthrough and each route group provides its own).
 *
 * **Always dynamic.** Unavoidable given the per-request session check
 * \u2014 but also correct, because authenticated merchant content should
 * never be cacheable. No `revalidate` directive needed; the layout's
 * own dynamic call propagates to children.
 *
 * **Visual contract is utilitarian.** A minimal sticky header shows the
 * LocalChamp wordmark (linking back to `/admin` \u2014 the merchant's home)
 * and their email at the right edge. Pages provide their own headings
 * and chrome. The directory's `<DirectoryHeader>` is intentionally NOT
 * reused here \u2014 it points navigation back to the public directory,
 * which is the wrong affordance for a merchant deep in the claim flow.
 */
export default async function MerchantLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentMerchant();
  if (!user) {
    redirect('/admin/login');
  }

  return (
    <html lang="en">
      <body className="antialiased">
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="text-base font-semibold tracking-tight text-foreground hover:text-forest-green"
              >
                LocalChamp Merchant
              </Link>
              <nav className="flex items-center gap-4">
                <Link
                  href="/claim"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Claim
                </Link>
                <Link
                  href="/merchant/redemptions"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Redemptions
                </Link>
              </nav>
            </div>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </body>
    </html>
  );
}
