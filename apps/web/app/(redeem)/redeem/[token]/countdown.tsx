'use client';

import { useEffect, useState } from 'react';
import { completeRedemption, updateScoutPhone } from './actions';

interface CountdownProps {
  expiresAt: string; // ISO date string
  displayCode: string;
  autoComplete: boolean; // true for self-serve, false for require_confirmation
  redemptionId: string;
  showPhoneNudge: boolean;
}

export function RedemptionCountdown({
  expiresAt,
  displayCode,
  autoComplete,
  redemptionId,
  showPhoneNudge,
}: CountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 1000));
  });
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState('');
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneDismissed, setPhoneDismissed] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSaving, setPhoneSaving] = useState(false);

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
          .catch(() => setError('Network error \u2014 please refresh'));
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
            .catch(() => setError('Network error \u2014 please refresh'));
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, autoComplete, redemptionId]); // NO secondsLeft

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = secondsLeft / 300; // 300 = 5 min

  const handleSavePhone = async () => {
    setPhoneError(null);
    setPhoneSaving(true);
    try {
      const result = await updateScoutPhone(phoneValue);
      if (result.success) {
        setPhoneSaved(true);
      } else {
        setPhoneError(result.error ?? 'Failed to save phone number');
      }
    } catch {
      setPhoneError('Network error \u2014 please try again');
    } finally {
      setPhoneSaving(false);
    }
  };

  if (completed) {
    const shouldShowNudge =
      showPhoneNudge && !phoneSaved && !phoneDismissed;

    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-2xl font-bold text-forest-green">Redeemed!</div>
        <p className="text-muted-foreground">Show this screen to the cashier.</p>

        {shouldShowNudge && (
          <div className="mt-6 w-full max-w-sm rounded-lg border border-border bg-muted/30 p-5">
            <p className="text-sm font-semibold text-foreground">
              Add your phone number for faster redemptions next time
            </p>
            {phoneError && (
              <p className="mt-2 text-xs text-red-600">{phoneError}</p>
            )}
            <input
              type="tel"
              placeholder="+1 555 123 4567"
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              className="mt-3 h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Phone number"
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSavePhone}
                disabled={phoneSaving || !phoneValue.trim()}
                className="h-9 flex-1 rounded-md bg-forest-green text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {phoneSaving ? 'Saving\u2026' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setPhoneDismissed(true)}
                className="h-9 flex-1 rounded-md border border-border text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {phoneSaved && (
          <p className="mt-4 text-sm text-forest-green">
            Phone number saved. You are all set!
          </p>
        )}
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
              : 'Redemption window closed \u2014 contact the merchant'}
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
