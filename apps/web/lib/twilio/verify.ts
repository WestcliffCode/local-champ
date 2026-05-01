import twilio from 'twilio';

import { requireEnv } from '../env';

/**
 * Twilio Verify v2 wrapper for the Phase 3 D3 Merchant Claim flow.
 *
 * Two operations:
 * - `startVerification(phone, channel)` — kick off a 6-digit OTP delivery.
 *   Default channel is `'call'` (Voice OTP) per the locked product decision
 *   in the handoff doc (2026-04-30). Voice is preferred because it's harder
 *   for a bot to programmatically receive than SMS, which is meaningful for
 *   the merchant-trust step. SMS is the fallback path, surfaced in the UI
 *   after ~60s of no-answer; the same function is invoked with
 *   `channel: 'sms'`.
 * - `checkVerification(phone, code)` — validate a 6-digit code submitted
 *   by the merchant. Returns `approved: true` only when Twilio's status is
 *   exactly `'approved'`.
 *
 * **Env vars** (set in Vercel for Production + Preview + Development per
 * Workflow Gotcha #9 in the handoff doc):
 *
 * - `TWILIO_ACCOUNT_SID` — Account SID from Twilio Console (`AC...`)
 * - `TWILIO_AUTH_TOKEN`  — Auth Token from Twilio Console
 * - `TWILIO_VERIFY_SERVICE_SID` — Service SID for the Verify Service
 *   (`VA...`)
 *
 * Reads at module load via `requireEnv()` (apps/web/lib/env.ts) so a
 * misconfigured deploy fails at boot with a clear error pointing at the
 * missing var, instead of throwing per-request later. Mirrors the pattern
 * in `lib/supabase/server.ts`, `proxy.ts`, and `payload.config.ts`
 * (Architectural Decision #6).
 *
 * **Why a thin wrapper rather than calling the SDK directly:**
 * - Centralises env validation in one place.
 * - Returns a discriminated union (`ok` / `approved`) so call sites do not
 *   touch raw provider error objects — safer for surfacing stable error
 *   codes in redirects (same pattern as the D2 magic-link callback).
 * - Easy to extend with rate limiting (Step 7 of the D3 plan) without
 *   touching call sites.
 */

const TWILIO_ACCOUNT_SID = requireEnv(
  'TWILIO_ACCOUNT_SID',
  'Set it in Vercel env for Production + Preview + Development (Workflow Gotcha #9).',
);
const TWILIO_AUTH_TOKEN = requireEnv(
  'TWILIO_AUTH_TOKEN',
  'Set it in Vercel env for Production + Preview + Development (Workflow Gotcha #9).',
);
const TWILIO_VERIFY_SERVICE_SID = requireEnv(
  'TWILIO_VERIFY_SERVICE_SID',
  'Set it in Vercel env for Production + Preview + Development (Workflow Gotcha #9).',
);

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const verifyService = twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID);

/**
 * Channel for OTP delivery. `'call'` triggers a Voice call that reads the
 * code aloud; `'sms'` triggers a text message. Twilio Verify supports more
 * channels (email, whatsapp, etc.) but the merchant-claim flow only uses
 * these two per the locked decision.
 */
export type VerificationChannel = 'call' | 'sms';

export type StartVerificationResult =
  | { ok: true; status: 'pending' | 'sent'; sid: string }
  | { ok: false; status: 'error'; message: string; code?: string };

export type CheckVerificationResult =
  | { approved: true; status: 'approved' }
  | { approved: false; status: string; message?: string };

/**
 * Start a verification by sending a 6-digit code to `phone` over `channel`.
 *
 * @param phone   E.164 phone number (e.g. `+15555550100`)
 * @param channel `'call'` (default) or `'sms'`
 */
export async function startVerification(
  phone: string,
  channel: VerificationChannel = 'call',
): Promise<StartVerificationResult> {
  try {
    const verification = await verifyService.verifications.create({
      to: phone,
      channel,
    });

    // Twilio reports `'pending'` after the request is queued. The narrower
    // `'sent'` status is reserved for SMS in some configurations; we treat
    // both as a successful start.
    return {
      ok: true,
      status: verification.status === 'pending' ? 'pending' : 'sent',
      sid: verification.sid,
    };
  } catch (err) {
    // Twilio errors carry a numeric `code` and a `message`. Capture both
    // so the caller can map known codes (e.g. invalid phone, throttled)
    // to stable UI strings without leaking provider internals.
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code: unknown }).code)
        : undefined;
    const message =
      err instanceof Error ? err.message : 'Failed to start verification.';

    return { ok: false, status: 'error', message, code };
  }
}

/**
 * Check a 6-digit code submitted by the merchant.
 *
 * @param phone E.164 phone number (must match the one used in
 *              `startVerification`)
 * @param code  6-digit code received via call or SMS
 */
export async function checkVerification(
  phone: string,
  code: string,
): Promise<CheckVerificationResult> {
  try {
    const check = await verifyService.verificationChecks.create({
      to: phone,
      code,
    });

    if (check.status === 'approved') {
      return { approved: true, status: 'approved' };
    }

    return { approved: false, status: check.status };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to check verification.';
    return { approved: false, status: 'error', message };
  }
}
