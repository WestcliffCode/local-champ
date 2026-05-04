'use client';

import { useTransition } from 'react';
import { verifySourcingEdge, unverifySourcingEdge } from '@/lib/admin-actions';
import { useRouter } from 'next/navigation';

interface SourcingEdgeRowProps {
  id: string;
  buyerName: string;
  sellerName: string;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

/**
 * A single sourcing edge row with verify/unverify toggle.
 *
 * Client Component because it needs:
 *   1. useTransition for pending state on the toggle button
 *   2. router.refresh() to update the server-rendered list after mutation
 */
export function SourcingEdgeRow({
  id,
  buyerName,
  sellerName,
  verified,
  verifiedAt,
  createdAt,
}: SourcingEdgeRowProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      if (verified) {
        await unverifySourcingEdge(id);
      } else {
        await verifySourcingEdge(id);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{buyerName}</span>
          <span className="text-xs text-muted-foreground">→</span>
          <span className="font-medium text-foreground">{sellerName}</span>
          {verified ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-forest-green/10 px-2 py-0.5 text-xs font-medium text-forest-green">
              Verified
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Unverified
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Created {new Date(createdAt).toLocaleDateString()}
          {verifiedAt && ` · Verified ${new Date(verifiedAt).toLocaleDateString()}`}
        </div>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`ml-4 inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${
          verified
            ? 'border border-border bg-background text-foreground hover:bg-muted'
            : 'bg-forest-green text-cream hover:opacity-90'
        }`}
      >
        {isPending ? '…' : verified ? 'Unverify' : 'Verify'}
      </button>
    </div>
  );
}
