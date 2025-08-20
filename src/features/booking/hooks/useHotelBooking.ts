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
  useRealAmadeusBooking?: boolean; // Flag to use real Amadeus booking
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
      console.log('Creating hotel booking for offer:', params.hotelOfferId);

      // Check if we should use real Amadeus booking
      if (params.useRealAmadeusBooking) {
        // Step 1: Confirm the price first
        const { data: priceConfirmation, error: priceError } = await supabase.functions.invoke('amadeus-price-confirm', {
          body: { offerId: params.hotelOfferId }
        });

        if (priceError || !priceConfirmation?.success) {
          throw new Error('Price confirmation failed. Hotel may no longer be available.');
        }

        // Step 2: Create actual Amadeus booking
        const { data: amadeusBooking, error: amadeusError } = await supabase.functions.invoke('amadeus-hotel-booking', {
          body: {
            offerId: params.hotelOfferId,
            guestDetails: params.guestDetails,
            roomDetails: params.roomDetails,
            specialRequests: params.specialRequests
          }
        });

        if (amadeusError || !amadeusBooking?.success) {
          throw new Error(amadeusBooking?.error || 'Hotel booking failed with Amadeus');
        }

        toast.success('Real hotel booking created successfully!');

        return {
          success: true,
          bookingId: amadeusBooking.booking?.id,
          confirmationNumber: amadeusBooking.booking?.confirmationNumber,
          redirectUrl: `/booking-confirmation?bookingId=${amadeusBooking.booking?.id}`
        };
      } else {
        // Fallback to existing payment flow
        const selectedPrice = parseFloat(sessionStorage.getItem('selectedHotelPrice') || '200');
        const selectedHotelData = JSON.parse(sessionStorage.getItem('hotelBookingSelections') || '{}');

        const { data: bookingResponse, error: bookingError } = await supabase.functions.invoke('create-hotel-booking', {
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
      }

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