import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

interface BookingParams {
  type: 'flight' | 'hotel' | 'activity' | 'car';
  offerId: string;
  offerData: any;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  passengers?: any[];
  guests?: any[];
  paymentMethod?: string;
}

interface BookingResult {
  bookingId: string;
  confirmationCode?: string;
  pnr?: string;
  status: string;
  totalAmount: number;
  currency: string;
  checkInLink?: string;
  tickets?: string[];
}

export const useRealBooking = () => {
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createBooking = useCallback(async (params: BookingParams): Promise<BookingResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Use the new production booking manager for all booking types
      const requestBody = {
        bookingType: params.type,
        bookingData: {
          offerId: params.offerId,
          offerData: params.offerData,
          passengers: params.passengers || [],
          guests: params.guests || [],
          customerInfo: params.customerInfo
        },
        customerInfo: params.customerInfo,
        amount: params.offerData?.price?.total || 0,
        currency: params.offerData?.price?.currency || 'AUD',
        useRealProvider: true // Set to true for production, false for testing
      };

      const { data, error: bookingError } = await supabase.functions.invoke(
        'production-booking-manager',
        { body: requestBody }
      );

      if (bookingError) {
        throw new Error(bookingError.message || 'Booking creation failed');
      }

      if (data?.success) {
        const result: BookingResult = {
          bookingId: data.bookingId || data.booking?.id,
          confirmationCode: data.confirmationCode || data.booking?.confirmationCode,
          pnr: data.pnr || data.booking?.pnr,
          status: data.status || data.booking?.status || 'confirmed',
          totalAmount: data.totalAmount || data.booking?.totalAmount || 0,
          currency: data.currency || data.booking?.currency || 'AUD',
          checkInLink: data.checkInLink || data.booking?.checkInLink,
          tickets: data.tickets || data.booking?.tickets
        };

        setBooking(result);

        toast({
          title: "Booking confirmed!",
          description: `Your ${params.type} booking has been confirmed. Confirmation: ${result.confirmationCode || result.bookingId}`,
        });

        // Send confirmation email
        try {
          await supabase.functions.invoke('send-booking-confirmation', {
            body: {
              bookingId: result.bookingId,
              email: params.customerInfo.email,
              type: params.type
            }
          });
        } catch (emailError) {
          logger.warn('Failed to send confirmation email:', emailError);
          // Don't fail the booking for email issues
        }

        return result;
      } else {
        throw new Error(data?.error || 'Booking failed');
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Booking creation failed';
      setError(errorMessage);
      logger.error('Booking error:', err);
      
      toast({
        title: "Booking failed",
        description: errorMessage,
        variant: "destructive"
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const modifyBooking = useCallback(async (bookingId: string, modifications: any) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: modifyError } = await supabase.functions.invoke(
        'modify-booking',
        {
          body: {
            bookingId,
            modifications
          }
        }
      );

      if (modifyError) throw modifyError;

      if (data?.success) {
        setBooking(data.booking);
        
        toast({
          title: "Booking modified",
          description: "Your booking has been successfully updated",
        });

        return data.booking;
      } else {
        throw new Error(data?.error || 'Booking modification failed');
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Booking modification failed';
      setError(errorMessage);
      logger.error('Booking modification error:', err);
      
      toast({
        title: "Modification failed",
        description: errorMessage,
        variant: "destructive"
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const cancelBooking = useCallback(async (bookingId: string, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: cancelError } = await supabase.functions.invoke(
        'cancel-booking',
        {
          body: {
            bookingId,
            reason: reason || 'Customer request'
          }
        }
      );

      if (cancelError) throw cancelError;

      if (data?.success) {
        setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
        
        toast({
          title: "Booking cancelled",
          description: "Your booking has been cancelled and any applicable refunds will be processed",
        });

        return true;
      } else {
        throw new Error(data?.error || 'Booking cancellation failed');
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Booking cancellation failed';
      setError(errorMessage);
      logger.error('Booking cancellation error:', err);
      
      toast({
        title: "Cancellation failed",
        description: errorMessage,
        variant: "destructive"
      });

      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    booking,
    loading,
    error,
    createBooking,
    modifyBooking,
    cancelBooking
  };
};