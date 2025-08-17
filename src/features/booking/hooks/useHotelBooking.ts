import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/AuthContext";

interface HotelBookingParams {
  hotelOfferId: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  roomDetails: {
    roomType: string;
    boardType: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
  paymentMethod?: string;
  specialRequests?: string;
}

interface HotelBookingResult {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  error?: string;
  redirectUrl?: string;
}

export const useHotelBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const createHotelBooking = async (params: HotelBookingParams): Promise<HotelBookingResult> => {
    setIsLoading(true);

    try {
      // Create the hotel booking with Amadeus
      const { data: bookingData, error: bookingError } = await supabase.functions.invoke('amadeus-hotel-booking', {
        body: {
          hotelOfferId: params.hotelOfferId,
          guestDetails: params.guestDetails,
          roomDetails: params.roomDetails,
          specialRequests: params.specialRequests
        }
      });

      if (bookingError || !bookingData?.success) {
        throw new Error(bookingData?.error || 'Failed to create hotel booking');
      }

      // Store booking in Supabase
      const bookingDetails = {
        booking_type: 'hotel',
        booking_reference: bookingData.booking?.reference || `HT${Date.now()}`,
        status: bookingData.booking?.status || 'confirmed',
        total_amount: parseFloat(bookingData.booking?.totalPrice || '0'),
        currency: bookingData.booking?.currency || 'USD',
        booking_data: {
          hotelOfferId: params.hotelOfferId,
          amadeus_booking_id: bookingData.booking?.id,
          confirmation_number: bookingData.booking?.reference,
          guest_details: params.guestDetails,
          room_details: params.roomDetails,
          special_requests: params.specialRequests,
          hotel_details: bookingData.booking?.hotel,
          check_in_time: bookingData.booking?.checkInTime,
          check_out_time: bookingData.booking?.checkOutTime
        } as any,
        user_id: user?.id
      };

      const { data: supabaseBooking, error: supabaseError } = await supabase
        .from('bookings')
        .insert(bookingDetails)
        .select()
        .single();

      if (supabaseError) {
        console.error('Supabase booking error:', supabaseError);
        toast.error('Booking saved to external system but may not appear in dashboard immediately');
      }

      // Create payment intent for the booking
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-booking-payment', {
        body: {
          bookingId: supabaseBooking?.id || 'external-' + bookingData.booking?.id,
          amount: parseFloat(bookingData.booking?.totalPrice || '0'),
          currency: bookingData.booking?.currency || 'USD',
          customerInfo: {
            email: params.guestDetails.email,
            firstName: params.guestDetails.firstName,
            lastName: params.guestDetails.lastName
          },
          bookingData: bookingDetails.booking_data
        }
      });

      if (paymentError) {
        console.error('Payment creation error:', paymentError);
        toast.error('Booking created but payment setup failed. Please contact support.');
      }

      toast.success('Hotel booking created successfully!');

      return {
        success: true,
        bookingId: supabaseBooking?.id || bookingData.booking?.id,
        confirmationNumber: bookingData.booking?.reference,
        redirectUrl: paymentData?.url
      };

    } catch (error) {
      console.error('Hotel booking error:', error);
      toast.error(error instanceof Error ? error.message : 'Hotel booking failed');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hotel booking failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createHotelBooking,
    isLoading
  };
};