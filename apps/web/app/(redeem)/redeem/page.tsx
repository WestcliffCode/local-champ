import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { and, db, eq, schema } from '@localchamp/db';
import { createRedemptionToken } from '@localchamp/logic/redemption-token';
import { getCurrentScout } from '@/lib/auth/scout';

/**
 * `/redeem` entry point — Server Component.
 *
 * Flow:
 *   1. Read `?coupon=` search param
 *   2. Verify scout is authenticated (Supabase Auth via `getCurrentScout`)
 *   3. Fetch coupon from Drizzle to verify it exists + is active
 *   4. Check for existing pending redemption (prevent duplicates)
 *   5. Insert a new `redemptions` row (status: pending)
 *   6. Generate HMAC-signed token via `createRedemptionToken`
 *   7. Update the row with token + expiresAt
 *   8. Redirect to `/redeem/[token]`
 */
interface PageProps {
  searchParams: Promise<{ coupon?: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RedeemEntryPage({ searchParams }: PageProps) {
  const { coupon: couponId } = await searchParams;

  if (!couponId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Missing coupon</h1>
          <p className="mt-2 text-muted-foreground">
            No coupon was specified. Please go back and tap Redeem on a coupon card.
          </p>
        </div>
      </main>
    );
  }

  if (!UUID_RE.test(couponId)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Invalid coupon link</h1>
          <p className="mt-2 text-muted-foreground">
            The coupon ID is not valid. Please go back and tap Redeem on a coupon card.
          </p>
        </div>
      </main>
    );
  }

  // ── Auth check ───────────────────────────────────────────────────────────────
  const scout = await getCurrentScout();
  if (!scout) {
    redirect('/sign-in' as Route);
  }

  // ── Fetch coupon via Drizzle (Payload-owned table, introspected) ───
  const { coupons } = schema;
  const [coupon] = await db
    .select({
      id: coupons.id,
      title: coupons.title,
      isActive: coupons.isActive,
      requireConfirmation: coupons.requireConfirmation,
      businessId: coupons.businessId,
    })
    .from(coupons)
    .where(eq(coupons.id, couponId))
    .limit(1);

  if (!coupon || !coupon.isActive) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Coupon not found</h1>
          <p className="mt-2 text-muted-foreground">
            This coupon does not exist or is no longer active.
          </p>
        </div>
      </main>
    );
  }

  // ── Duplicate check — prevent re-creating a pending redemption ─────
  const { redemptions } = schema;
  const [existing] = await db
    .select({ id: redemptions.id, token: redemptions.token })
    .from(redemptions)
    .where(
      and(
        eq(redemptions.scoutId, scout.id),
        eq(redemptions.couponId, couponId),
        eq(redemptions.status, 'pending'),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.token) {
      redirect(`/redeem/${existing.token}` as Route);
    }
    // Pending row without token (crashed previous attempt) — reuse it
    const secret = process.env.PAYLOAD_SECRET;
    if (!secret) throw new Error('PAYLOAD_SECRET is not configured');

    const { token, expiresAt } = createRedemptionToken(scout.id, couponId, secret);

    await db
      .update(redemptions)
      .set({ token, expiresAt })
      .where(eq(redemptions.id, existing.id));

    redirect(`/redeem/${token}` as Route);
  }

  // ── Create redemption row ────────────────────────────────────────────────────
  const [row] = await db
    .insert(redemptions)
    .values({
      scoutId: scout.id,
      couponId,
      status: 'pending',
    })
    .returning({ id: redemptions.id });

  if (!row) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">
            Something went wrong creating the redemption. Please try again.
          </p>
        </div>
      </main>
    );
  }

  // ── Generate HMAC-stoken ─────────────────────────────────────────────────
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error('PAYLOAD_SECRET is not configured');

  const { token, expiresAt } = createRedemptionToken(scout.id, couponId, secret);

  // ── Attach token + expiry to the redemption row ───────────────────────────
  await db
    .update(redemptions)
    .set({ token, expiresAt })
    .where(eq(redemptions.id, row.id));

  // ── Redirect to countdown page ────────────────────────────────────────────────
  redirect(`/redeem/${token}` as Route);
}
