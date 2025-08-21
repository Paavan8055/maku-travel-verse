import { BaseSupplierClient, BaseSupplierConfig, SupplierCredentials, SupplierResponse } from './SupplierClient';
import { z } from 'zod';
import logger from '@/utils/logger';

// Sabre-specific schemas
export const SabreAuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number()
});

export const SabreErrorSchema = z.object({
  Errors: z.array(z.object({
    type: z.string(),
    timeStamp: z.string(),
    ErrorCode: z.string(),
    ErrorInfo: z.object({
      ErrorMessage: z.string()
    }),
    ErrorResource: z.string().optional()
  }))
});

export const SabreFlightSchema = z.object({
  PricedItineraries: z.array(z.any()).optional(),
  Links: z.array(z.any()).optional(),
  StatisticalIndicator: z.string().optional()
});

/**
 * Sabre API Client
 * Handles authentication and requests to Sabre Travel APIs
 */
export class SabreClient extends BaseSupplierClient {
  private static readonly TEST_BASE_URL = 'https://api-crt.cert.havail.sabre.com';
  private static readonly PROD_BASE_URL = 'https://api.havail.sabre.com';

  constructor(credentials: SupplierCredentials, isTestEnvironment: boolean = true) {
    const config: BaseSupplierConfig = {
      name: 'Sabre',
      baseUrl: isTestEnvironment ? SabreClient.TEST_BASE_URL : SabreClient.PROD_BASE_URL,
      isTestEnvironment,
      timeout: 30000,
      maxRetries: 3
    };

    super(config, credentials);
  }

