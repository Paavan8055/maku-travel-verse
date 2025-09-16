import { supabase } from '@/integrations/supabase/client';
import { apiFetch, ApiError } from '@/utils/apiClient';
import logger from '@/utils/logger';

// Unified booking interfaces
export interface BaseBookingParams {
  bookingType: 'hotel' | 'flight' | 'activity' | 'package';
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  paymentMethod?: 'card' | 'fund' | 'split';
  amount: number;
  currency: string;
}

export interface HotelBookingParams extends BaseBookingParams {
  bookingType: 'hotel';
  hotelData: {
    hotelOfferId: string;
    roomDetails: {
      roomType: string;
      boardType: string;
      checkIn: string;
      checkOut: string;
      guests: number;
    };
    specialRequests?: string;
  };
}

export interface FlightBookingParams extends BaseBookingParams {
  bookingType: 'flight';
  flightData: {
    flightOfferId: string;
    passengers: Array<{
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      gender: string;
      documents?: {
        documentType: string;
        number: string;
        expiryDate: string;
        issuanceCountry: string;
        nationality: string;
      };
    }>;
    selectedSeats?: Array<{
      segmentIndex: number;
      seatNumber: string;
      passengerId: string;
    }>;
  };
}

export interface ActivityBookingParams extends BaseBookingParams {
  bookingType: 'activity';
  activityData: {
    activityId: string;
    title: string;
    description: string;
    location: string;
    selectedDate: string;
    selectedTime?: string;
    participants: number;
    specialRequests?: string;
  };
}

export type BookingParams = HotelBookingParams | FlightBookingParams | ActivityBookingParams;

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
  metadata?: {
    supplierBookingId?: string;
    supplierConfirmation?: string;
    checkInUrl?: string;
    checkoutUrl?: string;
  };
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Unified Booking Service
 * Separates booking creation from payment processing
 */
export class BookingService {
  private correlationId: string;

  constructor() {
    this.correlationId = crypto.randomUUID();
  }

  /**
   * Create a booking record (without payment processing)
   */
  async createBooking(params: BookingParams): Promise<BookingResult> {
    try {
      console.log('Creating booking:', {
        type: params.bookingType,
        correlationId: this.correlationId
      });

      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          ...params,
          correlationId: this.correlationId
        }
      });

      if (error) {
        throw new ApiError(error.message || 'Failed to create booking', undefined, this.correlationId);
      }

      if (!data.success) {
        throw new ApiError(data.error || 'Booking creation failed', undefined, this.correlationId);
      }

      console.log('Booking created successfully:', {
        bookingId: data.bookingId,
        correlationId: this.correlationId
      });

      return {
        success: true,
        bookingId: data.bookingId,
        confirmationNumber: data.confirmationNumber,
        metadata: data.metadata
      };

    } catch (error) {
      logger.error('Booking creation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: this.correlationId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Booking creation failed'
      };
    }
  }

  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(
    bookingId: string,
    amount: number,
    currency: string,
    customerInfo: BaseBookingParams['customerInfo'],
    paymentMethod: string = 'card'
  ): Promise<PaymentResult> {
    try {
      console.log('Creating payment intent:', {
        bookingId,
        amount,
        currency,
        correlationId: this.correlationId
      });

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId,
          amount,
          currency,
          customerInfo,
          paymentMethod,
          correlationId: this.correlationId
        }
      });

      if (error) {
        throw new ApiError(error.message || 'Failed to create payment intent', undefined, this.correlationId);
      }

      if (!data.success) {
        throw new ApiError(data.error || 'Payment intent creation failed', undefined, this.correlationId);
      }

      console.log('Payment intent created successfully:', {
        paymentIntentId: data.paymentIntentId,
        correlationId: this.correlationId
      });

      return {
        success: true,
        paymentIntentId: data.paymentIntentId,
        clientSecret: data.clientSecret,
        checkoutUrl: data.checkoutUrl
      };

    } catch (error) {
      logger.error('Payment intent creation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: this.correlationId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment intent creation failed'
      };
    }
  }

  /**
   * Complete booking flow: create booking + payment intent
   */
  async createBookingWithPayment(params: BookingParams): Promise<BookingResult> {
    try {
      // Step 1: Create the booking
      const bookingResult = await this.createBooking(params);
      
      if (!bookingResult.success || !bookingResult.bookingId) {
        return bookingResult;
      }

      // Step 2: Create payment intent
      const paymentResult = await this.createPaymentIntent(
        bookingResult.bookingId,
        params.amount,
        params.currency,
        params.customerInfo,
        params.paymentMethod
      );

      if (!paymentResult.success) {
        logger.error('Payment intent creation failed for booking:', {
          bookingId: bookingResult.bookingId,
          error: paymentResult.error,
          correlationId: this.correlationId
        });

        // Booking exists but payment failed
        return {
          ...bookingResult,
          error: 'Booking created but payment setup failed. Please contact support.'
        };
      }

      // Return combined result
      return {
        success: true,
        bookingId: bookingResult.bookingId,
        confirmationNumber: bookingResult.confirmationNumber,
        paymentIntentId: paymentResult.paymentIntentId,
        clientSecret: paymentResult.clientSecret,
        metadata: {
          ...bookingResult.metadata,
          checkoutUrl: paymentResult.checkoutUrl
        }
      };

    } catch (error) {
      logger.error('Complete booking flow failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: this.correlationId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Booking and payment creation failed'
      };
    }
  }

  /**
   * Get correlation ID for request tracing
   */
  getCorrelationId(): string {
    return this.correlationId;
  }
}

// Factory function for creating new booking service instances
export const createBookingService = (): BookingService => {
  return new BookingService();
};