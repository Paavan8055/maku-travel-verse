/**
 * Unified Parameter Mapping Service for MAKU.Travel
 * 
 * Translates user search parameters to provider-specific schemas.
 * Ensures consistency across HotelBeds, Sabre, and Amadeus APIs.
 */

import { format, parseISO } from 'date-fns';

// Unified search parameters from user input
export interface UnifiedSearchParams {
  // Hotel search parameters
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  rooms?: number;
  adults?: number;
  children?: number;
  childAges?: number[];
  
  // Flight search parameters
  origin?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  cabin?: string;
  
  // Activity search parameters
  location?: string;
  date?: string;
  participants?: number;
  
  // Common parameters
  currency?: string;
  language?: string;
}

// Provider-specific parameter interfaces
export interface HotelBedsParams {
  stay: {
    checkIn: string;
    checkOut: string;
  };
  occupancies: Array<{
    rooms: number;
    adults: number;
    children: number;
    paxes?: Array<{
      type: 'AD' | 'CH';
      age?: number;
    }>;
  }>;
  destination: {
    code: string;
  };
  language?: string;
}

export interface SabreParams {
  GetHotelAvailRQ: {
    AvailRequestSegments: {
      AvailRequestSegment: {
        StayDateRange: {
          Start: string;
          End: string;
        };
        RoomStayCandidates: {
          RoomStayCandidate: Array<{
            GuestCounts: {
              GuestCount: Array<{
                AgeQualifyingCode: string;
                Count: number;
              }>;
            };
          }>;
        };
        HotelSearchCriteria: {
          Criterion: {
            HotelRef: {
              HotelCode?: string;
              HotelCityCode?: string;
            };
          };
        };
      };
    };
  };
}

export interface AmadeusFlightParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  currencyCode?: string;
}

export interface AmadeusHotelParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  roomQuantity: number;
  adults: number;
  children?: number;
  currency?: string;
}

/**
 * Parameter Mapper Class
 * Handles conversion between unified parameters and provider-specific formats
 */
export class ParameterMapper {
  
  /**
   * Maps unified parameters to HotelBeds format
   */
  static toHotelBeds(params: UnifiedSearchParams): HotelBedsParams {
    if (!params.checkIn || !params.checkOut || !params.destination) {
      throw new Error('Missing required parameters for HotelBeds: checkIn, checkOut, destination');
    }

    const adults = params.adults || 2;
    const children = params.children || 0;
    const rooms = params.rooms || 1;

    // Build paxes array for detailed guest information
    const paxes = [];
    
    // Add adults
    for (let i = 0; i < adults; i++) {
      paxes.push({ type: 'AD' as const });
    }
    
    // Add children with ages
    if (children > 0 && params.childAges) {
      params.childAges.forEach(age => {
        paxes.push({ type: 'CH' as const, age });
      });
    } else {
      // Default child age if not provided
      for (let i = 0; i < children; i++) {
        paxes.push({ type: 'CH' as const, age: 8 });
      }
    }

    return {
      stay: {
        checkIn: format(parseISO(params.checkIn), 'yyyy-MM-dd'),
        checkOut: format(parseISO(params.checkOut), 'yyyy-MM-dd'),
      },
      occupancies: [{
        rooms,
        adults,
        children,
        paxes
      }],
      destination: {
        code: params.destination.toUpperCase()
      },
      language: params.language || 'en'
    };
  }

