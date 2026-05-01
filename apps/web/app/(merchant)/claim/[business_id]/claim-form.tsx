'use client';

import { useActionState, useEffect, useState } from 'react';

import { claimBusinessAction, type ClaimState } from './actions';

const initialState: ClaimState = { stage: 'confirm' };

interface ClaimFormProps {
  businessId: string;
  businessName: string;
  maskedPhone: string;
}

/**
 * Multi-stage verification form for the Phase 3 D3 merchant claim flow.
 *
 * **Stages (driven by `useActionState`):**
 *
 *   - `confirm`: the merchant sees their business's masked phone,
 *     confirms it, and submits to start a Voice OTP verification. The
 *     Server Action transitions state to `awaiting_code` on success,
 *     or stays at `confirm` with an error message on failure.
 *   - `awaiting_code`: the merchant enters the 6-digit code they
 *     received. The Server Action checks it via Twilio Verify; on
 *     `approved` it updates the Payload user record and redirects to
 *     `/admin`. On rejection it stays in `awaiting_code` with an
 *     `error` set.
 *   - SMS fallback: after ~60s in `awaiting_code` with `channel='call'`,
 *     a "Try SMS instead" form-button appears. Submitting it calls the
 *     same Server Action with `action=start_sms`, which transitions
 *     state to `awaiting_code` with `channel='sms'`.
 *
 * State is intentionally minimal (`stage` + optional `channel` +
 * optional `error`). Phone, business id, and verification SID are NOT
 * carried in state — the Server Action re-derives whatever it needs
 * from the `businessId` formData and the current session, so we don't
 * leak verification metadata client-side.
 *
 * This is a Client Component because `useActionState` is client-only.
 * The page wrapper (`page.tsx`) does all the auth + tenancy work as a
 * Server Component before passing trusted, narrow props in.
 */
export function ClaimForm({
  businessId,
  businessName,
  maskedPhone,
}: ClaimFormProps) {
  const [state, formAction, isPending] = useActionState(
    claimBusinessAction,
    initialState,
  );

  if (state.stage === 'confirm') {
    return (
      <div>
        <div className="rounded-md border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Confirm your business phone
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We&rsquo;ll call{' '}
            <span className="font-semibold text-foreground">
              {maskedPhone}
            </span>{' '}
            and read you a 6-digit code to verify you control{' '}
            <span className="font-semibold text-foreground">
              {businessName}
            </span>
            .
          </p>
          <form action={formAction} className="mt-6 flex items-center gap-3">
            <input type="hidden" name="action" value="start_voice" />
            <input type="hidden" name="businessId" value={businessId} />
            <button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-md bg-forest-green px-5 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? 'Calling\u2026' : 'Call me with a code'}
            </button>
          </form>
        </div>
        {state.error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
      </div>
    );
  }

  // Stage: awaiting_code (call or sms)
  const channelLabel = state.channel === 'call' ? 'Calling' : 'Texting';
  const codeInstructions =
    state.channel === 'call'
      ? 'Listen for the 6-digit code, then enter it below.'
      : 'Enter the 6-digit code from the text message.';

  return (
    <div>
      <div className="rounded-md border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          {channelLabel} {maskedPhone}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{codeInstructions}</p>
        <form action={formAction} className="mt-6 flex items-center gap-3">
          <input type="hidden" name="action" value="submit_code" />
          <input type="hidden" name="businessId" value={businessId} />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            name="code"
            placeholder="123456"
            autoFocus
            required
            className="h-11 w-32 rounded-md border border-border bg-background px-4 text-center text-lg tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="6-digit verification code"
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-11 rounded-md bg-forest-green px-5 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? 'Verifying\u2026' : 'Verify'}
          </button>
        </form>
        {state.error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
      </div>

      {state.channel === 'call' && (
        <SmsFallback businessId={businessId} formAction={formAction} />
      )}
    </div>
  );
}

/**
 * Inline SMS fallback button. Hidden for the first 60s after a Voice
 * verification starts, then rendered so the merchant can switch
 * channels if the call didn't land.
 *
 * 60s matches the locked decision in the handoff doc. If we ever
 * shorten or lengthen it, change BOTH the constant here and the
 * description in the handoff doc to keep them in sync.
 */
function SmsFallback({
  businessId,
  formAction,
}: {
  businessId: string;
  formAction: (formData: FormData) => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60_000);
    return () => clearTimeout(t);
  }, []);

  if (!show) {
    return (
      <p className="mt-4 text-xs text-muted-foreground">
        Didn&rsquo;t get the call? An SMS option will appear in 60 seconds.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="action" value="start_sms" />
      <input type="hidden" name="businessId" value={businessId} />
      <button
        type="submit"
        className="text-sm text-foreground underline underline-offset-2 hover:text-forest-green"
      >
        Try SMS instead
      </button>
    </form>
  );
}
