import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { correlationId } from '@/utils/correlationId';
import logger from '@/utils/logger';

interface BookingState {
  bookingId?: string;
  status: 'idle' | 'searching' | 'selecting' | 'reviewing' | 'paying' | 'confirming' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  correlationId: string;
  metadata: Record<string, any>;
}

interface BookingStep {
  step: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  timestamp?: string;
  data?: any;
}

export const useBookingTracking = (initialBookingId?: string) => {
  const [bookingState, setBookingState] = useState<BookingState>({
    status: 'idle',
    progress: 0,
    currentStep: 'search',
    correlationId: correlationId.getCurrentId(),
    metadata: {}
  });

  const [bookingSteps, setBookingSteps] = useState<BookingStep[]>([
    { step: 'search', status: 'pending' },
    { step: 'selection', status: 'pending' },
    { step: 'review', status: 'pending' },
    { step: 'payment', status: 'pending' },
    { step: 'confirmation', status: 'pending' }
  ]);

  // Initialize or recover booking state
  useEffect(() => {
    if (initialBookingId) {
      setBookingState(prev => ({ ...prev, bookingId: initialBookingId }));
      recoverBookingState(initialBookingId);
    } else {
      // Generate new correlation ID for new booking journey
      const newCorrelationId = correlationId.generateId();
      setBookingState(prev => ({ ...prev, correlationId: newCorrelationId }));
    }
  }, [initialBookingId]);

  const recoverBookingState = async (bookingId: string) => {
    try {
      // Get booking from database
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (booking && !error) {
        const status = mapBookingStatusToState(booking.status);
        const progress = calculateProgress(status);
        
        setBookingState(prev => ({
          ...prev,
          bookingId: booking.id,
          status,
          progress,
          currentStep: getCurrentStep(status),
          metadata: {
            ...prev.metadata,
            bookingReference: booking.booking_reference,
            totalAmount: booking.total_amount,
            currency: booking.currency,
            bookingType: booking.booking_type
          }
        }));

        updateStepsFromStatus(status);
      }
    } catch (error) {
      logger.error('Error recovering booking state:', error);
    }
  };

  const trackStep = async (step: string, status: 'active' | 'completed' | 'error', data?: any) => {
    const timestamp = new Date().toISOString();
    
    // Update local state
    setBookingSteps(prev => 
      prev.map(s => 
        s.step === step 
          ? { ...s, status, timestamp, data }
          : s
      )
    );

    // Update booking state
    const newStatus = mapStepToBookingStatus(step, status);
    const progress = calculateProgress(newStatus);

    setBookingState(prev => ({
      ...prev,
      status: newStatus,
      progress,
      currentStep: step,
      metadata: {
        ...prev.metadata,
        ...data,
        lastUpdated: timestamp
      }
    }));

    // Track in correlation system
    try {
      await supabase.rpc('log_system_event', {
        p_correlation_id: bookingState.correlationId,
        p_service_name: 'booking_tracker',
        p_log_level: status === 'error' ? 'ERROR' : 'INFO',
        p_message: `Booking step ${step} ${status}`,
        p_metadata: {
          step,
          status,
          progress,
          booking_id: bookingState.bookingId,
          ...data
        }
      });
    } catch (error) {
      logger.error('Error tracking booking step:', error);
    }

    logger.info(`Booking step tracked: ${step} - ${status}`, {
      correlationId: bookingState.correlationId,
      bookingId: bookingState.bookingId,
      step,
      status,
      data
    });
  };

  const updateBookingData = (data: Record<string, any>) => {
    setBookingState(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        ...data
      }
    }));
  };

  const resetBooking = () => {
    const newCorrelationId = correlationId.generateId();
    
    setBookingState({
      status: 'idle',
      progress: 0,
      currentStep: 'search',
      correlationId: newCorrelationId,
      metadata: {}
    });

    setBookingSteps([
      { step: 'search', status: 'pending' },
      { step: 'selection', status: 'pending' },
      { step: 'review', status: 'pending' },
      { step: 'payment', status: 'pending' },
      { step: 'confirmation', status: 'pending' }
    ]);
  };

  return {
    bookingState,
    bookingSteps,
    trackStep,
    updateBookingData,
    resetBooking,
    isCompleted: bookingState.status === 'completed',
    hasError: bookingState.status === 'error',
    currentProgress: bookingState.progress
  };
};

// Helper functions
function mapBookingStatusToState(status: string): BookingState['status'] {
  const statusMap: Record<string, BookingState['status']> = {
    'pending': 'reviewing',
    'confirmed': 'completed',
    'failed': 'error',
    'cancelled': 'error',
    'processing': 'paying'
  };
  return statusMap[status] || 'idle';
}

function mapStepToBookingStatus(step: string, status: string): BookingState['status'] {
  if (status === 'error') return 'error';
  
  const stepMap: Record<string, BookingState['status']> = {
    'search': 'searching',
    'selection': 'selecting', 
    'review': 'reviewing',
    'payment': 'paying',
    'confirmation': status === 'completed' ? 'completed' : 'confirming'
  };
  return stepMap[step] || 'idle';
}

function calculateProgress(status: BookingState['status']): number {
  const progressMap: Record<BookingState['status'], number> = {
    'idle': 0,
    'searching': 20,
    'selecting': 40,
    'reviewing': 60,
    'paying': 80,
    'confirming': 90,
    'completed': 100,
    'error': 0
  };
  return progressMap[status] || 0;
}

function getCurrentStep(status: BookingState['status']): string {
  const stepMap: Record<BookingState['status'], string> = {
    'idle': 'search',
    'searching': 'search',
    'selecting': 'selection',
    'reviewing': 'review',
    'paying': 'payment',
    'confirming': 'confirmation',
    'completed': 'confirmation',
    'error': 'error'
  };
  return stepMap[status] || 'search';
}

function updateStepsFromStatus(status: BookingState['status']) {
  // This would update the steps based on the current booking status
  // Implementation depends on specific business logic
}