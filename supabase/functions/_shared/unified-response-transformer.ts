// Unified Response Transformation System
import logger from "./logger.ts";

// Unified response interfaces
export interface UnifiedPrice {
  amount: number;
  currency: string;
  formatted?: string;
}

export interface UnifiedLocation {
  code: string;
  name: string;
  city?: string;
  country?: string;
  type?: 'airport' | 'city' | 'hotel' | 'activity';
}

export interface UnifiedDateTime {
  dateTime: string;
  timeZone?: string;
  date?: string;
  time?: string;
}

export interface UnifiedRating {
  score: number;
  maxScore: number;
  reviews: number;
  source?: string;
}

// Flight-specific interfaces
export interface UnifiedFlightSegment {
  departure: UnifiedLocation & UnifiedDateTime;
  arrival: UnifiedLocation & UnifiedDateTime;
  airline: {
    code: string;
    name: string;
  };
  aircraft?: {
    code: string;
    name?: string;
  };
  flightNumber: string;
  duration: string;
  stops: number;
  cabin?: string;
}

export interface UnifiedFlightOffer {
  id: string;
  price: UnifiedPrice;
  segments: UnifiedFlightSegment[];
  validatingAirline: string;
  lastTicketingDate?: string;
  travelerPricings?: any[];
  isDirect: boolean;
  totalDuration: string;
  provider: {
    id: string;
    name: string;
    responseTime?: number;
  };
  metadata?: {
    bookingClass?: string;
    fareType?: string;
    refundable?: boolean;
    changeable?: boolean;
  };
}

// Hotel-specific interfaces
export interface UnifiedHotelOffer {
  id: string;
  name: string;
  location: UnifiedLocation;
  price: UnifiedPrice;
  rating?: UnifiedRating;
  starRating?: number;
  description?: string;
  amenities?: string[];
  images?: string[];
  checkIn: string;
  checkOut: string;
  roomType?: string;
  boardType?: string;
  cancellationPolicy?: string;
  provider: {
    id: string;
    name: string;
    responseTime?: number;
  };
  metadata?: {
    hotelChain?: string;
    roomSize?: number;
    bedType?: string;
  };
}

// Activity-specific interfaces
export interface UnifiedActivityOffer {
  id: string;
  name: string;
  location: UnifiedLocation;
  price: UnifiedPrice;
  rating?: UnifiedRating;
  description?: string;
  duration?: string;
  category?: string;
  images?: string[];
  availability?: {
    date: string;
    times: string[];
  }[];
  inclusions?: string[];
  exclusions?: string[];
  provider: {
    id: string;
    name: string;
    responseTime?: number;
  };
  metadata?: {
    difficulty?: string;
    ageRestriction?: string;
    groupSize?: number;
  };
}

// Generic unified response
export interface UnifiedResponse<T> {
  success: boolean;
  data: T[];
  provider: {
    id: string;
    name: string;
    responseTime: number;
  };
  meta: {
    total: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
    searchId?: string;
    timestamp: string;
  };
  errors?: string[];
  warnings?: string[];
}

// Provider-specific response transformers
export class ResponseTransformer {
  // Amadeus Flight Response Transformer
  static transformAmadeusFlightResponse(response: any, providerId: string, responseTime: number): UnifiedResponse<UnifiedFlightOffer> {
    try {
      const offers: UnifiedFlightOffer[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        for (const offer of response.data) {
          const transformedOffer = this.transformAmadeusFlightOffer(offer, providerId, responseTime);
          if (transformedOffer) {
            offers.push(transformedOffer);
          }
        }
      }

      return {
        success: true,
        data: offers,
        provider: {
          id: providerId,
          name: 'Amadeus',
          responseTime
        },
        meta: {
          total: offers.length,
          timestamp: new Date().toISOString(),
          searchId: response.meta?.searchId
        }
      };
    } catch (error) {
      logger.error('[TRANSFORMER] Amadeus flight response transformation failed:', error);
      throw new Error('Failed to transform Amadeus flight response');
    }
  }

