import Link from 'next/link';
import type { Route } from 'next';
import { db, eq, schema } from '@localchamp/db';
import { verifyRedemptionToken } from '@localchamp/logic/redemption-token';
import { getCurrentScout } from '@/lib/auth/scout';
import { RedemptionCountdown } from './countdown';

/**
 * `/redeem/[token]` \u2014 countdown page.
 *
 * Server Component that:
 *   1. Verifies the HMAC-signed token
 *   2. Fetches the redemption row + coupon + business details
 *   3. Determines whether to show the phone nudge (scout has no phone on file)
 *   4. Renders the anti-screenshot countdown UI
 *
 * Dual-mode behavior controlled by `coupon.require_confirmation`:
 *   - self-serve (false): countdown auto-completes via server action
 *   - merchant-confirmed (true): stays pending until merchant confirms
 */
interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function RedeemTokenPage({ params }: PageProps) {
  const { token } = await params;

  // \u2500\u2500 Verify token (signature only \u2014 ignore expiry for now) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error('PAYLOAD_SECRET is not configured');

  const result = verifyRedemptionToken(token, secret);

  if (!result.valid && result.reason === 'invalid') {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Invalid redemption link</h1>
          <p className="mt-2 text-muted-foreground">
            This link is not valid. Please go back and try redeeming the coupon again.
          </p>
        </div>
      </main>
    );
  }

  // \u2500\u2500 Query redemption row by token (before expiry check) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // This lets us get couponId regardless of whether the token is expired.
  const { redemptions, coupons, businesses, scouts } = schema;
  const [redemption] = await db
    .select({ id: redemptions.id, status: redemptions.status, couponId: redemptions.couponId, scoutId: redemptions.scoutId })
    .from(redemptions)
    .where(eq(redemptions.token, token))
    .limit(1);

  if (!result.valid && result.reason === 'expired') {
    const expiredCouponId = redemption?.couponId;
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">This redemption has expired</h1>
          <p className="mt-3 text-muted-foreground">
            The 5-minute redemption window has closed.
          </p>
          <Link
            href={`/redeem${expiredCouponId ? `?coupon=${expiredCouponId}` : ''}` as Route}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-forest-green px-6 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
          >
            Try again
          </Link>
        </div>
      </main>
    );
  }

  // At this point result.valid === true
  const { couponId, expiresAt } = result as Extract<
    typeof result,
    { valid: true }
  >;

  if (!redemption) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Redemption not found</h1>
          <p className="mt-2 text-muted-foreground">
            We could not find a redemption matching this token.
          </p>
        </div>
      </main>
    );
  }

  if (redemption.status !== 'pending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Already Redeemed</h1>
        <p className="mt-3 text-muted-foreground">This coupon has already been redeemed.</p>
      </div>
    );
  }

  // \u2500\u2500 Fetch coupon + business details \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const [coupon] = await db
    .select({
      id: coupons.id,
      title: coupons.title,
      discountValue: coupons.discountValue,
      requireConfirmation: coupons.requireConfirmation,
      businessId: coupons.businessId,
    })
    .from(coupons)
    .where(eq(coupons.id, couponId))
    .limit(1);

  if (!coupon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Coupon Not Found</h1>
        <p className="mt-3 text-muted-foreground">This coupon may have been removed from the directory.</p>
      </div>
    );
  }

  const businessName = coupon.businessId
    ? await db
        .select({ name: businesses.name })
        .from(businesses)
        .where(eq(businesses.id, coupon.businessId))
        .limit(1)
        .then((rows) => rows[0]?.name ?? 'Unknown business')
    : 'Unknown business';

  // Derive the 6-char display code from the token signature
  const dotIndex = token.indexOf('.');
  const signature = dotIndex !== -1 ? token.slice(dotIndex + 1) : token;
  const displayCode = signature.slice(0, 6).toUpperCase();

  const autoComplete = !(coupon.requireConfirmation ?? false);

  // \u2500\u2500 Phone nudge: check if the scout has a phone on file \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // getCurrentScout() returns the Supabase auth user mapped to the scouts
  // table but the CurrentScout type doesn't include `phone`. Query the
  // scouts table directly using the scoutId from the redemption row.
  let showPhoneNudge = false;
  if (redemption.scoutId) {
    const [scoutRow] = await db
      .select({ phone: scouts.phone })
      .from(scouts)
      .where(eq(scouts.id, redemption.scoutId))
      .limit(1);
    showPhoneNudge = scoutRow ? !scoutRow.phone : false;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* Anti-screenshot CSS: animated gradient makes static captures useless */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `,
        }}
      />

      {/* Business + coupon info */}
      <div className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {businessName}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          {coupon.title ?? 'Coupon'}
        </h1>
        <p className="mt-1 text-lg font-semibold text-forest-green">
          {coupon.discountValue ?? ''}
        </p>
      </div>

      {/* Countdown client component */}
      <RedemptionCountdown
        expiresAt={expiresAt.toISOString()}
        displayCode={displayCode}
        autoComplete={autoComplete}
        redemptionId={redemption.id}
        showPhoneNudge={showPhoneNudge}
      />
    </main>
  );
}
