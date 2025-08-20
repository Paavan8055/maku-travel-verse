import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingPaymentParams {
  bookingType: 'flight' | 'hotel' | 'activity' | 'package';
  bookingData: any;
  amount: number;
  currency?: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  paymentMethod?: 'card' | 'fund' | 'split';
  fundAmount?: number;
}

interface BookingPaymentResult {
  success: boolean;
  booking?: {
    id: string;
    reference: string;
    status: string;
    amount: number;
    currency: string;
  };
  payment?: {
    method: string;
    status: string;
    checkoutUrl?: string;
  };
  error?: string;
}

export const useBookingPayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createBookingPayment = async (params: BookingPaymentParams): Promise<BookingPaymentResult> => {
    setIsLoading(true);
    
    try {
      console.log('Creating booking payment:', params);

      const { data, error } = await supabase.functions.invoke('create-hotel-booking', {
        body: params
      });

      if (error) {
        throw new Error(error.message || 'Failed to create booking payment');
      }

      if (!data.success) {
        throw new Error(data.error || 'Booking payment failed');
      }

      // Show success toast
      toast({
        title: "Booking Created",
        description: `Booking reference: ${data.booking.reference}`,
      });

      // If there's a checkout URL, redirect to Stripe
      if (data.payment.checkoutUrl) {
        console.log('Redirecting to Stripe checkout:', data.payment.checkoutUrl);
        window.location.href = data.payment.checkoutUrl;
      }

      return data;

    } catch (error) {
      console.error('Booking payment error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createBookingPayment,
    isLoading
  };
};