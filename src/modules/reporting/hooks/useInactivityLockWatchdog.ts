import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInactivityLockWatchdogOptions {
  isLockedByCurrentUser: boolean;
  issueId: string | null;
  onAutoUnlock: () => void;
  idleWarningMs?: number; // Defaults to 59 minutes (3,540,000 ms)
  countdownDurationSec?: number; // Defaults to 60 seconds
}

export function useInactivityLockWatchdog({
  isLockedByCurrentUser,
  issueId,
  onAutoUnlock,
  idleWarningMs = 59 * 60 * 1000,
  countdownDurationSec = 60,
}: UseInactivityLockWatchdogOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(countdownDurationSec);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onAutoUnlockRef = useRef(onAutoUnlock);
  onAutoUnlockRef.current = onAutoUnlock;

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    setIsWarningOpen(true);
    setSecondsRemaining(countdownDurationSec);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    let remaining = countdownDurationSec;
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setIsWarningOpen(false);
        console.warn('[useInactivityLockWatchdog] Inactivity timeout reached 60 minutes. Executing auto-unlock.');
        onAutoUnlockRef.current();
      }
    }, 1000);
  }, [countdownDurationSec]);

  const resetIdleTimer = useCallback(() => {
    if (!isLockedByCurrentUser || !issueId) {
      clearAllTimers();
      setIsWarningOpen(false);
      return;
    }

    // If modal is not open, reset the 59-minute timer
    if (!isWarningOpen) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        startCountdown();
      }, idleWarningMs);
    }
  }, [isLockedByCurrentUser, issueId, isWarningOpen, idleWarningMs, startCountdown, clearAllTimers]);

  // Keep Working button handler
  const handleKeepWorking = useCallback(() => {
    clearAllTimers();
    setIsWarningOpen(false);
    setSecondsRemaining(countdownDurationSec);

    // Re-arm the 59-min idle timer
    idleTimerRef.current = setTimeout(() => {
      startCountdown();
    }, idleWarningMs);
  }, [clearAllTimers, countdownDurationSec, idleWarningMs, startCountdown]);

  // Immediate manual unlock from modal
  const handleManualUnlock = useCallback(() => {
    clearAllTimers();
    setIsWarningOpen(false);
    onAutoUnlockRef.current();
  }, [clearAllTimers]);

  // Activity listeners on user interaction
  useEffect(() => {
    if (!isLockedByCurrentUser || !issueId) {
      clearAllTimers();
      setIsWarningOpen(false);
      return;
    }

    // Arm initial idle timer
    idleTimerRef.current = setTimeout(() => {
      startCountdown();
    }, idleWarningMs);

    let lastInteraction = Date.now();
    const handleUserInteraction = () => {
      // Throttle interaction checks to once per 5 seconds
      const now = Date.now();
      if (now - lastInteraction < 5000) return;
      lastInteraction = now;

      // Only reset if modal is not currently prompting countdown
      if (!isWarningOpen) {
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
        idleTimerRef.current = setTimeout(() => {
          startCountdown();
        }, idleWarningMs);
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'input', 'focus'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    // Development & QA test helper
    if (typeof window !== 'undefined') {
      (window as any).__simulateInactivityWarning = () => {
        console.info('[useInactivityLockWatchdog] Manually simulating 59-minute inactivity warning');
        startCountdown();
      };
    }

    return () => {
      clearAllTimers();
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      if (typeof window !== 'undefined') {
        delete (window as any).__simulateInactivityWarning;
      }
    };
  }, [isLockedByCurrentUser, issueId, idleWarningMs, isWarningOpen, startCountdown, clearAllTimers]);

  return {
    isWarningOpen,
    secondsRemaining,
    handleKeepWorking,
    handleManualUnlock,
    resetIdleTimer,
  };
}
