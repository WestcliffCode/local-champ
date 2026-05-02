/**
 * Redemption token utility — HMAC-SHA256 signed tokens for tap-to-redeem.
 *
 * Token payload: scoutId + couponId + expiresAt, signed with a secret.
 * The token is URL-safe base64. The 6-char display code is derived from
 * the first 6 chars of the hex digest for merchant visual verification.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Token TTL in milliseconds (5 minutes). */
export const REDEMPTION_TOKEN_TTL_MS = 5 * 60 * 1000;

export interface RedemptionTokenPayload {
  scoutId: string;
  couponId: string;
  expiresAt: number; // Unix epoch ms
}

export interface CreateTokenResult {
  token: string;
  displayCode: string;
  expiresAt: Date;
}

export type VerifyTokenResult =
  | {
      valid: true;
      scoutId: string;
      couponId: string;
      expiresAt: Date;
    }
  | {
      valid: false;
      reason: 'invalid' | 'expired';
    };

/**
 * Encode the payload as a URL-safe base64 string.
 */
function encodePayload(payload: RedemptionTokenPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Decode a URL-safe base64 payload string.
 */
function decodePayload(encoded: string): RedemptionTokenPayload | null {
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json);
    if (
      typeof parsed.scoutId === 'string' &&
      typeof parsed.couponId === 'string' &&
      typeof parsed.expiresAt === 'number'
    ) {
      return parsed as RedemptionTokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sign a payload with HMAC-SHA256.
 */
function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Create a signed redemption token.
 *
 * @param scoutId  The scout redeeming the coupon
 * @param couponId The coupon being redeemed
 * @param secret   HMAC signing secret (use PAYLOAD_SECRET or a dedicated secret)
 * @returns        { token, displayCode, expiresAt }
 */
export function createRedemptionToken(
  scoutId: string,
  couponId: string,
  secret: string,
): CreateTokenResult {
  const expiresAt = Date.now() + REDEMPTION_TOKEN_TTL_MS;
  const payload: RedemptionTokenPayload = { scoutId, couponId, expiresAt };
  const encoded = encodePayload(payload);
  const signature = sign(encoded, secret);
  const token = `${encoded}.${signature}`;

  // 6-char display code from the signature for merchant visual verification
  const displayCode = signature.slice(0, 6).toUpperCase();

  return {
    token,
    displayCode,
    expiresAt: new Date(expiresAt),
  };
}

/**
 * Verify a signed redemption token.
 *
 * @param token  The full token string (payload.signature)
 * @param secret The same HMAC secret used to create the token
 * @returns      { valid: true, scoutId, couponId, expiresAt } or { valid: false, reason }
 */
export function verifyRedemptionToken(
  token: string,
  secret: string,
): VerifyTokenResult {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return { valid: false, reason: 'invalid' };

  const encoded = token.slice(0, dotIndex);
  const providedSig = token.slice(dotIndex + 1);
  const expectedSig = sign(encoded, secret);

  // Timing-safe comparison to prevent timing attacks
  if (
    providedSig.length !== expectedSig.length ||
    !timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig))
  ) {
    return { valid: false, reason: 'invalid' };
  }

  const payload = decodePayload(encoded);
  if (!payload) return { valid: false, reason: 'invalid' };

  if (Date.now() > payload.expiresAt) {
    return { valid: false, reason: 'expired' };
  }

  return {
    valid: true,
    scoutId: payload.scoutId,
    couponId: payload.couponId,
    expiresAt: new Date(payload.expiresAt),
  };
}
