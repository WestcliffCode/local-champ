'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type ScoutBadgeState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; email: string };

/**
 * Auth-aware badge for the directory header.
 *
 * **Why a Client Component:** the (directory) route group MUST stay
 * statically renderable for the pSEO pages' ISR caching to work. Calling
 * `getCurrentScout()` (or any cookie-reading helper) in
 * `(directory)/layout.tsx` would force the entire group to dynamic
 * rendering and defeat the caching strategy from PR #6 + #7.
 *
 * Solution: render the auth badge on the client, after hydration. Initial
 * SSR shows the "loading" placeholder (visually neutral), then hydration
 * resolves to either "Sign in" or "Welcome, {emailLocalPart}".
 *
 * **The brief flash from "loading" \u2192 "Welcome"** for already-signed-in
 * users is an accepted trade-off. The (scout) route group, which IS
 * dynamic and authenticated by nature, uses server-side `getCurrentScout()`
 * directly and shows the right state immediately.
 *
 * **Why getClaims() and not getUser():** local JWT validation via cached
 * JWKS, no network round-trip in steady state. Same reasoning as the
 * proxy.ts and lib/auth/scout.ts. See those files for the full rationale.
 *
 * **What this badge does NOT show:** the scout's `fullName` from the
 * scouts table. That column lives in Postgres, not in the JWT. Showing it
 * here would require an API endpoint and an extra round-trip. Email
 * local-part is good enough for the header \u2014 the full profile page
 * shows fullName when available.
 *
 * **Auth state subscription:** we also listen to `onAuthStateChange` so
 * the badge updates if the user signs out from another tab. Cleanup runs
 * on unmount.
 */
export function ScoutAuthBadge() {
  const [state, setState] = useState<ScoutBadgeState>({ status: 'loading' });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase.auth.getClaims();
      if (cancelled) return;
      if (error || !data?.claims?.email) {
        setState({ status: 'signed-out' });
        return;
      }
      setState({ status: 'signed-in', email: data.claims.email });
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const email = session?.user?.email;
      setState(email ? { status: 'signed-in', email } : { status: 'signed-out' });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Loading state \u2014 render an invisible placeholder of roughly the same
  // width as "Sign in" to avoid layout shift on hydration.
  if (state.status === 'loading') {
    return <span aria-hidden className="invisible select-none">Sign in</span>;
  }

  if (state.status === 'signed-out') {
    return (
      <Link href="/scout/sign-in" className="transition-colors hover:text-foreground">
        Sign in
      </Link>
    );
  }

  // Display the local-part of the email (chars before "@"). Keeps the
  // header compact; full email + name live on the profile page.
  const emailLocalPart = state.email.split('@')[0];
  return (
    <Link
      href="/scout/profile"
      className="transition-colors hover:text-foreground"
    >
      {emailLocalPart}
    </Link>
  );
}
