import type { Metadata } from 'next';
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { and, db, eq, gt, desc, schema, sql } from '@localchamp/db';
import { getCurrentMerchant } from '@/lib/auth/merchant';
import { confirmRedemption } from './actions';

export const metadata: Metadata = {
  title: 'Redemptions',
};

/**
 * `/merchant/redemptions` — merchant-facing redemption confirmation queue.
 *
 * Server Component that:
 *   1. Authenticates the merchant via Payload session
 *   2. Queries pending redemptions for the merchant's claimed business
 *   3. Queries recently completed redemptions (last 24h) for the "Recent" section
 *   4. Renders a confirmation queue with display codes and "Confirm" buttons
 *
 * Each "Confirm" button is a `<form>` that calls the `confirmRedemption`
 * server action. Progressive enhancement: works without JavaScript.
 */
export default async function MerchantRedemptionsPage() {
  const user = await getCurrentMerchant();
  if (!user) {
    redirect('/admin/login' as Route);
  }
  if (!user.business) {
    redirect('/claim' as Route);
  }

  const businessId =
    typeof user.business === 'string' ? user.business : user.business.id;

  const { redemptions, coupons, scouts } = schema;

  // ── Pending redemptions for this business ─────────────────────────────────
  const pendingRows = await db
    .select({
      id: redemptions.id,
      token: redemptions.token,
      expiresAt: redemptions.expiresAt,
      createdAt: redemptions.createdAt,
      scoutEmail: scouts.email,
      couponTitle: coupons.title,
    })
    .from(redemptions)
    .innerJoin(coupons, eq(redemptions.couponId, coupons.id))
    .innerJoin(scouts, eq(redemptions.scoutId, scouts.id))
    .where(
      and(
        eq(coupons.businessId, businessId),
        eq(redemptions.status, 'pending'),
      ),
    )
    .orderBy(desc(redemptions.createdAt));

  // ── Recently completed (last 24h) ────────────────────────────────────────
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentRows = await db
    .select({
      id: redemptions.id,
      token: redemptions.token,
      completedAt: redemptions.completedAt,
      scoutEmail: scouts.email,
      couponTitle: coupons.title,
    })
    .from(redemptions)
    .innerJoin(coupons, eq(redemptions.couponId, coupons.id))
    .innerJoin(scouts, eq(redemptions.scoutId, scouts.id))
    .where(
      and(
        eq(coupons.businessId, businessId),
        eq(redemptions.status, 'completed'),
        gt(redemptions.completedAt, twentyFourHoursAgo),
      ),
    )
    .orderBy(desc(redemptions.completedAt));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Redemptions
        </h1>
        <p className="mt-2 text-muted-foreground">
          Confirm in-store coupon redemptions for your customers.
        </p>
      </header>

      {/* ── Pending Section ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Pending confirmation
        </h2>

        {pendingRows.length === 0 ? (
          <div className="mt-4 rounded-md border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            No pending redemptions
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-md border border-border bg-card">
            {pendingRows.map((r) => {
              const displayCode = r.token
                ? r.token.slice(r.token.indexOf('.') + 1, r.token.indexOf('.') + 7).toUpperCase()
                : '------';
              const expiresAt = r.expiresAt ? new Date(r.expiresAt) : null;
              const now = new Date();
              const secondsLeft = expiresAt
                ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000))
                : 0;
              const minutes = Math.floor(secondsLeft / 60);
              const seconds = secondsLeft % 60;
              const expired = expiresAt !== null && secondsLeft === 0;

              return (
                <li key={r.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold tracking-wider text-forest-green">
                        {displayCode}
                      </span>
                      <span className="truncate text-sm font-semibold text-foreground">
                        {r.couponTitle}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.scoutEmail}
                      {secondsLeft > 0 && (
                        <>
                          {' '}
                          &middot; {minutes}:{seconds.toString().padStart(2, '0')} remaining
                        </>
                      )}
                      {expired && (
                        <>
                          {' '}
                          &middot;{' '}
                          <span className="text-red-600">Expired</span>
                        </>
                      )}
                    </div>
                  </div>
                  <form
                    action={async () => {
                      'use server';
                      await confirmRedemption(r.id);
                    }}
                  >
                    <button
                      type="submit"
                      disabled={expired}
                      className="h-9 rounded-md bg-forest-green px-4 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Recent Section ────────────────────────────────────────────────────── */}
      {recentRows.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Recently completed (last 24h)
          </h2>
          <ul className="mt-4 divide-y divide-border rounded-md border border-border bg-card">
            {recentRows.map((r) => {
              const displayCode = r.token
                ? r.token.slice(r.token.indexOf('.') + 1, r.token.indexOf('.') + 7).toUpperCase()
                : '------';
              return (
                <li key={r.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold tracking-wider text-muted-foreground">
                        {displayCode}
                      </span>
                      <span className="truncate text-sm text-foreground">
                        {r.couponTitle}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.scoutEmail}
                      {r.completedAt && (
                        <>
                          {' '}
                          &middot; completed{' '}
                          {new Date(r.completedAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Done
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
