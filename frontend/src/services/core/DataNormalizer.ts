import { z } from 'zod';
import logger from '@/utils/logger';

// Unified schemas for all travel products
export const UnifiedFlightSchema = z.object({
  id: z.string(),
  provider: z.string(),
  itineraries: z.array(z.object({
    segments: z.array(z.object({
      departure: z.object({
        iataCode: z.string(),
        terminal: z.string().optional(),
        at: z.string()
      }),
      arrival: z.object({
        iataCode: z.string(),
        terminal: z.string().optional(),
        at: z.string()
      }),
      carrierCode: z.string(),
      number: z.string(),
      aircraft: z.object({
        code: z.string()
      }).optional(),
      duration: z.string().optional(),
      operating: z.object({
        carrierCode: z.string()
      }).optional()
    }))
  })),
  price: z.object({
    currency: z.string(),
    total: z.number(),
    base: z.number().optional(),
    fees: z.array(z.object({
      amount: z.number(),
      type: z.string()
    })).optional(),
    taxes: z.array(z.object({
      amount: z.number(),
      code: z.string()
    })).optional()
  }),
  pricingOptions: z.object({
    fareType: z.array(z.string()),
    includedCheckedBagsOnly: z.boolean()
  }).optional(),
  validatingAirlineCodes: z.array(z.string()),
  travelerPricings: z.array(z.object({
    travelerId: z.string(),
    fareOption: z.string(),
    travelerType: z.string(),
    price: z.object({
      currency: z.string(),
      total: z.number(),
      base: z.number().optional()
    })
  }))
});

export const UnifiedHotelSchema = z.object({
  id: z.string(),
  provider: z.string(),
  name: z.string(),
  hotelId: z.string(),
  chainCode: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.object({
      lines: z.array(z.string()),
      postalCode: z.string().optional(),
      cityName: z.string(),
      countryCode: z.string()
    })
  }),
  contact: z.object({
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().optional()
  }).optional(),
  description: z.object({
    lang: z.string(),
    text: z.string()
  }).optional(),
  amenities: z.array(z.string()).optional(),
  rating: z.number().optional(),
  offers: z.array(z.object({
    id: z.string(),
    checkInDate: z.string(),
    checkOutDate: z.string(),
    rateCode: z.string().optional(),
    rateFamilyEstimated: z.object({
      code: z.string(),
      type: z.string()
    }).optional(),
    room: z.object({
      type: z.string(),
      typeEstimated: z.object({
        category: z.string(),
        beds: z.number().optional(),
        bedType: z.string().optional()
      }).optional(),
      description: z.object({
        text: z.string(),
        lang: z.string()
      }).optional()
    }),
    guests: z.object({
      adults: z.number(),
      childAges: z.array(z.number()).optional()
    }),
    price: z.object({
      currency: z.string(),
      base: z.number(),
      total: z.number(),
      variations: z.object({
        average: z.object({
          base: z.number()
        }),
        changes: z.array(z.object({
          startDate: z.string(),
          endDate: z.string(),
          base: z.number()
        }))
      }).optional()
    }),
    policies: z.object({
      paymentType: z.string().optional(),
      cancellation: z.object({
        deadline: z.string().optional(),
        amount: z.number().optional(),
        type: z.string().optional()
      }).optional()
    }).optional(),
    self: z.string().optional()
  }))
});

export const UnifiedActivitySchema = z.object({
  id: z.string(),
  provider: z.string(),
  name: z.string(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional()
  }),
  pictures: z.array(z.string()).optional(),
  bookingLink: z.string(),
  price: z.object({
    currency: z.string(),
    amount: z.number()
  }),
  minimumDuration: z.string().optional(),
  rating: z.number().optional(),
  tags: z.array(z.string()).optional()
});

export type UnifiedFlight = z.infer<typeof UnifiedFlightSchema>;
export type UnifiedHotel = z.infer<typeof UnifiedHotelSchema>;
export type UnifiedActivity = z.infer<typeof UnifiedActivitySchema>;

