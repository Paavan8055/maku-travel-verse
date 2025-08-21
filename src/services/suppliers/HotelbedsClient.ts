import { BaseSupplierClient, BaseSupplierConfig, SupplierCredentials, SupplierResponse } from './SupplierClient';
import { z } from 'zod';
import logger from '@/utils/logger';
import crypto from 'crypto';

// HotelBeds-specific schemas
export const HotelbedsErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string()
  })
});

export const HotelbedsHotelSchema = z.object({
  code: z.number(),
  name: z.string(),
  description: z.string().optional(),
  countryCode: z.string(),
  stateCode: z.string().optional(),
  destinationCode: z.string(),
  zoneCode: z.number().optional(),
  coordinates: z.object({
    longitude: z.number(),
    latitude: z.number()
  }).optional(),
  categoryCode: z.string().optional(),
  categoryGroupCode: z.string().optional(),
  chainCode: z.string().optional(),
  accommodationTypeCode: z.string().optional(),
  boardCodes: z.array(z.string()).optional(),
  segmentCodes: z.array(z.number()).optional(),
  address: z.object({
    content: z.string(),
    street: z.string().optional(),
    number: z.string().optional()
  }).optional(),
  postalCode: z.string().optional(),
  city: z.object({
    content: z.string()
  }).optional(),
  email: z.string().optional(),
  license: z.string().optional(),
  phones: z.array(z.object({
    phoneNumber: z.string(),
    phoneType: z.string()
  })).optional(),
  rooms: z.array(z.any()).optional(),
  facilities: z.array(z.any()).optional(),
  images: z.array(z.any()).optional()
});

export const HotelbedsAvailabilitySchema = z.object({
  hotels: z.array(z.object({
    code: z.number(),
    name: z.string(),
    destinationCode: z.string(),
    zoneCode: z.number().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    rooms: z.array(z.any())
  }))
});

/**
 * HotelBeds API Client
 * Handles authentication and requests to HotelBeds APIs
 */
export class HotelbedsClient extends BaseSupplierClient {
  private static readonly TEST_BASE_URL = 'https://api.test.hotelbeds.com';
  private static readonly PROD_BASE_URL = 'https://api.hotelbeds.com';

  constructor(credentials: SupplierCredentials, isTestEnvironment: boolean = true) {
    const config: BaseSupplierConfig = {
      name: 'HotelBeds',
      baseUrl: isTestEnvironment ? HotelbedsClient.TEST_BASE_URL : HotelbedsClient.PROD_BASE_URL,
      isTestEnvironment,
      timeout: 30000,
      maxRetries: 3
    };

    super(config, credentials);
  }

  /**
   * HotelBeds uses API key authentication with signature
   */
  protected async getAccessToken(correlationId?: string): Promise<string> {
    // HotelBeds doesn't use OAuth tokens, return the API key
    if (!this.credentials.apiKey) {
      throw new Error('HotelBeds API key is required');
    }
    
    return this.credentials.apiKey;
  }

  /**
   * Generate HotelBeds signature
   */
  private generateSignature(): { signature: string; timestamp: string } {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHash('sha256')
      .update(this.credentials.apiKey + this.credentials.clientSecret + timestamp)
      .digest('hex');
    
    return { signature, timestamp };
  }

