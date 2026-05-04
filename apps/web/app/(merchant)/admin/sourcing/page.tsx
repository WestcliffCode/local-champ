import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { alias, db, eq, schema } from '@localgem/db';
import { getCurrentMerchant } from '@/lib/auth/merchant';
import { SourcingEdgeRow } from './sourcing-row';

export const metadata: Metadata = {
  title: 'Sourcing Verification · LocalGem Admin',
};

/**
 * Admin-only sourcing verification page.
 *
 * Lists all sourcing edges with buyer/seller business names, verified status,
 * and verify/unverify toggle buttons. Only accessible to admin users.
 *
 * Lives under the (merchant) route group which uses Payload CMS auth.
 */
export default async function AdminSourcingPage() {
  const user = await getCurrentMerchant();
  if (!user || (user as { role?: string }).role !== 'admin') {
    redirect('/admin/login');
  }

  const { sourcing, businesses } = schema;
  const buyer = alias(businesses, 'buyer');
  const seller = alias(businesses, 'seller');

  const edges = await db
    .select({
      id: sourcing.id,
      buyerId: sourcing.buyerId,
      sellerId: sourcing.sellerId,
      verified: sourcing.verified,
      createdAt: sourcing.createdAt,
      verifiedAt: sourcing.verifiedAt,
      buyerName: buyer.name,
      sellerName: seller.name,
    })
    .from(sourcing)
    .leftJoin(buyer, eq(sourcing.buyerId, buyer.id))
    .leftJoin(seller, eq(sourcing.sellerId, seller.id))
    .orderBy(sourcing.createdAt);

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sourcing Verification
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage B2B sourcing relationships. Verifying an edge awards both businesses
          +10 to their Local Loop score and updates their CPS.
        </p>
      </header>

      {edges.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          No sourcing edges in the system yet.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {edges.map((edge) => (
            <SourcingEdgeRow
              key={edge.id}
              id={edge.id}
              buyerName={edge.buyerName ?? 'Unknown'}
              sellerName={edge.sellerName ?? 'Unknown'}
              verified={edge.verified}
              verifiedAt={edge.verifiedAt?.toISOString() ?? null}
              createdAt={edge.createdAt.toISOString()}
            />
          ))}
        </div>
      )}
    </section>
  );
}
