import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ScoutAuthForm } from '@/components/scout-auth-form';
import { getCurrentScout } from '@/lib/auth/scout';

export const metadata: Metadata = {
  title: 'Create your Scout account',
  description:
    'Join LocalGem as a Scout — discover, redeem, and champion the businesses that make your community.',
};

export default async function SignUpPage() {
  // Already have an account and signed in? Send them to their profile.
  const scout = await getCurrentScout();
  if (scout) {
    redirect('/scout/profile');
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Become a LocalGem scout.
        </h1>
        <p className="text-base text-muted-foreground">
          Champion the businesses that make your community. Redeem coupons,
          earn your badge, get out there.
        </p>
      </div>

      <div className="mt-10">
        <ScoutAuthForm mode="sign-up" />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already a scout?{' '}
        <Link
          href="/scout/sign-in"
          className="font-medium text-foreground underline underline-offset-2 hover:text-forest-green"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
