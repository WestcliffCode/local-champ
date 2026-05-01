import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentScout } from '@/lib/auth/scout';
import { SignOutButton } from './sign-out-button';

export const metadata: Metadata = {
  title: 'Your profile',
};

const BADGE_LABELS: Record<string, string> = {
  none: 'No badge yet',
  bronze: 'Bronze \u00b7 5 redemptions',
  silver: 'Silver \u00b7 15 redemptions, 3 different businesses',
  gold: 'Gold \u00b7 30 redemptions, 10 different businesses',
};

export default async function ScoutProfilePage() {
  const scout = await getCurrentScout();
  if (!scout) {
    redirect('/scout/sign-in');
  }

  const badgeLabel = BADGE_LABELS[scout.badgeStatus] ?? scout.badgeStatus;
  const greetingName = scout.fullName?.trim() ?? scout.email.split('@')[0];

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome, {greetingName}.
        </h1>
        <p className="text-sm text-muted-foreground">
          Signed in as <strong className="text-foreground">{scout.email}</strong>.
        </p>
      </header>

      <section className="mt-10 rounded-md border border-border bg-muted/30 p-6">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Scout badge
        </h2>
        <p className="mt-3 text-lg font-semibold text-foreground">{badgeLabel}</p>
        {scout.badgeStatus === 'none' && (
          <p className="mt-2 text-sm text-muted-foreground">
            Redeem your first 5 coupons to earn your Bronze badge.
          </p>
        )}
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Coming soon
        </h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>\u2014 Tap-to-redeem coupons (Phase 4)</li>
          <li>\u2014 Redemption history</li>
          <li>\u2014 Business reviews</li>
        </ul>
      </section>

      <div className="mt-12 border-t border-border pt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