interface ProviderTransformer<TInput, TOutput> {
  transform(data: TInput, correlationId?: string): Promise<TOutput[]>;
  validate(data: TOutput): boolean;
  enrich(data: TOutput[]): Promise<TOutput[]>;
}

class AmadeusFlightTransformer implements ProviderTransformer<any, UnifiedFlight> {
  async transform(amadeusData: any, correlationId?: string): Promise<UnifiedFlight[]> {
    try {
      const offers = amadeusData.data || [];
      
      return offers.map((offer: any) => {
        const transformed: UnifiedFlight = {
          id: offer.id,
          provider: 'amadeus',
          itineraries: offer.itineraries?.map((itinerary: any) => ({
            segments: itinerary.segments?.map((segment: any) => ({
              departure: {
                iataCode: segment.departure?.iataCode || '',
                terminal: segment.departure?.terminal,
                at: segment.departure?.at || ''
              },
              arrival: {
                iataCode: segment.arrival?.iataCode || '',
                terminal: segment.arrival?.terminal,
                at: segment.arrival?.at || ''
              },
              carrierCode: segment.carrierCode || '',
              number: segment.number || '',
              aircraft: segment.aircraft ? {
                code: segment.aircraft.code
              } : undefined,
              duration: segment.duration,
              operating: segment.operating ? {
                carrierCode: segment.operating.carrierCode
              } : undefined
            })) || []
          })) || [],
          price: {
            currency: offer.price?.currency || 'USD',
            total: parseFloat(offer.price?.total || '0'),
            base: offer.price?.base ? parseFloat(offer.price.base) : undefined,
            fees: offer.price?.fees?.map((fee: any) => ({
              amount: parseFloat(fee.amount || '0'),
              type: fee.type || ''
            })),
            taxes: offer.price?.taxes?.map((tax: any) => ({
              amount: parseFloat(tax.amount || '0'),
              code: tax.code || ''
            }))
          },
          pricingOptions: offer.pricingOptions ? {
            fareType: offer.pricingOptions.fareType || [],
            includedCheckedBagsOnly: offer.pricingOptions.includedCheckedBagsOnly || false
          } : undefined,
          validatingAirlineCodes: offer.validatingAirlineCodes || [],
          travelerPricings: offer.travelerPricings?.map((pricing: any) => ({
            travelerId: pricing.travelerId || '',
            fareOption: pricing.fareOption || '',
            travelerType: pricing.travelerType || '',
            price: {
              currency: pricing.price?.currency || 'USD',
              total: parseFloat(pricing.price?.total || '0'),
              base: pricing.price?.base ? parseFloat(pricing.price.base) : undefined
            }
          })) || []
        };

        return transformed;
      });
    } catch (error) {
      logger.error('Amadeus flight transformation error:', { error, correlationId });
      return [];
    }
  }

  validate(data: UnifiedFlight): boolean {
    try {
      UnifiedFlightSchema.parse(data);
      return true;
    } catch (error) {
      logger.warn('Flight validation failed:', { error, data });
      return false;
    }
  }

  async enrich(data: UnifiedFlight[]): Promise<UnifiedFlight[]> {
    // Add enrichment logic (airline names, airport details, etc.)
    return data;
  }
}

