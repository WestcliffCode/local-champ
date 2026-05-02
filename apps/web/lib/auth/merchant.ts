import config from '@payload-config';
import { headers as nextHeaders } from 'next/headers';
import { getPayload } from 'payload';
import { cache } from 'react';

import type { User } from '@/payload-types';

/**
 * Resolve the currently signed-in Payload user (merchant or admin), if any.
 *
 * Returns `null` for:
 *   - anonymous visitors (no Payload session cookie)
 *   - sessions whose token failed validation (expired, signature mismatch,
 *     etc.) — from the caller's perspective these collapse to "no session"
 *
 * Callers that require a guaranteed user (the `(merchant)/layout.tsx`
 * gate, the claim Server Actions) MUST handle the null case explicitly —
 * typically `redirect('/admin/login')`.
 *
 * **Wrapped in `React.cache()`:** identical rationale to `getCurrentScout`
 * in `lib/auth/scout.ts`. Within a single request, the layout and the
 * page (and any Server Actions invoked from the page) all need the
 * current user; without `cache()` each call would hit the Local API
 * round-trip independently. `cache()` is a request-scoped memoization
 * helper that deduplicates calls in the same render — ideal here because
 * the merchant's identity is immutable for the lifetime of a request.
 *
 * **Local API not REST:** `payload.auth({ headers })` reads the
 * `payload-token` cookie from the request headers and validates it
 * in-process. No HTTP round-trip, no extra latency, full Node-side trust
 * (no need for the public REST API to be exposed for this).
 *
 * **Why try/catch:** Payload's `auth()` typically returns `{ user: null }`
 * for anonymous requests rather than throwing, but token validation
 * failures (corrupted cookie, signing key rotation mid-flight) can
 * surface as exceptions. Treating any auth error as "no session" matches
 * the contract callers expect.
 */
export const getCurrentMerchant = cache(async (): Promise<User | null> => {
  try {
    const payload = await getPayload({ config });
    const headers = await nextHeaders();
    const { user } = await payload.auth({ headers });
    return user ?? null;
  } catch {
    return null;
  }
});
