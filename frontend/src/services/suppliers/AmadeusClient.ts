import { BaseSupplierClient, BaseSupplierConfig, SupplierCredentials, SupplierResponse } from './SupplierClient';
import { z } from 'zod';
import logger from '@/utils/logger';

// Amadeus-specific schemas
export const AmadeusAuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string().optional()
});

export const AmadeusErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    title: z.string(),
    detail: z.string().optional(),
    source: z.any().optional()
  })
});

export const AmadeusLocationSchema = z.object({
  type: z.string(),
  subType: z.string().optional(),
  name: z.string(),
  iataCode: z.string(),
  address: z.object({
    cityName: z.string().optional(),
    countryName: z.string().optional(),
    countryCode: z.string().optional()
  }).optional(),
  geoCode: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional()
});

export const AmadeusFlightOfferSchema = z.object({
  type: z.string(),
  id: z.string(),
  source: z.string(),
  instantTicketingRequired: z.boolean(),
  nonHomogeneous: z.boolean(),
  oneWay: z.boolean(),
  lastTicketingDate: z.string(),
  numberOfBookableSeats: z.number(),
  itineraries: z.array(z.any()),
  price: z.object({
    currency: z.string(),
    total: z.string(),
    base: z.string(),
    fees: z.array(z.any()).optional(),
    taxes: z.array(z.any()).optional()
  }),
  pricingOptions: z.any(),
  validatingAirlineCodes: z.array(z.string()),
  travelerPricings: z.array(z.any())
});

export const AmadeusHotelOfferSchema = z.object({
  type: z.string(),
  hotel: z.any(),
  available: z.boolean(),
  offers: z.array(z.any()),
  self: z.string().optional()
});

/**
 * Amadeus API Client
 * Handles authentication and requests to Amadeus Travel APIs
 */
export class AmadeusClient extends BaseSupplierClient {
  private static readonly TEST_BASE_URL = 'https://test.api.amadeus.com';
  private static readonly PROD_BASE_URL = 'https://api.amadeus.com';

  constructor(credentials: SupplierCredentials, isTestEnvironment: boolean = true) {
    const config: BaseSupplierConfig = {
      name: 'Amadeus',
      baseUrl: isTestEnvironment ? AmadeusClient.TEST_BASE_URL : AmadeusClient.PROD_BASE_URL,
      isTestEnvironment,
      timeout: 30000,
      maxRetries: 3
    };

    super(config, credentials);
  }