  /**
   * Maps unified parameters to Sabre format
   */
  static toSabre(params: UnifiedSearchParams): SabreParams {
    if (!params.checkIn || !params.checkOut) {
      throw new Error('Missing required parameters for Sabre: checkIn, checkOut');
    }

    const adults = params.adults || 2;
    const children = params.children || 0;

    return {
      GetHotelAvailRQ: {
        AvailRequestSegments: {
          AvailRequestSegment: {
            StayDateRange: {
              Start: format(parseISO(params.checkIn), 'yyyy-MM-dd'),
              End: format(parseISO(params.checkOut), 'yyyy-MM-dd'),
            },
            RoomStayCandidates: {
              RoomStayCandidate: [{
                GuestCounts: {
                  GuestCount: [
                    {
                      AgeQualifyingCode: '10', // Adult
                      Count: adults
                    },
                    ...(children > 0 ? [{
                      AgeQualifyingCode: '8', // Child
                      Count: children
                    }] : [])
                  ]
                }
              }]
            },
            HotelSearchCriteria: {
              Criterion: {
                HotelRef: {
                  HotelCityCode: params.destination?.toUpperCase()
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Maps unified parameters to Amadeus Flight format
   */
  static toAmadeusFlights(params: UnifiedSearchParams): AmadeusFlightParams {
    if (!params.origin || !params.destination || !params.departureDate) {
      throw new Error('Missing required parameters for Amadeus Flights: origin, destination, departureDate');
    }

    const adults = params.passengers || params.adults || 1;
    const children = params.children || 0;

    return {
      originLocationCode: params.origin.toUpperCase(),
      destinationLocationCode: params.destination.toUpperCase(),
      departureDate: format(parseISO(params.departureDate), 'yyyy-MM-dd'),
      returnDate: params.returnDate ? format(parseISO(params.returnDate), 'yyyy-MM-dd') : undefined,
      adults,
      children: children > 0 ? children : undefined,
      infants: 0,
      travelClass: this.mapCabinClass(params.cabin),
      currencyCode: params.currency || 'AUD'
    };
  }

  /**
   * Maps unified parameters to Amadeus Hotel format
   */
  static toAmadeusHotels(params: UnifiedSearchParams): AmadeusHotelParams {
    if (!params.destination || !params.checkIn || !params.checkOut) {
      throw new Error('Missing required parameters for Amadeus Hotels: destination, checkIn, checkOut');
    }

    return {
      cityCode: params.destination.toUpperCase(),
      checkInDate: format(parseISO(params.checkIn), 'yyyy-MM-dd'),
      checkOutDate: format(parseISO(params.checkOut), 'yyyy-MM-dd'),
      roomQuantity: params.rooms || 1,
      adults: params.adults || 2,
      children: params.children || undefined,
      currency: params.currency || 'AUD'
    };
  }

  /**
   * Maps cabin class to Amadeus format
   */
  private static mapCabinClass(cabin?: string): string {
    if (!cabin) return 'ECONOMY';
    
    const cabinMap: Record<string, string> = {
      'ECONOMY': 'ECONOMY',
      'PREMIUM_ECONOMY': 'PREMIUM_ECONOMY',
      'BUSINESS': 'BUSINESS',
      'FIRST': 'FIRST'
    };

    return cabinMap[cabin.toUpperCase()] || 'ECONOMY';
  }

  /**
   * Validates unified search parameters
   */
  static validateParams(params: UnifiedSearchParams, searchType: 'hotel' | 'flight' | 'activity'): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Common validations
    if (params.currency && !['AUD', 'USD', 'EUR', 'GBP'].includes(params.currency)) {
      errors.push('Invalid currency code');
    }

    // Hotel-specific validations
    if (searchType === 'hotel') {
      if (!params.destination) errors.push('Destination is required for hotel search');
      if (!params.checkIn) errors.push('Check-in date is required for hotel search');
      if (!params.checkOut) errors.push('Check-out date is required for hotel search');
      
      if (params.checkIn && params.checkOut) {
        const checkIn = new Date(params.checkIn);
        const checkOut = new Date(params.checkOut);
        if (checkOut <= checkIn) {
          errors.push('Check-out date must be after check-in date');
        }
      }

      if (params.adults && params.adults < 1) {
        errors.push('At least 1 adult is required');
      }

      if (params.children && params.childAges && params.children !== params.childAges.length) {
        errors.push('Number of children must match number of child ages');
      }
    }

    // Flight-specific validations
    if (searchType === 'flight') {
      if (!params.origin) errors.push('Origin is required for flight search');
      if (!params.destination) errors.push('Destination is required for flight search');
      if (!params.departureDate) errors.push('Departure date is required for flight search');
      
      if (params.passengers && params.passengers < 1) {
        errors.push('At least 1 passenger is required');
      }

      if (params.origin && params.destination && params.origin === params.destination) {
        errors.push('Origin and destination cannot be the same');
      }

      if (params.departureDate && params.returnDate) {
        const departure = new Date(params.departureDate);
        const returnDate = new Date(params.returnDate);
        if (returnDate <= departure) {
          errors.push('Return date must be after departure date');
        }
      }
    }

    // Activity-specific validations
    if (searchType === 'activity') {
      if (!params.location) errors.push('Location is required for activity search');
      if (!params.date) errors.push('Date is required for activity search');
      
      if (params.participants && params.participants < 1) {
        errors.push('At least 1 participant is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Normalizes IATA codes to 3-letter format
   */
  static normalizeIATACode(code: string): string {
    return code.trim().toUpperCase().substring(0, 3);
  }

  /**
   * Formats date to ISO string for API calls
   */
  static formatDateForAPI(dateString: string): string {
    return format(parseISO(dateString), 'yyyy-MM-dd');
  }
}

export default ParameterMapper;