  private static transformAmadeusFlightOffer(offer: any, providerId: string, responseTime: number): UnifiedFlightOffer | null {
    try {
      const segments: UnifiedFlightSegment[] = [];
      
      for (const itinerary of offer.itineraries || []) {
        for (const segment of itinerary.segments || []) {
          segments.push({
            departure: {
              code: segment.departure.iataCode,
              name: segment.departure.at,
              dateTime: segment.departure.at,
              type: 'airport'
            },
            arrival: {
              code: segment.arrival.iataCode,
              name: segment.arrival.at,
              dateTime: segment.arrival.at,
              type: 'airport'
            },
            airline: {
              code: segment.carrierCode,
              name: segment.carrierCode // Could be enhanced with airline name lookup
            },
            aircraft: segment.aircraft ? {
              code: segment.aircraft.code
            } : undefined,
            flightNumber: `${segment.carrierCode}${segment.number}`,
            duration: segment.duration || '',
            stops: 0, // Amadeus provides direct segments
            cabin: segment.cabin
          });
        }
      }

      return {
        id: offer.id,
        price: {
          amount: parseFloat(offer.price?.total || '0'),
          currency: offer.price?.currency || 'USD'
        },
        segments,
        validatingAirline: offer.validatingAirlineCodes?.[0] || '',
        lastTicketingDate: offer.lastTicketingDate,
        travelerPricings: offer.travelerPricings,
        isDirect: segments.length === 1,
        totalDuration: offer.itineraries?.[0]?.duration || '',
        provider: {
          id: providerId,
          name: 'Amadeus',
          responseTime
        },
        metadata: {
          fareType: offer.fareRules?.fareFamily || 'unknown',
          refundable: offer.fareRules?.refundable || false,
          changeable: offer.fareRules?.changeable || false
        }
      };
    } catch (error) {
      logger.warn('[TRANSFORMER] Failed to transform individual Amadeus flight offer:', error);
      return null;
    }
  }