  /**
   * Get Amadeus access token using OAuth2 client credentials flow
   */
  protected async getAccessToken(correlationId?: string): Promise<string> {
    if (!this.needsTokenRefresh() && this.accessToken) {
      return this.accessToken;
    }

    try {
      console.log('Getting Amadeus access token', { correlationId });

      const tokenUrl = `${this.config.baseUrl}/v1/security/oauth2/token`;
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.credentials.clientId!,
        client_secret: this.credentials.clientSecret!
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amadeus token request failed: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      const validatedData = AmadeusAuthResponseSchema.parse(tokenData);

      this.accessToken = validatedData.access_token;
      this.tokenExpiry = new Date(Date.now() + (validatedData.expires_in * 1000));

      console.log('Amadeus access token obtained successfully', { 
        correlationId,
        expiresIn: validatedData.expires_in 
      });

      return this.accessToken;

    } catch (error) {
      logger.error('Failed to get Amadeus access token:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      });
      throw error;
    }
  }

  /**
   * Test Amadeus connection
   */
  public async testConnection(correlationId?: string): Promise<SupplierResponse<any>> {
    try {
      return await this.makeRequest('/v1/reference-data/locations', {
        method: 'GET',
        correlationId,
        schema: z.object({
          data: z.array(AmadeusLocationSchema)
        })
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        correlationId,
        supplier: this.config.name
      };
    }
  }

  /**
   * Search flight offers
   */
  public async searchFlightOffers(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: string;
    currency?: string;
  }, correlationId?: string): Promise<SupplierResponse<any>> {
    const queryParams = new URLSearchParams({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: params.adults.toString(),
      ...(params.returnDate && { returnDate: params.returnDate }),
      ...(params.children && { children: params.children.toString() }),
      ...(params.infants && { infants: params.infants.toString() }),
      ...(params.travelClass && { travelClass: params.travelClass }),
      ...(params.currency && { currencyCode: params.currency })
    });

    return await this.makeRequest(`/v2/shopping/flight-offers?${queryParams}`, {
      method: 'GET',
      correlationId,
      schema: z.object({
        data: z.array(AmadeusFlightOfferSchema)
      })
    });
  }

  /**
   * Search hotel offers
   */
  public async searchHotelOffers(params: {
    cityCode?: string;
    hotelIds?: string[];
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    rooms?: number;
    currency?: string;
  }, correlationId?: string): Promise<SupplierResponse<any>> {
    const queryParams = new URLSearchParams({
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults.toString(),
      ...(params.cityCode && { cityCode: params.cityCode }),
      ...(params.hotelIds && { hotelIds: params.hotelIds.join(',') }),
      ...(params.rooms && { roomQuantity: params.rooms.toString() }),
      ...(params.currency && { currency: params.currency })
    });

    return await this.makeRequest(`/v3/shopping/hotel-offers?${queryParams}`, {
      method: 'GET',
      correlationId,
      schema: z.object({
        data: z.array(AmadeusHotelOfferSchema)
      })
    });
  }

  /**
   * Get hotel details by ID
   */
  public async getHotelDetails(hotelId: string, correlationId?: string): Promise<SupplierResponse<any>> {
    return await this.makeRequest(`/v1/reference-data/locations/hotels/by-hotels?hotelIds=${hotelId}`, {
      method: 'GET',
      correlationId
    });
  }

  /**
   * Confirm flight pricing
   */
  public async confirmFlightPrice(offerId: string, correlationId?: string): Promise<SupplierResponse<any>> {
    return await this.makeRequest('/v1/shopping/flight-offers/pricing', {
      method: 'POST',
      body: {
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [{ id: offerId }]
        }
      },
      correlationId
    });
  }

  /**
   * Create flight booking
   */
  public async createFlightBooking(params: {
    flightOfferId: string;
    passengers: any[];
    contactInfo: any;
  }, correlationId?: string): Promise<SupplierResponse<any>> {
    return await this.makeRequest('/v1/booking/flight-orders', {
      method: 'POST',
      body: {
        data: {
          type: 'flight-order',
          flightOffers: [{ id: params.flightOfferId }],
          travelers: params.passengers,
          contacts: [params.contactInfo]
        }
      },
      correlationId
    });
  }

  /**
   * Create hotel booking
   */
  public async createHotelBooking(params: {
    offerId: string;
    guestDetails: any;
    paymentDetails?: any;
  }, correlationId?: string): Promise<SupplierResponse<any>> {
    return await this.makeRequest('/v1/booking/hotel-bookings', {
      method: 'POST',
      body: {
        data: {
          type: 'hotel-booking',
          hotelOffer: { id: params.offerId },
          guests: [params.guestDetails],
          payments: params.paymentDetails ? [params.paymentDetails] : undefined
        }
      },
      correlationId
    });
  }

  /**
   * Search activities/tours
   */
  public async searchActivities(params: {
    latitude: number;
    longitude: number;
    radius?: number;
  }, correlationId?: string): Promise<SupplierResponse<any[]>> {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      ...(params.radius && { radius: params.radius.toString() })
    });

    return await this.makeRequest(`/v1/shopping/activities?${queryParams}`, {
      method: 'GET',
      correlationId
    });
  }

  /**
   * Get airport/city autocomplete
   */
  public async getLocationAutocomplete(keyword: string, correlationId?: string): Promise<SupplierResponse<any>> {
    const queryParams = new URLSearchParams({
      keyword,
      subType: 'AIRPORT,CITY'
    });

    return await this.makeRequest(`/v1/reference-data/locations?${queryParams}`, {
      method: 'GET',
      correlationId,
      schema: z.object({
        data: z.array(AmadeusLocationSchema)
      })
    });
  }
}