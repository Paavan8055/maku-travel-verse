import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/AuthContext";

interface PassengerDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contact?: {
    email: string;
    phone: string;
  };
  documents?: {
    documentType: string;
    number: string;
    expiryDate: string;
    issuanceCountry: string;
    nationality: string;
  };
  loyaltyPrograms?: Array<{
    programOwner: string;
    id: string;
  }>;
}

interface FlightBookingParams {
  flightOfferId: string;
  passengers: PassengerDetails[];
  selectedSeats?: Array<{
    segmentIndex: number;
    seatNumber: string;
    passengerId: string;
  }>;
  contactInfo: {
    email: string;
    phone: string;
  };
  paymentMethod?: string;
}

interface FlightBookingResult {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  error?: string;
  redirectUrl?: string;
}

export const useFlightBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const createFlightBooking = async (params: FlightBookingParams): Promise<FlightBookingResult> => {
    setIsLoading(true);

    try {
      // First, confirm the flight price
      const { data: priceData, error: priceError } = await supabase.functions.invoke('amadeus-flight-price-confirm', {
        body: {
          flightOfferId: params.flightOfferId,
          pricingOptions: {
            fareType: ["PUBLISHED"],
            includedCheckedBagsOnly: false
          }
        }
      });

      if (priceError || !priceData?.success) {
        throw new Error(priceData?.error || 'Failed to confirm flight price');
      }

      // Create the flight booking with Amadeus
      const { data: bookingData, error: bookingError } = await supabase.functions.invoke('amadeus-flight-booking', {
        body: {
          flightOfferId: params.flightOfferId,
          passengers: params.passengers.map((passenger, index) => ({
            id: (index + 1).toString(),
            dateOfBirth: passenger.dateOfBirth,
            name: {
              firstName: passenger.firstName,
              lastName: passenger.lastName
            },
            gender: passenger.gender.toUpperCase(),
            contact: {
              emailAddress: passenger.contact?.email || params.contactInfo.email,
              phones: [{
                deviceType: "MOBILE",
                countryCallingCode: "1",
                number: passenger.contact?.phone || params.contactInfo.phone
              }]
            },
            documents: passenger.documents ? [{
              documentType: passenger.documents.documentType,
              number: passenger.documents.number,
              expiryDate: passenger.documents.expiryDate,
              issuanceCountry: passenger.documents.issuanceCountry,
              nationality: passenger.documents.nationality
            }] : undefined,
            loyaltyPrograms: passenger.loyaltyPrograms
          })),
          contactInfo: params.contactInfo
        }
      });

      if (bookingError || !bookingData?.success) {
        throw new Error(bookingData?.error || 'Failed to create flight booking');
      }

      // Store booking in Supabase
      const bookingDetails = {
        booking_type: 'flight',
        booking_reference: bookingData.booking?.reference || `FL${Date.now()}`,
        status: bookingData.booking?.status || 'confirmed',
        total_amount: parseFloat(priceData.price?.total || '0'),
        currency: priceData.price?.currency || 'USD',
        booking_data: {
          flightOfferId: params.flightOfferId,
          amadeus_booking_id: bookingData.booking?.id,
          confirmation_number: bookingData.booking?.reference,
          passengers: params.passengers,
          contact_info: params.contactInfo,
          selected_seats: params.selectedSeats,
          flight_details: priceData,
          check_in_links: generateCheckInLinks(bookingData.booking)
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
        // Don't fail here - we have the Amadeus booking
        toast.error('Booking saved to external system but may not appear in dashboard immediately');
      }

      // Create payment intent for the booking
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-hotel-booking', {
        body: {
          bookingId: supabaseBooking?.id || 'external-' + bookingData.booking?.id,
          amount: parseFloat(priceData.price?.total || '0'),
          currency: priceData.price?.currency || 'USD',
          customerInfo: {
            email: params.contactInfo.email,
            firstName: params.passengers[0]?.firstName,
            lastName: params.passengers[0]?.lastName
          },
          bookingData: bookingDetails.booking_data
        }
      });

      if (paymentError) {
        console.error('Payment creation error:', paymentError);
        // Booking exists but payment failed
        toast.error('Booking created but payment setup failed. Please contact support.');
      }

      toast.success('Flight booking created successfully!');

      return {
        success: true,
        bookingId: supabaseBooking?.id || bookingData.booking?.id,
        confirmationNumber: bookingData.booking?.reference,
        redirectUrl: paymentData?.url
      };

    } catch (error) {
      console.error('Flight booking error:', error);
      toast.error(error instanceof Error ? error.message : 'Flight booking failed');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Flight booking failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createFlightBooking,
    isLoading
  };
};

// Helper function to generate check-in links
const generateCheckInLinks = (booking: any) => {
  const airlines: { [key: string]: string } = {
    'QF': 'https://www.qantas.com/au/en/book-manage/manage-booking/check-in.html',
    'JQ': 'https://www.jetstar.com/au/en/check-in',
    'VA': 'https://www.virginaustralia.com/au/en/manage/check-in/',
    'SQ': 'https://www.singaporeair.com/en_UK/us/check-in/',
    'EK': 'https://www.emirates.com/au/english/manage/check-in/',
    'BA': 'https://www.britishairways.com/travel/managebooking/public/en_us',
    'AA': 'https://www.aa.com/reservation/checkin',
    'DL': 'https://www.delta.com/flight-services/check-in',
    'UA': 'https://www.united.com/en/us/check-in'
  };

  const airlineCode = booking?.guests?.[0]?.segments?.[0]?.carrierCode || 'QF';
  return airlines[airlineCode] || airlines['QF'];
};