import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/AuthContext";
import logger from "@/utils/logger";
import { HotelBookingWorkflow, createHotelBookingWorkflow, type HotelBookingWorkflowParams } from "@/services/HotelBookingWorkflow";

interface HotelBookingParams {
  hotelOfferId?: string;
  hotelCode?: string;
  hotelName?: string;
  rateKey?: string;
  provider?: 'hotelbeds' | 'amadeus';
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
  rooms?: Array<{
    rateKey: string;
    type: string;
    rate: string;
    price: number;
    paxes: Array<{
      roomId: number;
      type: 'AD' | 'CH';
      age?: number;
      name: string;
      surname: string;
      title?: string;
    }>;
  }>;
  paymentMethod?: string;
  specialRequests?: string;
  useRealAmadeusBooking?: boolean;
  useHotelBeds?: boolean;
}

interface HotelBookingResult {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  hotelbedsReference?: string;
  amadeusPNR?: string;
  error?: string;
  redirectUrl?: string;
}

export const useHotelBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const createHotelBooking = async (params: HotelBookingParams): Promise<HotelBookingResult> => {
    setIsLoading(true);

    try {
      console.log('Creating hotel booking:', { 
        provider: params.provider, 
        hotelCode: params.hotelCode || params.hotelOfferId,
        useHotelBeds: params.useHotelBeds,
        useRealAmadeusBooking: params.useRealAmadeusBooking
      });

      // Use the new booking workflow if provider and required data is specified
      if ((params.useHotelBeds || params.provider === 'hotelbeds') && params.hotelCode && params.rateKey && params.rooms) {
        const workflow = createHotelBookingWorkflow();
        
        const workflowParams: HotelBookingWorkflowParams = {
          provider: 'hotelbeds',
          hotelCode: params.hotelCode,
          hotelName: params.hotelName || 'Selected Hotel',
          checkInDate: params.roomDetails.checkIn,
          checkOutDate: params.roomDetails.checkOut,
          rateKey: params.rateKey,
          guests: [{
            firstName: params.guestDetails.firstName,
            lastName: params.guestDetails.lastName,
            email: params.guestDetails.email,
            phone: params.guestDetails.phone,
            type: 'AD'
          }],
          rooms: params.rooms
        };

        const result = await workflow.executeHotelBedsWorkflow(workflowParams);
        
        return {
          success: result.success,
          bookingId: result.bookingId,
          confirmationNumber: result.confirmationNumber,
          hotelbedsReference: result.hotelbedsReference,
          error: result.error,
          redirectUrl: result.success ? `/booking-confirmation?bookingId=${result.bookingId}` : undefined
        };
      } 
      // Check if we should use real Amadeus booking
      else if (params.useRealAmadeusBooking && params.hotelOfferId) {
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
          amadeusPNR: amadeusBooking.booking?.pnr,
          redirectUrl: `/booking-confirmation?bookingId=${amadeusBooking.booking?.id}`
        };
      } else {
        // Fallback to existing payment flow
        const selectedPrice = parseFloat(sessionStorage.getItem('selectedHotelPrice') || '200');
        const selectedHotelData = JSON.parse(sessionStorage.getItem('hotelBookingSelections') || '{}');

        const { data: bookingResponse, error: bookingError } = await supabase.functions.invoke('create-booking-payment', {
          body: {
            bookingType: 'hotel',
            bookingData: {
              hotelOfferId: params.hotelOfferId,
              hotel: {
                name: selectedHotelData.hotelName || params.hotelName || 'Selected Hotel',
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
      logger.error('Hotel booking error:', error);
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