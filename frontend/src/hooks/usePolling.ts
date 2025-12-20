import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for polling with automatic cleanup and error handling
 * Prevents memory leaks and flickering from multiple intervals
 */
export const usePolling = (
  callback: () => Promise<void> | void,
  interval: number = 30000,
  enabled: boolean = true
) => {
  const savedCallback = useRef(callback);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const isRunning = useRef(false);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (!enabled) {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
      return;
    }

    const tick = async () => {
      // Prevent overlapping calls
      if (isRunning.current) {
        return;
      }

      isRunning.current = true;
      try {
        await savedCallback.current();
      } catch (error) {
        console.error('Polling error:', error);
      } finally {
        isRunning.current = false;
      }
    };

    // Run immediately
    tick();

    // Set up interval
    timeoutId.current = setInterval(tick, interval);

    return () => {
      if (timeoutId.current) {
        clearInterval(timeoutId.current);
        timeoutId.current = null;
      }
    };
  }, [interval, enabled]);

  // Manual trigger function
  const trigger = useCallback(async () => {
    if (!isRunning.current) {
      await savedCallback.current();
    }
  }, []);

  return { trigger };
};
