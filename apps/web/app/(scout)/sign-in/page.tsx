import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ScoutAuthForm } from '@/components/scout-auth-form';
import { getCurrentScout } from '@/lib/auth/scout';

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to your LocalGem Scout account with a magic link — no password required.',
};

export default async function SignInPage() {
  // Already signed in? Skip the form and go straight to the profile.
  const scout = await getCurrentScout();
  if (scout) {
    redirect('/scout/profile');
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, scout.
        </h1>
        <p className="text-base text-muted-foreground">
          Enter your email and we&apos;ll send you a magic link to sign in.
        </p>
      </div>

      <div className="mt-10">
        <ScoutAuthForm mode="sign-in" />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to LocalGem?{' '}
        <Link
          href="/scout/sign-up"
          className="font-medium text-foreground underline underline-offset-2 hover:text-forest-green"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
