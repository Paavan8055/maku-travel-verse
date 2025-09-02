import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

interface PaymentTimeoutConfig {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout?: () => void;
  onWarning?: (remainingMinutes: number) => void;
  autoCancel?: boolean;
}

interface PaymentTimeoutState {
  remainingTime: number;
  isWarning: boolean;
  isExpired: boolean;
  canExtend: boolean;
}

export const usePaymentTimeout = (
  paymentIntentId: string | null,
  config: PaymentTimeoutConfig = {}
) => {
  const {
    timeoutMinutes = 10,
    warningMinutes = 8,
    onTimeout,
    onWarning,
    autoCancel = true
  } = config;

  const { toast } = useToast();
  const [timeoutState, setTimeoutState] = useState<PaymentTimeoutState>({
    remainingTime: timeoutMinutes * 60,
    isWarning: false,
    isExpired: false,
    canExtend: true
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());
  const warningShownRef = useRef(false);

  // Reset timeout when payment intent changes
  useEffect(() => {
    if (paymentIntentId) {
      startTimeRef.current = Date.now();
      warningShownRef.current = false;
      setTimeoutState({
        remainingTime: timeoutMinutes * 60,
        isWarning: false,
        isExpired: false,
        canExtend: true
      });
    }
  }, [paymentIntentId, timeoutMinutes]);

  // Handle timeout expiration
  const handleTimeout = useCallback(async () => {
    logger.info('Payment timeout expired', { paymentIntentId });
    
    setTimeoutState(prev => ({ ...prev, isExpired: true, canExtend: false }));

    if (autoCancel && paymentIntentId) {
      try {
        // Cancel the payment intent via edge function
        await supabase.functions.invoke('cancel-payment-intent', {
          body: { paymentIntentId, reason: 'timeout' }
        });
        
        toast({
          title: "Session Expired",
          description: "Your payment session has expired. Please start over.",
          variant: "destructive"
        });
      } catch (error) {
        logger.error('Failed to cancel payment intent:', error);
      }
    }

    onTimeout?.();
  }, [paymentIntentId, autoCancel, onTimeout, toast]);

  // Main timeout countdown
  useEffect(() => {
    if (!paymentIntentId || timeoutState.isExpired) return;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, timeoutMinutes * 60 - elapsed);

      const isWarning = remaining <= warningMinutes * 60;
      const isExpired = remaining === 0;

      setTimeoutState(prev => ({
        ...prev,
        remainingTime: remaining,
        isWarning,
        isExpired
      }));

      // Show warning once
      if (isWarning && !warningShownRef.current) {
        warningShownRef.current = true;
        const remainingMinutes = Math.ceil(remaining / 60);
        
        toast({
          title: "Payment Session Expiring",
          description: `Your session will expire in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}. Complete payment soon!`,
          variant: "destructive"
        });
        
        onWarning?.(remainingMinutes);
      }

      // Handle expiration
      if (isExpired) {
        clearInterval(intervalRef.current);
        handleTimeout();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [paymentIntentId, timeoutMinutes, warningMinutes, timeoutState.isExpired, handleTimeout, onWarning, toast]);

  // Extend session
  const extendSession = useCallback((additionalMinutes: number = 5) => {
    if (!timeoutState.canExtend || timeoutState.isExpired) return false;

    const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    startTimeRef.current = Date.now() - Math.max(0, currentElapsed - additionalMinutes * 60) * 1000;
    warningShownRef.current = false;

    setTimeoutState(prev => ({
      ...prev,
      remainingTime: Math.min(prev.remainingTime + additionalMinutes * 60, timeoutMinutes * 60),
      isWarning: false
    }));

    toast({
      title: "Session Extended",
      description: `Added ${additionalMinutes} minutes to your payment session.`,
    });

    logger.info('Payment session extended', { paymentIntentId, additionalMinutes });
    return true;
  }, [timeoutState.canExtend, timeoutState.isExpired, timeoutMinutes, paymentIntentId, toast]);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...timeoutState,
    extendSession,
    formatTime: () => formatTime(timeoutState.remainingTime),
    timeoutMinutes,
    warningMinutes
  };
};