  // Sabre Flight Response Transformer
  static transformSabreFlightResponse(response: any, providerId: string, responseTime: number): UnifiedResponse<UnifiedFlightOffer> {
    try {
      const offers: UnifiedFlightOffer[] = [];
      
      // Sabre response structure varies, adapt as needed
      const flights = response.PriceRequestResult?.FlightItineraryResult || 
                    response.GroupedItineraryResponse?.ScheduledFlightGroup || 
                    response.data || [];

      if (Array.isArray(flights)) {
        for (const flight of flights) {
          const transformedOffer = this.transformSabreFlightOffer(flight, providerId, responseTime);
          if (transformedOffer) {
            offers.push(transformedOffer);
          }
        }
      }

      return {
        success: true,
        data: offers,
        provider: {
          id: providerId,
          name: 'Sabre',
          responseTime
        },
        meta: {
          total: offers.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('[TRANSFORMER] Sabre flight response transformation failed:', error);
      throw new Error('Failed to transform Sabre flight response');
    }
  }

  private static transformSabreFlightOffer(flight: any, providerId: string, responseTime: number): UnifiedFlightOffer | null {
    try {
      const segments: UnifiedFlightSegment[] = [];
      const flightSegments = flight.FlightGroup?.Flight || flight.segments || [flight];

      for (const segment of Array.isArray(flightSegments) ? flightSegments : [flightSegments]) {
        segments.push({
          departure: {
            code: segment.DepartureAirport || segment.departure?.airport,
            name: segment.DepartureDateTime || segment.departure?.dateTime,
            dateTime: segment.DepartureDateTime || segment.departure?.dateTime,
            type: 'airport'
          },
          arrival: {
            code: segment.ArrivalAirport || segment.arrival?.airport,
            name: segment.ArrivalDateTime || segment.arrival?.dateTime,
            dateTime: segment.ArrivalDateTime || segment.arrival?.dateTime,
            type: 'airport'
          },
          airline: {
            code: segment.ValidatingCarrierCode || segment.airline?.code,
            name: segment.MarketingCarrier || segment.airline?.name
          },
          flightNumber: segment.FlightNumber || segment.flightNumber || '',
          duration: segment.FlightTime || segment.duration || '',
          stops: segment.StopQuantity || segment.stops || 0
        });
      }

      const price = flight.AirItineraryPricingInfo?.ItinTotalFare || flight.price || {};
      
      return {
        id: flight.id || `sabre_${Date.now()}_${Math.random()}`,
        price: {
          amount: parseFloat(price.TotalFare?.Amount || price.total || '0'),
          currency: price.TotalFare?.CurrencyCode || price.currency || 'USD'
        },
        segments,
        validatingAirline: segments[0]?.airline?.code || '',
        isDirect: segments.length === 1,
        totalDuration: flight.ElapsedTime || '',
        provider: {
          id: providerId,
          name: 'Sabre',
          responseTime
        }
      };
    } catch (error) {
      logger.warn('[TRANSFORMER] Failed to transform individual Sabre flight offer:', error);
      return null;
    }
  }

  // HotelBeds Hotel Response Transformer
  static transformHotelBedsHotelResponse(response: any, providerId: string, responseTime: number): UnifiedResponse<UnifiedHotelOffer> {
    try {
      const offers: UnifiedHotelOffer[] = [];
      
      const hotels = response.hotels?.hotels || response.data || [];

      if (Array.isArray(hotels)) {
        for (const hotel of hotels) {
          const transformedOffer = this.transformHotelBedsHotelOffer(hotel, providerId, responseTime);
          if (transformedOffer) {
            offers.push(transformedOffer);
          }
        }
      }

      return {
        success: true,
        data: offers,
        provider: {
          id: providerId,
          name: 'HotelBeds',
          responseTime
        },
        meta: {
          total: offers.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('[TRANSFORMER] HotelBeds hotel response transformation failed:', error);
      throw new Error('Failed to transform HotelBeds hotel response');
    }
  }

  private static transformHotelBedsHotelOffer(hotel: any, providerId: string, responseTime: number): UnifiedHotelOffer | null {
    try {
      const rates = hotel.rates || [];
      const minRate = rates.length > 0 ? Math.min(...rates.map((r: any) => parseFloat(r.net || r.price || '0'))) : 0;

      return {
        id: hotel.code || hotel.id,
        name: hotel.name,
        location: {
          code: hotel.destinationCode || hotel.location?.code,
          name: hotel.address || hotel.location?.name,
          city: hotel.city || hotel.location?.city,
          country: hotel.countryCode || hotel.location?.country,
          type: 'hotel'
        },
        price: {
          amount: minRate,
          currency: rates[0]?.currency || 'USD'
        },
        rating: hotel.rating ? {
          score: parseFloat(hotel.rating),
          maxScore: 5,
          reviews: 0
        } : undefined,
        starRating: hotel.categoryCode || hotel.category,
        description: hotel.description,
        amenities: hotel.facilities?.map((f: any) => f.description) || [],
        checkIn: hotel.checkIn,
        checkOut: hotel.checkOut,
        provider: {
          id: providerId,
          name: 'HotelBeds',
          responseTime
        }
      };
    } catch (error) {
      logger.warn('[TRANSFORMER] Failed to transform individual HotelBeds hotel offer:', error);
      return null;
    }
  }

  // HotelBeds Activity Response Transformer
  static transformHotelBedsActivityResponse(response: any, providerId: string, responseTime: number): UnifiedResponse<UnifiedActivityOffer> {
    try {
      const offers: UnifiedActivityOffer[] = [];
      
      const activities = response.activities || response.data || [];

      if (Array.isArray(activities)) {
        for (const activity of activities) {
          const transformedOffer = this.transformHotelBedsActivityOffer(activity, providerId, responseTime);
          if (transformedOffer) {
            offers.push(transformedOffer);
          }
        }
      }

      return {
        success: true,
        data: offers,
        provider: {
          id: providerId,
          name: 'HotelBeds',
          responseTime
        },
        meta: {
          total: offers.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('[TRANSFORMER] HotelBeds activity response transformation failed:', error);
      throw new Error('Failed to transform HotelBeds activity response');
    }
  }

  private static transformHotelBedsActivityOffer(activity: any, providerId: string, responseTime: number): UnifiedActivityOffer | null {
    try {
      const modalities = activity.modalities || [];
      const minPrice = modalities.length > 0 ? Math.min(...modalities.map((m: any) => parseFloat(m.amountUnitPrice?.amount || '0'))) : 0;

      return {
        id: activity.code || activity.id,
        name: activity.name,
        location: {
          code: activity.content?.location?.code || '',
          name: activity.content?.location?.name || activity.country?.name,
          city: activity.content?.location?.city,
          country: activity.country?.code,
          type: 'activity'
        },
        price: {
          amount: minPrice,
          currency: modalities[0]?.amountUnitPrice?.currency || 'USD'
        },
        description: activity.content?.description,
        duration: activity.content?.duration,
        category: activity.content?.category?.name,
        images: activity.content?.media?.map((m: any) => m.url) || [],
        provider: {
          id: providerId,
          name: 'HotelBeds',
          responseTime
        }
      };
    } catch (error) {
      logger.warn('[TRANSFORMER] Failed to transform individual HotelBeds activity offer:', error);
      return null;
    }
  }

  // Main transformation dispatcher
  static transformResponse(
    response: any, 
    providerType: 'amadeus' | 'sabre' | 'hotelbeds',
    serviceType: 'flight' | 'hotel' | 'activity',
    providerId: string,
    responseTime: number
  ): UnifiedResponse<any> {
    const transformKey = `${providerType}_${serviceType}`;
    
    switch (transformKey) {
      case 'amadeus_flight':
        return this.transformAmadeusFlightResponse(response, providerId, responseTime);
      
      case 'sabre_flight':
        return this.transformSabreFlightResponse(response, providerId, responseTime);
      
      case 'hotelbeds_hotel':
        return this.transformHotelBedsHotelResponse(response, providerId, responseTime);
      
      case 'hotelbeds_activity':
        return this.transformHotelBedsActivityResponse(response, providerId, responseTime);
      
      default:
        logger.warn(`[TRANSFORMER] No transformer found for ${transformKey}`);
        return {
          success: true,
          data: Array.isArray(response.data) ? response.data : [response],
          provider: {
            id: providerId,
            name: providerType,
            responseTime
          },
          meta: {
            total: Array.isArray(response.data) ? response.data.length : 1,
            timestamp: new Date().toISOString()
          },
          warnings: [`No specific transformer available for ${transformKey}`]
        };
    }
  }
}