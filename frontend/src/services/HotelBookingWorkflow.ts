import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HotelBookingWorkflowParams {
  provider: 'hotelbeds' | 'amadeus';
  hotelCode: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  rateKey: string;
  guests: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    type?: 'AD' | 'CH';
    age?: number;
  }>;
  rooms: Array<{
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
}

export interface HotelBookingWorkflowResult {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  hotelbedsReference?: string;
  amadeusPNR?: string;
  error?: string;
  checkratesData?: any;
  bookingData?: any;
  reconfirmationData?: any;
}

export class HotelBookingWorkflow {
  private correlationId: string;

  constructor() {
    this.correlationId = crypto.randomUUID();
  }

  async executeHotelBedsWorkflow(params: HotelBookingWorkflowParams): Promise<HotelBookingWorkflowResult> {
    try {
      console.log(`[${this.correlationId}] Starting HotelBeds booking workflow for hotel ${params.hotelCode}`);

      // Step 1: Checkrates - Verify pricing and availability
      console.log(`[${this.correlationId}] Step 1: Checking rates...`);
      const checkratesResponse = await supabase.functions.invoke('hotelbeds-checkrates', {
        body: {
          hotelCode: params.hotelCode,
          rateKey: params.rateKey,
          rooms: params.rooms.map(room => ({
            rateKey: room.rateKey,
            paxes: room.paxes
          }))
        }
      });

      if (checkratesResponse.error || !checkratesResponse.data?.success) {
        console.error(`[${this.correlationId}] Checkrates failed:`, checkratesResponse.error);
        toast.error('Failed to confirm hotel rates and availability');
        return { 
          success: false, 
          error: checkratesResponse.error?.message || 'Rate confirmation failed' 
        };
      }

      const checkratesData = checkratesResponse.data;
      console.log(`[${this.correlationId}] Checkrates successful`);

      // Step 2: Create booking
      console.log(`[${this.correlationId}] Step 2: Creating booking...`);
      const clientReference = `MAKU-${Date.now()}-${params.hotelCode}`;
      
      const bookingResponse = await supabase.functions.invoke('hotelbeds-booking', {
        body: {
          holder: {
            name: params.guests[0].firstName,
            surname: params.guests[0].lastName,
            title: this.getTitle(params.guests[0].firstName)
          },
          rooms: params.rooms,
          clientReference,
          remark: `MAKU.Travel booking for ${params.hotelName}`,
          voucher: {
            language: 'ENG'
          },
          paymentData: {
            contactData: {
              email: params.guests[0].email,
              phoneNumber: params.guests[0].phone
            }
          }
        }
      });

      if (bookingResponse.error || !bookingResponse.data?.success) {
        console.error(`[${this.correlationId}] Booking failed:`, bookingResponse.error);
        toast.error('Failed to create hotel booking');
        return { 
          success: false, 
          error: bookingResponse.error?.message || 'Booking creation failed',
          checkratesData 
        };
      }

      const bookingData = bookingResponse.data;
      const hotelbedsReference = bookingData.booking.reference;
      console.log(`[${this.correlationId}] Booking created successfully. Reference: ${hotelbedsReference}`);

      // Step 3: Reconfirmation (optional but recommended)
      console.log(`[${this.correlationId}] Step 3: Reconfirming booking...`);
      let reconfirmationData = null;
      
      try {
        const reconfirmationResponse = await supabase.functions.invoke('hotelbeds-reconfirmation', {
          body: {
            reference: hotelbedsReference,
            language: 'ENG'
          }
        });

        if (reconfirmationResponse.data?.success) {
          reconfirmationData = reconfirmationResponse.data;
          console.log(`[${this.correlationId}] Reconfirmation successful`);
        } else {
          console.warn(`[${this.correlationId}] Reconfirmation failed, but booking is still valid`);
        }
      } catch (reconfirmationError) {
        console.warn(`[${this.correlationId}] Reconfirmation failed:`, reconfirmationError);
        // Don't fail the entire workflow if reconfirmation fails
      }

      toast.success(`Hotel booking confirmed! Reference: ${hotelbedsReference}`);

      return {
        success: true,
        bookingId: clientReference,
        confirmationNumber: hotelbedsReference,
        hotelbedsReference,
        checkratesData,
        bookingData,
        reconfirmationData
      };

    } catch (error) {
      console.error(`[${this.correlationId}] HotelBeds workflow error:`, error);
      toast.error('An unexpected error occurred during booking');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unexpected error occurred' 
      };
    }
  }

  async executeAmadeusWorkflow(params: HotelBookingWorkflowParams): Promise<HotelBookingWorkflowResult> {
    try {
      console.log(`[${this.correlationId}] Starting Amadeus booking workflow for hotel ${params.hotelCode}`);

      // Step 1: Price confirmation
      console.log(`[${this.correlationId}] Step 1: Confirming price...`);
      const priceConfirmResponse = await supabase.functions.invoke('amadeus-price-confirmation', {
        body: {
          offerData: {
            id: params.hotelCode,
            checkInDate: params.checkInDate,
            checkOutDate: params.checkOutDate,
            room: params.rooms[0]
          }
        }
      });

      if (priceConfirmResponse.error) {
        console.error(`[${this.correlationId}] Price confirmation failed:`, priceConfirmResponse.error);
        toast.error('Failed to confirm hotel pricing');
        return { 
          success: false, 
          error: 'Price confirmation failed' 
        };
      }

      // Step 2: Create booking
      console.log(`[${this.correlationId}] Step 2: Creating Amadeus booking...`);
      const bookingResponse = await supabase.functions.invoke('amadeus-hotel-booking', {
        body: {
          offerData: {
            id: params.hotelCode,
            checkInDate: params.checkInDate,
            checkOutDate: params.checkOutDate,
            room: params.rooms[0]
          },
          guestData: {
            guests: params.guests.map(guest => ({
              name: {
                firstName: guest.firstName,
                lastName: guest.lastName
              },
              contact: {
                email: guest.email,
                phone: guest.phone
              }
            }))
          }
        }
      });

      if (bookingResponse.error) {
        console.error(`[${this.correlationId}] Amadeus booking failed:`, bookingResponse.error);
        toast.error('Failed to create Amadeus hotel booking');
        return { 
          success: false, 
          error: 'Amadeus booking failed' 
        };
      }

      const { data: bookingData } = bookingResponse;
      console.log(`[${this.correlationId}] Amadeus booking successful`);

      toast.success('Hotel booking confirmed with Amadeus!');

      return {
        success: true,
        bookingId: bookingData?.bookingId,
        confirmationNumber: bookingData?.confirmationNumber,
        amadeusPNR: bookingData?.pnr,
        bookingData
      };

    } catch (error) {
      console.error(`[${this.correlationId}] Amadeus workflow error:`, error);
      toast.error('An unexpected error occurred during Amadeus booking');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unexpected error occurred' 
      };
    }
  }

  async execute(params: HotelBookingWorkflowParams): Promise<HotelBookingWorkflowResult> {
    console.log(`[${this.correlationId}] Executing hotel booking workflow with provider: ${params.provider}`);

    if (params.provider === 'hotelbeds') {
      return this.executeHotelBedsWorkflow(params);
    } else if (params.provider === 'amadeus') {
      return this.executeAmadeusWorkflow(params);
    } else {
      return {
        success: false,
        error: `Unsupported provider: ${params.provider}`
      };
    }
  }

  private getTitle(firstName: string): string {
    // Simple heuristic to determine title based on common naming patterns
    const femaleNames = ['maria', 'ana', 'sofia', 'elena', 'carmen', 'lucia', 'sara', 'laura'];
    const name = firstName.toLowerCase();
    
    if (femaleNames.some(fn => name.includes(fn))) {
      return 'Mrs';
    }
    return 'Mr';
  }

  getCorrelationId(): string {
    return this.correlationId;
  }
}

// Factory function for creating workflow instances
export function createHotelBookingWorkflow(): HotelBookingWorkflow {
  return new HotelBookingWorkflow();
}