  /**
   * Get Sabre access token using OAuth2 client credentials flow
   */
  protected async getAccessToken(correlationId?: string): Promise<string> {
    if (!this.needsTokenRefresh() && this.accessToken) {
      return this.accessToken;
    }

    try {
      logger.info('Getting Sabre access token', { correlationId });

      const tokenUrl = `${this.config.baseUrl}/v2/auth/token`;
      
      // Sabre uses Base64 encoded client credentials
      const credentials = Buffer.from(`${this.credentials.clientId}:${this.credentials.clientSecret}`).toString('base64');

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sabre token request failed: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      const validatedData = SabreAuthResponseSchema.parse(tokenData);

      this.accessToken = validatedData.access_token;
      this.tokenExpiry = new Date(Date.now() + (validatedData.expires_in * 1000));

      logger.info('Sabre access token obtained successfully', { 
        correlationId,
        expiresIn: validatedData.expires_in 
      });

      return this.accessToken;

    } catch (error) {
      logger.error('Failed to get Sabre access token:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      });
      throw error;
    }
  }

  /**
   * Test Sabre connection
   */
  public async testConnection(correlationId?: string): Promise<SupplierResponse<any>> {
    try {
      return await this.makeRequest('/v1/lists/supported/shop/flights/origins-destinations', {
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
   * Search flight offers
   */
  public async searchFlightOffers(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengerTypeQuantity: {
      adults: number;
      children?: number;
      infants?: number;
    };
    cabinPreference?: string;
  }, correlationId?: string): Promise<SupplierResponse<any>> {
    const requestBody = {
      OTA_AirLowFareSearchRQ: {
        POS: {
          Source: [{
            PseudoCityCode: "F9CE",
            RequestorID: {
              Type: "1",
              ID: "1",
              CompanyName: {
                Code: "TN"
              }
            }
          }]
        },
        OriginDestinationInformation: [
          {
            RPH: "1",
            DepartureDateTime: params.departureDate,
            OriginLocation: { LocationCode: params.origin },
            DestinationLocation: { LocationCode: params.destination }
          }
        ],
        TravelPreferences: {
          MaxStopsQuantity: 3,
          ...(params.cabinPreference && {
            CabinPref: [{ Cabin: params.cabinPreference, PreferLevel: "Preferred" }]
          })
        },
        TravelerInfoSummary: {
          AirTravelerAvail: [{
            PassengerTypeQuantity: [
              {
                Code: "ADT",
                Quantity: params.passengerTypeQuantity.adults
              },
              ...(params.passengerTypeQuantity.children ? [{
                Code: "CNN",
                Quantity: params.passengerTypeQuantity.children
              }] : []),
              ...(params.passengerTypeQuantity.infants ? [{
                Code: "INF",
                Quantity: params.passengerTypeQuantity.infants
              }] : [])
            ]
          }]
        }
      }
    };

    // Add return flight if specified
    if (params.returnDate) {
      requestBody.OTA_AirLowFareSearchRQ.OriginDestinationInformation.push({
        RPH: "2",
        DepartureDateTime: params.returnDate,
        OriginLocation: { LocationCode: params.destination },
        DestinationLocation: { LocationCode: params.origin }
      });
    }

    return await this.makeRequest('/v4/offers/shop', {
      method: 'POST',
      body: requestBody,
      correlationId,
      schema: SabreFlightSchema
    });
  }

  /**
   * Search hotel offers
   */
  public async searchHotelOffers(params: {
    cityCode: string;
    checkInDate: string;
    checkOutDate: string;
    guestCounts: {
      adults: number;
      children?: number;
    };
    roomCount?: number;
  }, correlationId?: string): Promise<SupplierResponse<any[]>> {
    const requestBody = {
      GetHotelAvailRQ: {
        SearchCriteria: {
          OffSet: 1,
          SortBy: "TotalRate",
          SortOrder: "ASC",
          PageSize: 20,
          TierLabels: false,
          GeoSearch: {
            GeoRef: {
              Radius: 25,
              UOM: "MI",
              RefPoint: {
                Value: params.cityCode,
                ValueContext: "CODE",
                RefPointType: "6"
              }
            }
          },
          RateInfoRef: {
            ConvertedRateInfoOnly: false,
            CurrencyCode: "USD",
            BestOnly: "2",
            PrepaidQualifier: "IncludePrepaid",
            StayDateRange: {
              StartDate: params.checkInDate,
              EndDate: params.checkOutDate
            },
            Rooms: {
              Room: [{
                Index: 1,
                Adults: params.guestCounts.adults,
                ...(params.guestCounts.children && { Children: params.guestCounts.children })
              }]
            },
            InfoSource: "100,110,112,113"
          }
        }
      }
    };

    return await this.makeRequest('/v2.0.0/shop/hotels?mode=content', {
      method: 'POST',
      body: requestBody,
      correlationId
    });
  }

  /**
   * Get location autocomplete
   */
  public async getLocationAutocomplete(query: string, correlationId?: string): Promise<SupplierResponse<any[]>> {
    const queryParams = new URLSearchParams({
      query,
      limit: '10'
    });

    return await this.makeRequest(`/v1/lists/utilities/geoservices/autocomplete?${queryParams}`, {
      method: 'GET',
      correlationId
    });
  }

  /**
   * Get flight price details
   */
  public async getFlightPriceDetails(offerId: string, correlationId?: string): Promise<SupplierResponse<any>> {
    const requestBody = {
      OTA_AirPriceRQ: {
        PriceRequestInformation: {
          Retain: true,
          PricingSource: "ADVJR1",
          CurrencyCode: "USD"
        }
      }
    };

    return await this.makeRequest('/v1/offers/shop/flights/price', {
      method: 'POST',
      body: requestBody,
      correlationId
    });
  }

  /**
   * Create flight booking
   */
  public async createFlightBooking(params: {
    passengers: any[];
    contactInfo: any;
    paymentInfo: any;
  }, correlationId?: string): Promise<SupplierResponse<any>> {
    const requestBody = {
      CreatePassengerNameRecordRQ: {
        TravelItineraryAddInfo: {
          AgencyInfo: {
            Address: {
              AddressLine: "SABRE TRAVEL",
              StreetNmbr: "3150",
              CityName: "SABRE DRIVE",
              PostalCode: "76051",
              StateCountyProv: { StateCode: "TX" },
              CountryCode: "US"
            },
            Ticketing: { TicketType: "7TAW" }
          },
          CustomerInfo: {
            PersonName: params.passengers.map(p => ({
              NameNumber: p.id,
              PassengerType: "ADT",
              GivenName: p.firstName,
              Surname: p.lastName
            }))
          }
        }
      }
    };

    return await this.makeRequest('/v2.0.0/passenger/records', {
      method: 'POST',
      body: requestBody,
      correlationId
    });
  }
}