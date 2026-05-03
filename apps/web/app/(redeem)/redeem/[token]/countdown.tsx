'use client';

import { useEffect, useState } from 'react';
import { completeRedemption } from './actions';

interface CountdownProps {
  expiresAt: string; // ISO date string
  displayCode: string;
  autoComplete: boolean; // true for self-serve, false for require_confirmation
  redemptionId: string;
}

export function RedemptionCountdown({
  expiresAt,
  displayCode,
  autoComplete,
  redemptionId,
}: CountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 1000));
  });
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the already-expired case before the interval starts
    const initialDiff = new Date(expiresAt).getTime() - Date.now();
    if (initialDiff <= 0) {
      if (autoComplete && !completed) {
        completeRedemption(redemptionId)
          .then((result) => {
            if (result.success) setCompleted(true);
            else setError(result.error ?? 'Failed to complete redemption');
          })
          .catch(() => setError('Network error — please refresh'));
      }
      return;
    }

    const timer = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const remaining = Math.max(0, Math.ceil(diff / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (autoComplete) {
          // Self-serve: mark as completed via server action
          completeRedemption(redemptionId)
            .then((result) => {
              if (result.success) {
                setCompleted(true);
              } else {
                setError(result.error ?? 'Failed to complete redemption');
              }
            })
            .catch(() => setError('Network error — please refresh'));
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, autoComplete, redemptionId]); // NO secondsLeft

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = secondsLeft / 300; // 300 = 5 min

  if (completed) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-2xl font-bold text-forest-green">Redeemed!</div>
        <p className="text-muted-foreground">Show this screen to the cashier.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-xl font-bold text-red-600">Error</div>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Animated gradient background container */}
      <div
        className="relative flex h-48 w-48 items-center justify-center rounded-2xl shadow-lg"
        style={{
          background: `linear-gradient(135deg, #0C401E, #314245, #0C401E)`,
          backgroundSize: '400% 400%',
          animation: 'gradientShift 3s ease infinite',
        }}
      >
        <span className="text-4xl font-mono font-bold tracking-[0.3em] text-cream">
          {displayCode}
        </span>
      </div>

      {/* Countdown */}
      <div className="text-center">
        <div className="text-3xl font-mono font-bold tabular-nums text-foreground">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {secondsLeft > 0
            ? 'Show this screen to the cashier'
            : autoComplete
              ? 'Redemption complete'
              : 'Redemption window closed — contact the merchant'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-forest-green transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
