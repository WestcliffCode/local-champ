import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { titleizeSlug } from '@localchamp/logic';

import { getCurrentMerchant } from '@/lib/auth/merchant';
import {
  findExistingBusinessClaim,
  getBusinessForClaim,
} from '@/lib/merchant-business';

import { ClaimForm } from './claim-form';

interface PageProps {
  params: Promise<{ business_id: string }>;
}

export const metadata: Metadata = {
  title: 'Verify your business',
  description:
    'Verify your business via Twilio Voice OTP to complete your LocalChamp merchant claim.',
};

/**
 * Mask all but the leading country-code digits and the last 4. Crude
 * E.164 masking that works for any country format. For US `+15555550100`
 * this renders as `+1******0100` — recognizable enough for the merchant
 * to confirm "yes that's mine" without leaking full numbers in case of
 * shoulder-surfing.
 */
function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return phone.slice(0, 2) + '*'.repeat(phone.length - 6) + phone.slice(-4);
}

/**
 * Step 2 of the merchant claim flow: verify the merchant via Twilio
 * Voice OTP and link their account to the business.
 *
 * **Server Component shell.** This file is responsible for:
 *   - Fetching the business by id and 404'ing on miss
 *   - Re-checking auth (layout already gates anonymous; this is defense
 *     in depth so TypeScript can narrow `user`)
 *   - Bouncing already-claimed merchants to /admin (same invariant as
 *     the search page)
 *   - Rejecting if the business is already claimed by another user
 *   - Rejecting if the business has no phone on file (claim is
 *     impossible without a number to call)
 *   - Rendering the multi-stage `<ClaimForm>` Client Component for the
 *     Twilio interaction
 *
 * The actual Twilio Verify dance lives in `<ClaimForm>` (Client
 * Component, needs `useActionState`) and `actions.ts` (Server Actions
 * invoked from the form). Keeping this shell as a Server Component lets
 * us do the auth + tenancy checks server-side without client-side
 * state, then hand off narrow trusted props to the form.
 */
export default async function ClaimBusinessPage({ params }: PageProps) {
  const { business_id } = await params;

  const user = await getCurrentMerchant();
  // Layout already redirected, but TypeScript doesn't know that across
  // the boundary. Re-check so `user` narrows.
  if (!user) {
    redirect('/admin/login');
  }
  // Already claimed (also covered at the search page; defense in depth).
  if (user.business) {
    redirect('/admin');
  }

  const business = await getBusinessForClaim(business_id);
  if (!business) {
    notFound();
  }

  const existingClaim = await findExistingBusinessClaim(business.id);
  if (existingClaim) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Already claimed
          </h1>
          <p className="mt-2 text-muted-foreground">
            <span className="font-semibold">{business.name}</span> in{' '}
            {titleizeSlug(business.citySlug)} is already claimed by another
            account.
          </p>
        </header>
        <div className="rounded-md border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          <p>
            If you believe this is your business and the existing claim is
            incorrect,{' '}
            <a
              href="mailto:hello@localchamp.com"
              className="underline underline-offset-2 hover:text-foreground"
            >
              email us
            </a>{' '}
            and we&rsquo;ll investigate.
          </p>
          <p className="mt-4">
            <Link
              href="/merchant/claim"
              className="text-foreground hover:underline"
            >
              &larr; Search for a different business
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (!business.phone) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            No phone on file
          </h1>
          <p className="mt-2 text-muted-foreground">
            <span className="font-semibold">{business.name}</span>{' '}
            doesn&rsquo;t have a phone number listed in our directory yet, so
            we can&rsquo;t verify ownership via Twilio Voice OTP.
          </p>
        </header>
        <div className="rounded-md border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          <p>
            <a
              href="mailto:hello@localchamp.com"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Email us
            </a>{' '}
            with proof of ownership and we&rsquo;ll add the phone number, then
            you can come back here to claim.
          </p>
          <p className="mt-4">
            <Link
              href="/merchant/claim"
              className="text-foreground hover:underline"
            >
              &larr; Search for a different business
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Happy path: render the multi-stage verification form.
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Verify <span className="text-forest-green">{business.name}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          {titleizeSlug(business.citySlug)} &middot;{' '}
          {titleizeSlug(business.categorySlug)}
        </p>
      </header>

      <ClaimForm
        businessId={business.id}
        businessName={business.name}
        maskedPhone={maskPhone(business.phone)}
      />

      <p className="mt-8 text-xs text-muted-foreground">
        <Link
          href="/merchant/claim"
          className="hover:text-foreground hover:underline"
        >
          &larr; Search for a different business
        </Link>
      </p>
    </div>
  );
}
