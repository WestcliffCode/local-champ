'use server';

import config from '@payload-config';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';

import { getCurrentMerchant } from '@/lib/auth/merchant';
import {
  findExistingBusinessClaim,
  findUserByVerifiedPhone,
  getBusinessForClaim,
} from '@/lib/merchant-business';
import {
  checkVerification,
  consumeAttempt,
  startVerification,
  type VerificationChannel,
} from '@/lib/twilio/verify';

/**
 * State managed by `useActionState` in `<ClaimForm>`. Intentionally
 * minimal — channel + optional error is enough for the UI to render
 * the right stage. Phone and business id are derived server-side from
 * the form's `businessId` field on every action invocation.
 */
export type ClaimState =
  | { stage: 'confirm'; error?: string }
  | {
      stage: 'awaiting_code';
      channel: VerificationChannel;
      error?: string;
    };

/**
 * Server Action that drives the multi-stage merchant claim form.
 *
 * Single action handles three discrete transitions, distinguished by
 * the `action` field in the submitted form data:
 *
 *   - `start_voice`: kick off Voice OTP. Transitions state to
 *     `awaiting_code` with channel='call' on success, stays at
 *     `confirm` with an error on failure.
 *   - `start_sms`: kick off SMS OTP (the fallback path after 60s of
 *     no-answer on Voice). Transitions to `awaiting_code` with
 *     channel='sms' on success.
 *   - `submit_code`: validate the 6-digit code the merchant entered.
 *     On approval, updates Payload `users.business` +
 *     `users.verified_phone` via the Local API and redirects to
 *     `/admin`. On rejection, stays in `awaiting_code` with an error
 *     message.
 *
 * **Defense-in-depth re-checks at the top of every action:**
 *   - Auth: re-verifies session even though the layout already gates.
 *   - `users.business` empty: bounces already-claimed merchants to
 *     /admin, so a concurrent claim mid-flow is still safe.
 *   - Business existence + phone: re-derives from the DB so the action
 *     never trusts a form-supplied phone number.
 *   - Existing claim by another user: re-checks every action, in case
 *     someone finished concurrently between page render and submit.
 *   - **1:1 phone uniqueness (Step 6):** re-checks every action that
 *     touches Twilio, in case another user's `verified_phone` was set
 *     mid-flow. Returns to confirm/awaiting_code with a clear
 *     human-readable error.
 *   - **Per-user rate limit (Step 7):** consumes one attempt against
 *     a 5-per-15min window before each Twilio interaction. Counts both
 *     startVerification and checkVerification — bypassing by
 *     alternating channel + code submissions wouldn't work.
 */
export async function claimBusinessAction(
  prevState: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  // ---------- Read form fields ----------
  const action = formData.get('action');
  const businessId = formData.get('businessId');

  if (typeof businessId !== 'string' || businessId.length === 0) {
    return {
      stage: 'confirm',
      error: 'Missing business id. Refresh and try again.',
    };
  }

  // ---------- Defense-in-depth guards ----------
  const user = await getCurrentMerchant();
  if (!user) {
    redirect('/admin/login');
  }
  if (user.business) {
    // Concurrent claim somewhere — bounce to admin where they belong.
    redirect('/admin');
  }

  const business = await getBusinessForClaim(businessId);
  if (!business) {
    return {
      stage: 'confirm',
      error: 'Business not found. It may have been removed from the directory.',
    };
  }
  if (!business.phone) {
    return {
      stage: 'confirm',
      error: 'No phone on file for this business.',
    };
  }

  const existingClaim = await findExistingBusinessClaim(business.id);
  if (existingClaim) {
    return {
      stage: 'confirm',
      error: 'This business was just claimed by another account.',
    };
  }

  // Helper: previous channel for staying-on-same-stage error returns.
  const prevChannel: VerificationChannel =
    prevState.stage === 'awaiting_code' ? prevState.channel : 'call';

  // Helper: build an error response that preserves the user's current
  // visual stage. Used by both the rate limit and the phone-uniqueness
  // checks below, plus general error paths.
  const errorAtCurrentStage = (message: string): ClaimState =>
    prevState.stage === 'awaiting_code'
      ? { stage: 'awaiting_code', channel: prevChannel, error: message }
      : { stage: 'confirm', error: message };

  // ---------- Step 6: 1:1 phone uniqueness ----------
  // Re-check before EVERY Twilio interaction so a race between this
  // user's flow and another user's claim is caught at every stage.
  const phoneOwner = await findUserByVerifiedPhone(business.phone, user.id);
  if (phoneOwner) {
    return errorAtCurrentStage(
      'This phone number is already linked to another LocalChamp account. If you believe this is in error, contact support.',
    );
  }

  // ---------- Step 7: per-user rate limit ----------
  // Consume one attempt before each Twilio call. The defense-in-depth
  // checks above run first because they're cheap and free of side
  // effects — no point burning rate-limit quota on a request that's
  // going to be rejected for tenancy reasons.
  if (
    action === 'start_voice' ||
    action === 'start_sms' ||
    action === 'submit_code'
  ) {
    const rate = consumeAttempt(user.id);
    if (!rate.ok) {
      const minutes = Math.max(1, Math.ceil(rate.resetInSeconds / 60));
      return errorAtCurrentStage(
        `Too many attempts. Please wait ${minutes} minute${minutes === 1 ? '' : 's'} before trying again.`,
      );
    }
  }

  // ---------- Dispatch on action ----------
  if (action === 'start_voice' || action === 'start_sms') {
    const channel: VerificationChannel =
      action === 'start_voice' ? 'call' : 'sms';

    const result = await startVerification(business.phone, channel);
    if (!result.ok) {
      // Voice failure: stay at confirm so the user can retry the call
      // button. SMS failure (only callable from awaiting_code via the
      // fallback): stay at awaiting_code with the previous channel.
      if (channel === 'call') {
        return {
          stage: 'confirm',
          error:
            'We couldn\u2019t place the call. Please try again in a moment.',
        };
      }
      return {
        stage: 'awaiting_code',
        channel: prevChannel,
        error: 'Couldn\u2019t send the SMS either. Please try again shortly.',
      };
    }

    return { stage: 'awaiting_code', channel };
  }

  if (action === 'submit_code') {
    const code = formData.get('code');
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return {
        stage: 'awaiting_code',
        channel: prevChannel,
        error: 'Please enter the 6-digit code we sent.',
      };
    }

    const check = await checkVerification(business.phone, code);
    if (!check.approved) {
      return {
        stage: 'awaiting_code',
        channel: prevChannel,
        error:
          check.status === 'pending'
            ? 'That code didn\u2019t match. Please double-check and try again.'
            : 'Verification failed. Please request a new code.',
      };
    }

    // Approved! Link the merchant to the business and store the
    // verified phone via Payload's Local API. The write bypasses the
    // field-level access on `verified_phone` (admin-only) by design —
    // Local API runs as the system, which is exactly the privileged
    // server path our Architectural Decision #6 sanctions.
    const payload = await getPayload({ config });
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        business: business.id,
        verified_phone: business.phone,
      },
    });

    redirect('/admin');
  }

  // Unknown action — preserve previous state, surface a generic error.
  return errorAtCurrentStage('Unknown action. Please refresh the page.');
}