class AmadeusHotelTransformer implements ProviderTransformer<any, UnifiedHotel> {
  async transform(amadeusData: any, correlationId?: string): Promise<UnifiedHotel[]> {
    try {
      const hotels = amadeusData.data || [];
      
      return hotels.map((hotel: any) => {
        const transformed: UnifiedHotel = {
          id: hotel.hotel?.hotelId || hotel.hotelId || '',
          provider: 'amadeus',
          name: hotel.hotel?.name || '',
          hotelId: hotel.hotel?.hotelId || hotel.hotelId || '',
          chainCode: hotel.hotel?.chainCode,
          location: {
            latitude: parseFloat(hotel.hotel?.latitude || '0'),
            longitude: parseFloat(hotel.hotel?.longitude || '0'),
            address: {
              lines: hotel.hotel?.address?.lines || [],
              postalCode: hotel.hotel?.address?.postalCode,
              cityName: hotel.hotel?.address?.cityName || '',
              countryCode: hotel.hotel?.address?.countryCode || ''
            }
          },
          contact: hotel.hotel?.contact ? {
            phone: hotel.hotel.contact.phone,
            fax: hotel.hotel.contact.fax,
            email: hotel.hotel.contact.email
          } : undefined,
          description: hotel.hotel?.description ? {
            lang: hotel.hotel.description.lang || 'en',
            text: hotel.hotel.description.text || ''
          } : undefined,
          amenities: hotel.hotel?.amenities || [],
          rating: hotel.hotel?.rating ? parseFloat(hotel.hotel.rating) : undefined,
          offers: hotel.offers?.map((offer: any) => ({
            id: offer.id || '',
            checkInDate: offer.checkInDate || '',
            checkOutDate: offer.checkOutDate || '',
            rateCode: offer.rateCode,
            rateFamilyEstimated: offer.rateFamilyEstimated ? {
              code: offer.rateFamilyEstimated.code || '',
              type: offer.rateFamilyEstimated.type || ''
            } : undefined,
            room: {
              type: offer.room?.type || '',
              typeEstimated: offer.room?.typeEstimated ? {
                category: offer.room.typeEstimated.category || '',
                beds: offer.room.typeEstimated.beds,
                bedType: offer.room.typeEstimated.bedType
              } : undefined,
              description: offer.room?.description ? {
                text: offer.room.description.text || '',
                lang: offer.room.description.lang || 'en'
              } : undefined
            },
            guests: {
              adults: offer.guests?.adults || 1,
              childAges: offer.guests?.childAges || []
            },
            price: {
              currency: offer.price?.currency || 'USD',
              base: parseFloat(offer.price?.base || '0'),
              total: parseFloat(offer.price?.total || '0'),
              variations: offer.price?.variations ? {
                average: {
                  base: parseFloat(offer.price.variations.average?.base || '0')
                },
                changes: offer.price.variations.changes?.map((change: any) => ({
                  startDate: change.startDate || '',
                  endDate: change.endDate || '',
                  base: parseFloat(change.base || '0')
                })) || []
              } : undefined
            },
            policies: offer.policies ? {
              paymentType: offer.policies.paymentType,
              cancellation: offer.policies.cancellation ? {
                deadline: offer.policies.cancellation.deadline,
                amount: offer.policies.cancellation.amount ? parseFloat(offer.policies.cancellation.amount) : undefined,
                type: offer.policies.cancellation.type
              } : undefined
            } : undefined,
            self: offer.self
          })) || []
        };

        return transformed;
      });
    } catch (error) {
      logger.error('Amadeus hotel transformation error:', { error, correlationId });
      return [];
    }
  }

  validate(data: UnifiedHotel): boolean {
    try {
      UnifiedHotelSchema.parse(data);
      return true;
    } catch (error) {
      logger.warn('Hotel validation failed:', { error, data });
      return false;
    }
  }

  async enrich(data: UnifiedHotel[]): Promise<UnifiedHotel[]> {
    // Add enrichment logic (photos, reviews, etc.)
    return data;
  }
}

class HotelBedsActivityTransformer implements ProviderTransformer<any, UnifiedActivity> {
  async transform(hotelBedsData: any, correlationId?: string): Promise<UnifiedActivity[]> {
    try {
      const activities = hotelBedsData.activities || [];
      
      return activities.map((activity: any) => {
        const transformed: UnifiedActivity = {
          id: activity.code || '',
          provider: 'hotelbeds',
          name: activity.name || '',
          shortDescription: activity.shortDescription,
          description: activity.description,
          location: {
            latitude: parseFloat(activity.geoLocation?.latitude || '0'),
            longitude: parseFloat(activity.geoLocation?.longitude || '0'),
            address: activity.geoLocation?.address
          },
          pictures: activity.pictures?.map((pic: any) => pic.URL) || [],
          bookingLink: activity.activityCode || '',
          price: {
            currency: activity.amountsFrom?.[0]?.currency || 'USD',
            amount: parseFloat(activity.amountsFrom?.[0]?.amount || '0')
          },
          minimumDuration: activity.minimumDuration,
          rating: activity.rating ? parseFloat(activity.rating) : undefined,
          tags: activity.segmentationGroups?.map((group: any) => group.name) || []
        };

        return transformed;
      });
    } catch (error) {
      logger.error('HotelBeds activity transformation error:', { error, correlationId });
      return [];
    }
  }