  /**
   * Override makeRequest to add HotelBeds-specific authentication
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      schema?: z.ZodSchema<T>;
      correlationId?: string;
    } = {}
  ): Promise<SupplierResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      schema,
      correlationId = crypto.randomUUID()
    } = options;

    try {
      const { signature, timestamp } = this.generateSignature();
      
      const url = `${this.config.baseUrl}${endpoint}`;
      const requestOptions = {
        method,
        headers: {
          'Api-key': this.credentials.apiKey!,
          'X-Signature': signature,
          'X-Timestamp': timestamp,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        maxRetries: this.config.maxRetries,
        correlationId
      };

      logger.info(`${this.config.name} API request:`, {
        method,
        url,
        correlationId,
        supplier: this.config.name
      });

      // Make request with retry logic
      const data = await fetch(url, {
        method: requestOptions.method,
        headers: requestOptions.headers,
        body: requestOptions.body
      }).then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HotelBeds API error: ${response.status} ${errorText}`);
        }
        return response.json();
      });

      logger.info(`${this.config.name} API response:`, {
        success: true,
        correlationId,
        supplier: this.config.name
      });

      return {
        success: true,
        data: schema ? schema.parse(data) : data,
        correlationId,
        supplier: this.config.name
      };

    } catch (error) {
      logger.error(`${this.config.name} API error:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
        supplier: this.config.name,
        endpoint
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'API request failed',
        correlationId,
        supplier: this.config.name
      };
    }
  }

  /**
   * Test HotelBeds connection
   */
  public async testConnection(correlationId?: string): Promise<SupplierResponse<any>> {
    try {
      return await this.makeRequest('/hotel-content-api/1.0/types/countries', {
        method: 'GET',
        correlationId
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
   * Search hotel availability
   */
  public async searchHotelAvailability(params: {
    destinationCode: string;
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    children?: number;
    rooms?: number;
    currency?: string;
  }, correlationId?: string): Promise<SupplierResponse<any>> {
    const requestBody = {
      stay: {
        checkIn: params.checkInDate,
        checkOut: params.checkOutDate
      },
      occupancies: [
        {
          rooms: params.rooms || 1,
          adults: params.adults,
          children: params.children || 0
        }
      ],
      destination: {
        code: params.destinationCode
      },
      ...(params.currency && { currency: params.currency })
    };

    return await this.makeRequest('/hotel-api/1.0/hotels', {
      method: 'POST',
      body: requestBody,
      correlationId,
      schema: HotelbedsAvailabilitySchema
    });
  }

  /**
   * Get hotel details
   */
  public async getHotelDetails(hotelCode: number, correlationId?: string): Promise<SupplierResponse<any>> {
    return await this.makeRequest(`/hotel-content-api/1.0/hotels/${hotelCode}/details`, {
      method: 'GET',
      correlationId,
      schema: HotelbedsHotelSchema
    });
  }

  /**
   * Search hotels by location
   */
  public async searchHotels(params: {
    destinationCode?: string;
    countryCode?: string;
    coordinates?: { latitude: number; longitude: number };
    fields?: string[];
    language?: string;
  }, correlationId?: string): Promise<SupplierResponse<any[]>> {
    const queryParams = new URLSearchParams();
    
    if (params.destinationCode) queryParams.append('destinationCode', params.destinationCode);
    if (params.countryCode) queryParams.append('countryCode', params.countryCode);
    if (params.coordinates) {
      queryParams.append('latitude', params.coordinates.latitude.toString());
      queryParams.append('longitude', params.coordinates.longitude.toString());
    }
    if (params.fields) queryParams.append('fields', params.fields.join(','));
    if (params.language) queryParams.append('language', params.language);

    return await this.makeRequest(`/hotel-content-api/1.0/hotels?${queryParams}`, {
      method: 'GET',
      correlationId,
      schema: z.object({
        hotels: z.array(HotelbedsHotelSchema)
      })
    });
  }

  /**
   * Get destinations
   */
  public async getDestinations(params: {
    countryCode?: string;
    language?: string;
  } = {}, correlationId?: string): Promise<SupplierResponse<any[]>> {
    const queryParams = new URLSearchParams();
    
    if (params.countryCode) queryParams.append('countryCode', params.countryCode);
    if (params.language) queryParams.append('language', params.language);

    return await this.makeRequest(`/hotel-content-api/1.0/types/destinations?${queryParams}`, {
      method: 'GET',
      correlationId
    });
  }

  /**
   * Create hotel booking
   */
  public async createHotelBooking(params: {
    hotelCode: number;
    checkInDate: string;
    checkOutDate: string;
    rooms: any[];
    holder: {
      name: string;
      surname: string;
      email: string;
      phone: string;
    };
    clientReference?: string;
  }, correlationId?: string): Promise<SupplierResponse<any>> {
    const requestBody = {
      holder: params.holder,
      stay: {
        checkIn: params.checkInDate,
        checkOut: params.checkOutDate
      },
      hotel: {
        code: params.hotelCode
      },
      rooms: params.rooms,
      ...(params.clientReference && { clientReference: params.clientReference })
    };

    return await this.makeRequest('/hotel-api/1.0/bookings', {
      method: 'POST',
      body: requestBody,
      correlationId
    });
  }
}