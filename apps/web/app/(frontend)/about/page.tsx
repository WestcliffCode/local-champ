import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description:
    'LocalGem is a community-first directory of verified local businesses. Learn about our mission, how the platform works, and the team behind it.',
  openGraph: {
    title: 'About LocalGem',
    description:
      'A community-first directory that connects neighbors to verified local businesses through Scout-curated listings, tap-to-redeem coupons, and a badge program that rewards showing up.',
  },
};

/**
 * `/about` — static marketing page.
 *
 * Sections:
 *   1. Hero — mission statement
 *   2. How it works — three-column explainer (Scouts, Businesses, Community)
 *   3. Founder blurb — placeholder for later personalization
 *   4. CTA + footer
 *
 * Lives in the (frontend) route group alongside the home page. Uses the same
 * design tokens (forest-green, cream, charcoal) and section rhythm
 * (px-6 py-12 sm:py-16, max-w-6xl containers) established on the home page.
 */
export default function AboutPage() {
  return (
    <main>
      {/* ── Lightweight nav (matches DirectoryHeader visuals) ──────────── */}
      <header className="border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-foreground hover:text-forest-green"
          >
            LocalGem
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href={'/' as Route} className="transition-colors hover:text-foreground">
              Home
            </Link>
            <a href="/admin" className="transition-colors hover:text-foreground">
              Merchants
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero: mission ─────────────────────────────────────────────── */}
      <section className="px-6 pb-16 pt-20 sm:pb-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-green">
            Our Mission
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Champion the businesses that make your neighborhood worth living in.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            LocalGem is a community-first directory where neighbors discover,
            verify, and reward the local businesses they believe in. No
            pay-to-play rankings. No anonymous reviews. Just real people backing
            real places.
          </p>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              Two tracks, one mission — scouts find the gems; merchants earn
              loyalty by giving back.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {/* Scouts */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-green/10 text-2xl">
                🔍
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">Scouts</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sign up, explore your city, and nominate the businesses you love.
                Every verified find earns you points toward your Scout Badge —
                proof that you know your neighborhood better than anyone.
              </p>
            </div>

            {/* Businesses */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-green/10 text-2xl">
                🏪
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">Businesses</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Claim your free listing, create tap-to-redeem coupons, and
                connect directly with the neighbors who champion you. No
                advertising fees — just authentic community engagement.
              </p>
            </div>

            {/* Community */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-green/10 text-2xl">
                🤝
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">Community</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The result is a living directory built by the people who actually
                live there. Listings are curated, not scraped. Recommendations
                are earned, not bought. Your city, championed by you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The story so far (founder placeholder) ────────────────────── */}
      <section className="border-t border-border px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-green">
              The Story So Far
            </p>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              Built by a neighbor, for neighbors
            </h2>
          </div>
          <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              LocalGem started with a simple frustration: the best places in
              town — the family-run bakery, the hardware store that actually
              helps you, the barber who remembers your name — were buried under
              algorithm-driven platforms that reward ad spend, not quality.
            </p>
            <p>
              We&apos;re building the opposite. A directory where every listing is
              vouched for by a real person in the community. Where businesses
              earn visibility through genuine engagement, not marketing budgets.
              And where showing up for your neighborhood is something worth
              celebrating.
            </p>
            <p className="text-sm italic text-muted-foreground/80">
              Founder bio and photo coming soon.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to champion your city?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start exploring local businesses in your area, or claim your listing
            if you own one.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={'/' as Route}
              className="inline-flex h-11 items-center justify-center rounded-md bg-forest-green px-8 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
            >
              Explore the directory
            </Link>
            <a
              href="/admin"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
            >
              I&apos;m a merchant
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LocalGem. All rights reserved.
        </div>
      </section>
    </main>
  );
}
