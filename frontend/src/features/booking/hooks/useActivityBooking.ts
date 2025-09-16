import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/AuthContext";
import logger from "@/utils/logger";

interface ActivityBookingParams {
  activityId: string;
  activityDetails: {
    title: string;
    description: string;
    price: number;
    currency: string;
    duration: string;
    location: string;
    bookingUrl?: string;
  };
  participantDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    participants: number;
  };
  selectedDate: string;
  selectedTime?: string;
  specialRequests?: string;
}

interface ActivityBookingResult {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  error?: string;
  redirectUrl?: string;
}

export const useActivityBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const createActivityBooking = async (params: ActivityBookingParams): Promise<ActivityBookingResult> => {
    setIsLoading(true);

    try {
      // For now, create a local booking record since most activity providers
      // require direct booking through their platforms
      const bookingReference = `ACT${Date.now()}`;
      
      // Store booking in Supabase
      const bookingDetails = {
        booking_type: 'activity',
        booking_reference: bookingReference,
        status: 'pending',
        total_amount: params.activityDetails.price * params.participantDetails.participants,
        currency: params.activityDetails.currency,
        booking_data: {
          activity_id: params.activityId,
          activity_details: params.activityDetails,
          participant_details: params.participantDetails,
          selected_date: params.selectedDate,
          selected_time: params.selectedTime,
          special_requests: params.specialRequests,
          booking_url: params.activityDetails.bookingUrl,
          booking_status: 'requires_external_confirmation'
        } as any,
        user_id: user?.id
      };

      const { data: supabaseBooking, error: supabaseError } = await supabase
        .from('bookings')
        .insert(bookingDetails)
        .select()
        .single();

      if (supabaseError) {
        throw new Error('Failed to create activity booking record');
      }

      // Log the search for analytics
      await supabase.functions.invoke('activity-search', {
        body: {
          destination: params.activityDetails.location,
          date: params.selectedDate,
          participants: params.participantDetails.participants,
          log_booking: true,
          booking_id: supabaseBooking.id
        }
      });

      // Create payment intent for the booking
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-booking-payment', {
        body: {
          bookingId: supabaseBooking.id,
          amount: params.activityDetails.price * params.participantDetails.participants,
          currency: params.activityDetails.currency,
          customerInfo: {
            email: params.participantDetails.email,
            firstName: params.participantDetails.firstName,
            lastName: params.participantDetails.lastName
          },
          bookingData: bookingDetails.booking_data
        }
      });

      if (paymentError) {
        logger.error('Payment creation error:', paymentError);
        toast.error('Booking created but payment setup failed. Please contact support.');
      }

      toast.success('Activity booking created successfully!');

      // If there's a direct booking URL, we'll redirect there after payment
      const finalRedirectUrl = params.activityDetails.bookingUrl || paymentData?.url;

      return {
        success: true,
        bookingId: supabaseBooking.id,
        confirmationNumber: bookingReference,
        redirectUrl: finalRedirectUrl
      };

    } catch (error) {
      logger.error('Activity booking error:', error);
      toast.error(error instanceof Error ? error.message : 'Activity booking failed');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Activity booking failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createActivityBooking,
    isLoading
  };
};