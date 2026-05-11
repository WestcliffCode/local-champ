import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';

export const metadata: Metadata = {
  title: 'For Merchants',
  description:
    'Claim your free LocalGem listing, create tap-to-redeem coupons, and connect with the neighbors who champion your business. No advertising fees.',
  openGraph: {
    title: 'LocalGem for Merchants',
    description:
      'Free verified listing, tap-to-redeem coupons, and real community engagement. No ads, no commissions — just neighbors backing your business.',
  },
};

/**
 * `/for-merchants` — marketing page targeted at business owners.
 *
 * Sections:
 *   1. Hero — value prop headline + subtext
 *   2. Why LocalGem — three-column benefit cards
 *   3. How claiming works — step-by-step flow
 *   4. Coupons & redemptions explainer
 *   5. CTA + footer
 *
 * Lives in the (frontend) route group alongside the home and about pages.
 * Same design tokens and section rhythm as the rest of the marketing site.
 */
export default function ForMerchantsPage() {
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
            <Link href={'/about' as Route} className="transition-colors hover:text-foreground">
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-16 pt-20 sm:pb-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-green">
            For Merchants
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your neighbors are already looking for you.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            LocalGem connects local businesses with the community members who
            actually care. Claim your free listing, create coupons, and let the
            people who love your business bring in the people who will.
          </p>
          <div className="mt-8">
            <a
              href="/admin"
              className="inline-flex h-11 items-center justify-center rounded-md bg-forest-green px-8 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
            >
              Claim your listing
            </a>
          </div>
        </div>
      </section>

      {/* ── Why LocalGem ──────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Why merchants choose LocalGem
            </h2>
            <p className="mt-3 text-muted-foreground">
              No ads, no commissions, no algorithms. Just authentic community
              engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-green/10 text-2xl">
                ✓
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">
                Free verified listing
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Your business gets a dedicated page in the directory with your
                name, address, hours, and category — verified by phone so
                customers know it&apos;s real.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-green/10 text-2xl">
                🎟️
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">
                Tap-to-redeem coupons
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Create exclusive offers that customers redeem in-store with a
                live countdown screen. No paper, no codes — just a tap on their
                phone while they&apos;re at your counter.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-green/10 text-2xl">
                📊
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">
                Real engagement data
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                See who&apos;s redeeming your coupons and how your community
                engagement grows. No vanity metrics — just real foot traffic
                from real neighbors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How to claim ──────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-green">
              Getting Started
            </p>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              Claim your listing in three steps
            </h2>
            <p className="mt-3 text-muted-foreground">
              The whole process takes about two minutes.
            </p>
          </div>

          <ol className="mt-10 space-y-8">
            <li className="flex gap-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-green text-sm font-bold text-cream">
                1
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Create your merchant account
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Head to the merchant portal and sign up with your email and a
                  password. This is your admin account for managing your listing
                  and coupons.
                </p>
              </div>
            </li>

            <li className="flex gap-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-green text-sm font-bold text-cream">
                2
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Find and claim your business
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Search for your business by name. When you find it, we&apos;ll
                  call the phone number on file with a verification code. Enter
                  the code to prove you&apos;re the owner — that&apos;s it.
                </p>
              </div>
            </li>

            <li className="flex gap-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-green text-sm font-bold text-cream">
                3
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Start creating coupons
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Once verified, you can update your listing details and create
                  tap-to-redeem coupons. Set your own discount, write the terms,
                  and choose whether redemptions auto-complete or require your
                  confirmation.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ── Coupons & redemptions ─────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-green">
              Coupons
            </p>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              Redemptions that happen at your counter, not on a screen
            </h2>
          </div>

          <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              When a customer claims your coupon, they get a 5-minute countdown
              screen with a unique verification code. They show it to you at
              checkout — no printing, no screenshots, no forwarding to friends.
            </p>
            <p>
              You choose how redemptions work. In <strong className="text-foreground">self-serve
              mode</strong>, the coupon completes automatically when the timer
              runs out — perfect for simple discounts. In <strong className="text-foreground">confirmation
              mode</strong>, the redemption stays pending until you
              tap &ldquo;Confirm&rdquo; on your redemptions dashboard — ideal for
              higher-value offers where you want to verify the purchase first.
            </p>
            <p>
              Every redemption is tracked. You&apos;ll see who redeemed, when,
              and which coupons are driving the most foot traffic.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to connect with your community?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Claim your free listing and start creating coupons today. No credit
            card, no contracts, no catch.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/admin"
              className="inline-flex h-11 items-center justify-center rounded-md bg-forest-green px-8 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
            >
              Get started — it&apos;s free
            </a>
            <Link
              href={'/about' as Route}
              className="inline-flex h-11 items-center justify-center rounded-md border border-border px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
            >
              Learn more about LocalGem
            </Link>
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