  validate(data: UnifiedActivity): boolean {
    try {
      UnifiedActivitySchema.parse(data);
      return true;
    } catch (error) {
      logger.warn('Activity validation failed:', { error, data });
      return false;
    }
  }

  async enrich(data: UnifiedActivity[]): Promise<UnifiedActivity[]> {
    // Add enrichment logic (reviews, availability, etc.)
    return data;
  }
}

export class DataNormalizer {
  private transformers = {
    amadeus: {
      flight: new AmadeusFlightTransformer(),
      hotel: new AmadeusHotelTransformer()
    },
    hotelbeds: {
      activity: new HotelBedsActivityTransformer()
    }
  };

  async normalizeFlights(providerData: Record<string, any>, correlationId?: string): Promise<UnifiedFlight[]> {
    const results: UnifiedFlight[] = [];
    
    for (const [provider, data] of Object.entries(providerData)) {
      try {
        if (provider === 'amadeus' && this.transformers.amadeus.flight) {
          const normalized = await this.transformers.amadeus.flight.transform(data, correlationId);
          const validated = normalized.filter(item => this.transformers.amadeus.flight.validate(item));
          const enriched = await this.transformers.amadeus.flight.enrich(validated);
          results.push(...enriched);
        }
      } catch (error) {
        logger.error(`Flight normalization error for ${provider}:`, { error, correlationId });
      }
    }

    return this.deduplicateFlights(results);
  }

  async normalizeHotels(providerData: Record<string, any>, correlationId?: string): Promise<UnifiedHotel[]> {
    const results: UnifiedHotel[] = [];
    
    for (const [provider, data] of Object.entries(providerData)) {
      try {
        if (provider === 'amadeus' && this.transformers.amadeus.hotel) {
          const normalized = await this.transformers.amadeus.hotel.transform(data, correlationId);
          const validated = normalized.filter(item => this.transformers.amadeus.hotel.validate(item));
          const enriched = await this.transformers.amadeus.hotel.enrich(validated);
          results.push(...enriched);
        }
      } catch (error) {
        logger.error(`Hotel normalization error for ${provider}:`, { error, correlationId });
      }
    }

    return this.deduplicateHotels(results);
  }

  async normalizeActivities(providerData: Record<string, any>, correlationId?: string): Promise<UnifiedActivity[]> {
    const results: UnifiedActivity[] = [];
    
    for (const [provider, data] of Object.entries(providerData)) {
      try {
        if (provider === 'hotelbeds' && this.transformers.hotelbeds.activity) {
          const normalized = await this.transformers.hotelbeds.activity.transform(data, correlationId);
          const validated = normalized.filter(item => this.transformers.hotelbeds.activity.validate(item));
          const enriched = await this.transformers.hotelbeds.activity.enrich(validated);
          results.push(...enriched);
        }
      } catch (error) {
        logger.error(`Activity normalization error for ${provider}:`, { error, correlationId });
      }
    }

    return this.deduplicateActivities(results);
  }

  private deduplicateFlights(flights: UnifiedFlight[]): UnifiedFlight[] {
    const seen = new Set<string>();
    return flights.filter(flight => {
      const key = `${flight.itineraries[0]?.segments[0]?.departure.iataCode}-${flight.itineraries[0]?.segments[0]?.departure.at}-${flight.price.total}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateHotels(hotels: UnifiedHotel[]): UnifiedHotel[] {
    const seen = new Set<string>();
    return hotels.filter(hotel => {
      const key = `${hotel.hotelId}-${hotel.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateActivities(activities: UnifiedActivity[]): UnifiedActivity[] {
    const seen = new Set<string>();
    return activities.filter(activity => {
      const key = `${activity.id}-${activity.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const dataNormalizer = new DataNormalizer();