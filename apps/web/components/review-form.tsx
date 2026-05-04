'use client';

import { useEffect, useState, useTransition } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { submitReview } from '@/lib/scout-actions';

interface ReviewFormProps {
  businessId: string;
}

/**
 * Client-side review submission form with star rating.
 *
 * Auth-aware: checks Supabase session on mount. Shows "Sign in to review"
 * for unauthenticated visitors, or the rating form for signed-in scouts.
 *
 * This is a Client Component because:
 *   1. The (directory) route group must stay statically renderable (ISR)
 *   2. Auth state check requires the browser Supabase client
 *   3. Form interactivity (star selection, submission) needs client JS
 */
export function ReviewForm({ businessId }: ReviewFormProps) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'signed-in' | 'signed-out'>('loading');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    async function check() {
      const { data, error } = await supabase.auth.getClaims();
      if (cancelled) return;
      if (error || !data?.claims?.sub) {
        setAuthStatus('signed-out');
      } else {
        setAuthStatus('signed-in');
      }
    }

    check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setAuthStatus(session?.user ? 'signed-in' : 'signed-out');
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (authStatus === 'loading') {
    return null;
  }

  if (authStatus === 'signed-out') {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        <a href="/sign-in" className="font-medium text-foreground underline underline-offset-4 hover:text-forest-green">
          Sign in
        </a>{' '}
        to leave a review.
      </p>
    );
  }

  if (result?.success) {
    return (
      <div className="mt-4 rounded-md border border-forest-green/30 bg-forest-green/5 p-4 text-sm text-forest-green">
        Thanks for your review!
      </div>
    );
  }

  function handleSubmit() {
    if (rating === 0) return;
    startTransition(async () => {
      const res = await submitReview(businessId, rating, body || undefined);
      setResult(res);
    });
  }

  const displayRating = hoveredRating || rating;

  return (
    <div className="mt-4 space-y-4">
      {/* Star rating */}
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            aria-checked={rating === star}
            role="radio"
          >
            <svg
              className={`h-6 w-6 ${star <= displayRating ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground/40'}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {rating}/5
          </span>
        )}
      </div>

      {/* Body */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Tell others about your experience (optional)"
        rows={3}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* Error */}
      {result?.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || rating === 0}
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit review'}
      </button>
    </div>
  );
}
