import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBookingTracking } from '@/hooks/useBookingTracking';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

interface RealTimeBookingState {
  bookingId?: string;
  status: string;
  progress: number;
  updates: BookingUpdate[];
  isConnected: boolean;
  lastUpdate?: Date;
}

interface BookingUpdate {
  id: string;
  type: 'status_change' | 'payment_update' | 'provider_response' | 'error';
  message: string;
  timestamp: Date;
  data?: any;
}

export const useRealTimeBooking = (bookingId?: string) => {
  const [realTimeState, setRealTimeState] = useState<RealTimeBookingState>({
    status: 'idle',
    progress: 0,
    updates: [],
    isConnected: false
  });

  const { trackStep, bookingState } = useBookingTracking(bookingId);
  const { toast } = useToast();

  // Subscribe to real-time booking updates
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          handleBookingUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_updates',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          handleBookingStatusUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          handlePaymentUpdate(payload);
        }
      )
      .subscribe((status) => {
        setRealTimeState(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED'
        }));

        if (status === 'SUBSCRIBED') {
          logger.info(`Real-time subscription active for booking ${bookingId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const handleBookingUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    logger.info('Real-time booking update received:', { eventType, newRecord, oldRecord });

    if (eventType === 'UPDATE' && newRecord.status !== oldRecord?.status) {
      const update: BookingUpdate = {
        id: `booking-${Date.now()}`,
        type: 'status_change',
        message: `Booking status changed from ${oldRecord?.status || 'unknown'} to ${newRecord.status}`,
        timestamp: new Date(),
        data: { previousStatus: oldRecord?.status, newStatus: newRecord.status }
      };

      setRealTimeState(prev => ({
        ...prev,
        status: newRecord.status,
        updates: [update, ...prev.updates.slice(0, 9)], // Keep last 10 updates
        lastUpdate: new Date()
      }));

      // Update booking tracker
      trackStep('confirmation', newRecord.status === 'confirmed' ? 'completed' : 'active', {
        bookingStatus: newRecord.status,
        bookingReference: newRecord.booking_reference
      });

      // Show user notification for important status changes
      if (['confirmed', 'cancelled', 'failed'].includes(newRecord.status)) {
        const statusMessages = {
          confirmed: 'Your booking has been confirmed!',
          cancelled: 'Your booking has been cancelled.',
          failed: 'There was an issue with your booking. Please contact support.'
        };

        toast({
          title: "Booking Update",
          description: statusMessages[newRecord.status as keyof typeof statusMessages],
          variant: newRecord.status === 'failed' ? 'destructive' : 'default'
        });
      }
    }
  }, [trackStep, toast]);

  const handleBookingStatusUpdate = useCallback((payload: any) => {
    const { new: newUpdate } = payload;
    
    const update: BookingUpdate = {
      id: newUpdate.id,
      type: newUpdate.update_type || 'status_change',
      message: newUpdate.message || 'Booking status updated',
      timestamp: new Date(newUpdate.created_at),
      data: newUpdate.metadata
    };

    setRealTimeState(prev => ({
      ...prev,
      updates: [update, ...prev.updates.slice(0, 9)],
      lastUpdate: new Date()
    }));

    // Show high-priority updates to user
    if (newUpdate.priority === 'high') {
      toast({
        title: newUpdate.title || "Booking Update",
        description: newUpdate.message,
        variant: newUpdate.update_type === 'error' ? 'destructive' : 'default'
      });
    }
  }, [toast]);

  const handlePaymentUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'UPDATE' && newRecord.status) {
      const update: BookingUpdate = {
        id: `payment-${Date.now()}`,
        type: 'payment_update',
        message: `Payment status: ${newRecord.status}`,
        timestamp: new Date(),
        data: { paymentStatus: newRecord.status, amount: newRecord.amount }
      };

      setRealTimeState(prev => ({
        ...prev,
        updates: [update, ...prev.updates.slice(0, 9)],
        lastUpdate: new Date()
      }));

      // Track payment step
      if (newRecord.status === 'succeeded') {
        trackStep('payment', 'completed', {
          paymentIntentId: newRecord.stripe_payment_intent_id,
          amount: newRecord.amount
        });
      } else if (newRecord.status === 'failed') {
        trackStep('payment', 'error', {
          error: 'Payment failed',
          paymentIntentId: newRecord.stripe_payment_intent_id
        });
      }
    }
  }, [trackStep]);

  // Manual refresh function
  const refreshBookingStatus = useCallback(async () => {
    if (!bookingId) return;

    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (booking && !error) {
        setRealTimeState(prev => ({
          ...prev,
          status: booking.status,
          lastUpdate: new Date()
        }));
      }
    } catch (error) {
      logger.error('Error refreshing booking status:', error);
    }
  }, [bookingId]);

  return {
    ...realTimeState,
    bookingState,
    refreshBookingStatus,
    hasActiveUpdates: realTimeState.updates.length > 0
  };
};