'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../supabase/server';

/**
 * State shape returned by `signInWithMagicLink`. Drives the form's three UI
 * modes: idle (initial), sent (success — show "check your email"), error
 * (validation or Supabase API failure — show inline error).
 *
 * Discriminated by `status` so consumers can narrow without optional chaining.
 */
export type SignInState =
  | { status: 'idle' }
  | { status: 'sent'; email: string }
  | { status: 'error'; message: string };

/**
 * Send a magic-link email to the provided address.
 *
 * Designed for `useActionState` — the first parameter is the previous state
 * (we ignore it; the form is single-shot per submission). Returns the new
 * state which the form renders into one of three modes above.
 *
 * **Why no redirect on success:** magic-link auth is async — the user has to
 * leave to check their email and click the link. The form stays on
 * `/scout/sign-in` and shows a "Check your email" confirmation. The actual
 * sign-in completes when the user returns via `/scout/auth/callback`.
 *
 * **`emailRedirectTo`:** resolved from the request's `origin` header so this
 * works correctly across Vercel preview domains, the production alias, and
 * local dev. Falls back to `host` + `https` if `origin` is missing (some
 * proxies strip it).
 *
 * **Phone metadata (PR #28):** when the sign-up form includes an optional
 * phone number, we pass it through `options.data` which Supabase stores as
 * `user_metadata`. The auth callback reads it back and writes it to the
 * `scouts.phone` column during profile provisioning. This avoids extra
 * storage or cookies to bridge the async magic-link gap.
 *
 * **Error handling:** Supabase returns descriptive errors for invalid email,
 * rate-limiting, etc. We surface the raw `error.message` to the user. Not a
 * security issue — these errors don't leak whether an account exists (magic
 * link is the same UX for new and returning users).
 */
export async function signInWithMagicLink(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const rawEmail = formData.get('email');
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  if (!email) {
    return { status: 'error', message: 'Please enter your email address.' };
  }

  // Lightweight format check — Supabase will validate more thoroughly, but a
  // quick guard avoids round-tripping for obvious typos.
  if (!email.includes('@') || !email.includes('.')) {
    return { status: 'error', message: 'That doesn’t look like a valid email address.' };
  }

  // ── Optional phone from sign-up form ──────────────────────────────────
  // Sanitize to digits and leading `+` only. If the result isn't plausibly
  // E.164, we silently drop it rather than blocking sign-up — the phone is
  // optional and can be added later via the redemption nudge or profile.
  const rawPhone = formData.get('phone');
  let phone: string | undefined;
  if (typeof rawPhone === 'string' && rawPhone.trim()) {
    const sanitized = rawPhone.replace(/[\s\-()]/g, '');
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (e164Regex.test(sanitized)) {
      phone = sanitized;
    }
    // Invalid format → silently ignored (don't block account creation)
  }

  const headerList = await headers();
  const originHeader = headerList.get('origin');
  const hostHeader = headerList.get('host');
  const origin =
    originHeader ??
    (hostHeader
      ? `https://${hostHeader}`
      : (process.env.NEXT_PUBLIC_SITE_URL ?? null));

  if (!origin) {
    return {
      status: 'error',
      message: 'Unable to determine site URL for the magic link. Please try again.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/scout/auth/callback`,
      // Store phone in user_metadata so the auth callback can read it
      // back and persist to scouts.phone during profile provisioning.
      ...(phone ? { data: { phone } } : {}),
    },
  });

  if (error) {
    return { status: 'error', message: error.message };
  }

  return { status: 'sent', email };
}

/**
 * Sign the current scout out and redirect to the marketing home.
 *
 * Designed to be invoked from a `<form action={signOut}>` button. On success,
 * `redirect('/')` throws a NEXT_REDIRECT control-flow exception that Next's
 * runtime translates into a 303 See Other response. The browser follows the
 * Location header and lands on `/`.
 *
 * Even if `signOut()` errors (e.g. Supabase API down), we still redirect home
 * — the local cookies are cleared by `@supabase/ssr` regardless, and the
 * proxy's next-request refresh will reconcile the state.
 */
export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
