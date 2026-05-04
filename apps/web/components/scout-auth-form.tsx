'use client';

import { useActionState } from 'react';
import { Button, Input } from '@localgem/ui';
import { signInWithMagicLink, type SignInState } from '@/lib/auth/actions';

const INITIAL_STATE: SignInState = { status: 'idle' };

export interface ScoutAuthFormProps {
  /**
   * Drives copy. Functionally `sign-in` and `sign-up` are identical —
   * Supabase's `signInWithOtp` auto-creates the user if they don't exist.
   * The mode just changes button label and confirmation copy.
   */
  mode: 'sign-in' | 'sign-up';
}

/**
 * Email magic-link form, used by both `/scout/sign-in` and `/scout/sign-up`.
 *
 * **Three render states**, driven by the Server Action's return value
 * (`SignInState`):
 *   - `idle`     — show the email input + submit button
 *   - `sent`     — show "Check your email" confirmation
 *   - `error`    — show the email input + an inline error message
 *
 * **Why a Client Component:** `useActionState` is a client-only hook. The
 * page wrapper around this form is a Server Component that renders
 * static framing (heading, subtitle, etc.) and delegates the interactive
 * bit here.
 *
 * **No client-side email validation beyond `<input type="email" required>`**
 * — the Server Action does a stricter check (must contain `@` and `.`)
 * before calling Supabase, and Supabase itself rejects malformed emails
 * server-side. Layered validation, but the user only sees the
 * deepest-layer error message.
 *
 * **Pending state:** `useActionState`'s third return value is a boolean that
 * tracks whether the action is running. We disable the submit button + flip
 * its label to "Sending…" so the user gets immediate feedback during the
 * Supabase round-trip.
 */
export function ScoutAuthForm({ mode }: ScoutAuthFormProps) {
  const [state, formAction, pending] = useActionState(
    signInWithMagicLink,
    INITIAL_STATE,
  );

  if (state.status === 'sent') {
    return (
      <div
        role="status"
        className="rounded-md border border-border bg-muted/30 p-6 text-center"
      >
        <h2 className="text-lg font-semibold text-foreground">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a magic link to <strong className="text-foreground">{state.email}</strong>.
          {mode === 'sign-up'
            ? ' Click it to finish creating your Scout account.'
            : ' Click it to sign in.'}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          The link expires in an hour. Didn’t get it? Check spam, or refresh
          this page to send another.
        </p>
      </div>
    );
  }

  return (
    // No `noValidate` — we WANT the browser's native checks for `type="email"`
    // and `required` to fire. They give immediate feedback before any
    // round-trip. The Server Action does a stricter check (must contain `@`
    // AND `.`) as a backstop for browsers with lenient email validation, but
    // most users get instant native feedback for the common typos.
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium leading-none text-foreground"
        >
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          aria-describedby={state.status === 'error' ? 'email-error' : undefined}
          aria-invalid={state.status === 'error'}
        />
      </div>
      {state.status === 'error' && (
        <p
          id="email-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? 'Sending…'
          : mode === 'sign-up'
            ? 'Create my account'
            : 'Send magic link'}
      </Button>
    </form>
  );
}
