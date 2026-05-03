import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentScout } from '@/lib/auth/scout';
import { BADGE_THRESHOLDS } from '@localchamp/logic';
import { SignOutButton } from './sign-out-button';

export const metadata: Metadata = {
  title: 'Your profile',
};

const BADGE_LABELS: Record<string, string> = {
  none: 'No badge yet',
  bronze: 'Bronze · 5 redemptions',
  silver: 'Silver · 15 redemptions + 3 reviews',
  gold: 'Gold · 30 redemptions + 10 reviews',
};

/**
 * Compute the next badge tier and the progress description.
 */
function getBadgeProgress(currentBadge: string): {
  nextTier: string | null;
  description: string;
} {
  switch (currentBadge) {
    case 'none':
      return {
        nextTier: 'bronze',
        description: `Redeem ${BADGE_THRESHOLDS.bronze.completedRedemptions} coupons to earn your Bronze badge.`,
      };
    case 'bronze':
      return {
        nextTier: 'silver',
        description: `Reach ${BADGE_THRESHOLDS.silver.completedRedemptions} redemptions and ${BADGE_THRESHOLDS.silver.reviewsSubmitted} reviews to earn Silver.`,
      };
    case 'silver':
      return {
        nextTier: 'gold',
        description: `Reach ${BADGE_THRESHOLDS.gold.completedRedemptions} redemptions and ${BADGE_THRESHOLDS.gold.reviewsSubmitted} reviews to earn Gold.`,
      };
    case 'gold':
      return {
        nextTier: null,
        description: 'You have reached the highest tier. Thank you for being a LocalChamp!',
      };
    default:
      return { nextTier: null, description: '' };
  }
}

/** Map badge status to a display icon/label. */
const BADGE_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  none: { icon: '○', label: 'No Badge', color: 'text-muted-foreground' },
  bronze: { icon: '●', label: 'Bronze Scout', color: 'text-amber-700' },
  silver: { icon: '●', label: 'Silver Scout', color: 'text-gray-400' },
  gold: { icon: '●', label: 'Gold Scout', color: 'text-yellow-500' },
};

export default async function ScoutProfilePage() {
  const scout = await getCurrentScout();
  if (!scout) {
    redirect('/scout/sign-in');
  }

  const badgeLabel = BADGE_LABELS[scout.badgeStatus] ?? scout.badgeStatus;
  // `||` (not `??`) so a whitespace-only `fullName` (e.g. "   ") falls back to
  // the email local-part too — `trim()` would yield `""`, and `??` only
  // short-circuits on `null`/`undefined`, so we'd otherwise render "Welcome, .".
  const greetingName = scout.fullName?.trim() || scout.email.split('@')[0];
  const progress = getBadgeProgress(scout.badgeStatus);
  const badgeDisplay = BADGE_ICONS[scout.badgeStatus] ?? { icon: '○', label: 'Scout', color: 'text-muted-foreground' };

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

        <div className="mt-4 flex items-center gap-3">
          <span className={`text-3xl ${badgeDisplay.color}`} aria-hidden="true">
            {badgeDisplay.icon}
          </span>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {badgeDisplay.label}
            </p>
            <p className="text-sm text-muted-foreground">{badgeLabel}</p>
          </div>
        </div>

        {progress.description && (
          <p className="mt-4 text-sm text-muted-foreground">
            {progress.description}
          </p>
        )}
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Coming soon
        </h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>&mdash; Tap-to-redeem coupons (Phase 4)</li>
          <li>&mdash; Redemption history</li>
          <li>&mdash; Business reviews</li>
        </ul>
      </section>

      <div className="mt-12 border-t border-border pt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
