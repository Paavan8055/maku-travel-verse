import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentContextType {
  paymentMethod: string | null;
  setPaymentMethod: (method: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  createPaymentIntent: (booking: BookingData) => Promise<{ success: boolean; clientSecret?: string; error?: string }>;
}

interface BookingData {
  bookingId: string;
  amount: number;
  currency: string;
  hotelId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const useStripePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('useStripePayment must be used within a StripePaymentProvider');
  }
  return context;
};

export const StripePaymentProvider = ({ children }: { children: ReactNode }) => {
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const createPaymentIntent = async (booking: BookingData) => {
    setProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-hotel-booking', {
        body: booking
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success && data.clientSecret) {
        return {
          success: true,
          clientSecret: data.clientSecret
        };
      } else {
        throw new Error(data.error || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      
      toast({
        title: "Payment Setup Failed",
        description: error instanceof Error ? error.message : "Unable to setup payment. Please try again.",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment setup failed'
      };
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        paymentMethod,
        setPaymentMethod,
        processing,
        setProcessing,
        createPaymentIntent,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};