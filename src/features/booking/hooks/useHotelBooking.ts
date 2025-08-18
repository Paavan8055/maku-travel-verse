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
      console.log('Creating hotel booking payment for offer:', params.hotelOfferId);

      // Get the selected hotel price from session storage
      const selectedPrice = parseFloat(sessionStorage.getItem('selectedHotelPrice') || '200');
      const selectedHotelData = JSON.parse(sessionStorage.getItem('hotelBookingSelections') || '{}');

      // Create the booking using the unified booking system
      const { data: bookingResponse, error: bookingError } = await supabase.functions.invoke('create-booking-payment', {
        body: {
          bookingType: 'hotel',
          bookingData: {
            hotelOfferId: params.hotelOfferId,
            hotel: {
              name: selectedHotelData.hotelName || 'Selected Hotel',
              checkIn: params.roomDetails.checkIn,
              checkOut: params.roomDetails.checkOut,
              roomType: params.roomDetails.roomType,
              guests: params.roomDetails.guests,
              boardType: params.roomDetails.boardType
            },
            specialRequests: params.specialRequests,
            amadeus: {
              hotelOfferId: params.hotelOfferId,
              hotelId: selectedHotelData.hotelId
            }
          },
          amount: selectedPrice,
          currency: 'USD',
          customerInfo: params.guestDetails,
          paymentMethod: params.paymentMethod || 'card'
        }
      });

      if (bookingError || !bookingResponse?.success) {
        throw new Error(bookingResponse?.error || 'Failed to create hotel booking payment');
      }

      toast.success('Hotel booking payment created successfully!');

      return {
        success: true,
        bookingId: bookingResponse.booking?.id,
        confirmationNumber: bookingResponse.booking?.reference,
        redirectUrl: bookingResponse.payment?.checkoutUrl
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