import { z } from 'zod';
import { Tool, ToolResult } from './types';
import { supabase } from '@/integrations/supabase/client';

// Flight Search Tool
export const flightSearchTool: Tool = {
  definition: {
    name: 'search_flights',
    description: 'Search for flight options between two destinations',
    parameters: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin airport code (IATA)'
        },
        destination: {
          type: 'string', 
          description: 'Destination airport code (IATA)'
        },
        departureDate: {
          type: 'string',
          description: 'Departure date in ISO format (YYYY-MM-DD)'
        },
        returnDate: {
          type: 'string',
          description: 'Return date in ISO format (YYYY-MM-DD), optional for one-way'
        },
        passengers: {
          type: 'object',
          description: 'Passenger counts',
          properties: {
            adults: { type: 'number', description: 'Number of adults' },
            children: { type: 'number', description: 'Number of children' },
            infants: { type: 'number', description: 'Number of infants' }
          }
        },
        cabin: {
          type: 'string',
          description: 'Cabin class preference',
          enum: ['economy', 'premium_economy', 'business', 'first']
        }
      },
      required: ['origin', 'destination', 'departureDate', 'passengers']
    },
    category: 'travel'
  },
  schema: z.object({
    origin: z.string().length(3),
    destination: z.string().length(3),
    departureDate: z.string(),
    returnDate: z.string().optional(),
    passengers: z.object({
      adults: z.number().min(1),
      children: z.number().min(0),
      infants: z.number().min(0)
    }),
    cabin: z.enum(['economy', 'premium_economy', 'business', 'first']).optional()
  }),
  async execute(params, context): Promise<ToolResult> {
    try {
      // Call unified search function
      const { data, error } = await supabase.functions.invoke('unified-search', {
        body: {
          type: 'flight',
          query: {
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            adults: params.passengers.adults,
            children: params.passengers.children || 0,
            infants: params.passengers.infants || 0,
            cabin: params.cabin || 'economy'
          }
        }
      });

      if (error) throw error;

      return {
        id: context?.toolCallId || crypto.randomUUID(),
        success: true,
        result: {
          flights: data.flights || [],
          searchId: data.searchId,
          totalResults: data.flights?.length || 0
        }
      };
    } catch (error) {
      return {
        id: context?.toolCallId || crypto.randomUUID(),
        success: false,
        result: null,
        error: `Flight search failed: ${error.message}`
      };
    }
  }
};

// Hotel Search Tool
export const hotelSearchTool: Tool = {
  definition: {
    name: 'search_hotels',
    description: 'Search for hotel accommodations in a destination',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Destination city or hotel name'
        },
        checkIn: {
          type: 'string',
          description: 'Check-in date in ISO format (YYYY-MM-DD)'
        },
        checkOut: {
          type: 'string',
          description: 'Check-out date in ISO format (YYYY-MM-DD)'
        },
        guests: {
          type: 'object',
          description: 'Guest information',
          properties: {
            adults: { type: 'number', description: 'Number of adults' },
            children: { type: 'number', description: 'Number of children' },
            rooms: { type: 'number', description: 'Number of rooms' }
          }
        },
        filters: {
          type: 'object',
          description: 'Search filters',
          properties: {
            minPrice: { type: 'number', description: 'Minimum price per night' },
            maxPrice: { type: 'number', description: 'Maximum price per night' },
            stars: { type: 'array', description: 'Hotel star ratings' },
            amenities: { type: 'array', description: 'Required amenities' }
          }
        }
      },
      required: ['destination', 'checkIn', 'checkOut', 'guests']
    },
    category: 'travel'
  },
  async execute(params, context): Promise<ToolResult> {
    try {
      const { data, error } = await supabase.functions.invoke('unified-search', {
        body: {
          type: 'hotel',
          query: {
            destination: params.destination,
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            adults: params.guests.adults,
            children: params.guests.children || 0,
            rooms: params.guests.rooms || 1,
            ...params.filters
          }
        }
      });

      if (error) throw error;

      return {
        id: context?.toolCallId || crypto.randomUUID(),
        success: true,
        result: {
          hotels: data.hotels || [],
          searchId: data.searchId,
          totalResults: data.hotels?.length || 0
        }
      };
    } catch (error) {
      return {
        id: context?.toolCallId || crypto.randomUUID(),
        success: false,
        result: null,
        error: `Hotel search failed: ${error.message}`
      };
    }
  }
};

// Booking Status Tool
export const bookingStatusTool: Tool = {
  definition: {
    name: 'get_booking_status',
    description: 'Get the current status of a booking',
    parameters: {
      type: 'object',
      properties: {
        bookingReference: {
          type: 'string',
          description: 'Booking reference number'
        },
        bookingType: {
          type: 'string',
          description: 'Type of booking',
          enum: ['flight', 'hotel', 'activity', 'transfer']
        }
      },
      required: ['bookingReference']
    },
    category: 'booking'
  },
  async execute(params, context): Promise<ToolResult> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_reference,
          status,
          booking_type,
          total_amount,
          currency,
          booking_data,
          created_at,
          updated_at
        `)
        .eq('booking_reference', params.bookingReference)
        .single();

      if (error) throw error;

      return {
        id: context?.toolCallId || crypto.randomUUID(),
        success: true,
        result: {
          booking: data,
          status: data.status,
          reference: data.booking_reference
        }
      };
    } catch (error) {
      return {
        id: context?.toolCallId || crypto.randomUUID(),
        success: false,
        result: null,
        error: `Failed to get booking status: ${error.message}`
      };
    }
  }
};

// Activity Search Tool
export const activitySearchTool: Tool = {
  definition: {
    name: 'search_activities',
    description: 'Search for activities and experiences in a destination',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Destination city or location'
        },
        dateFrom: {
          type: 'string',
          description: 'Start date for activities (YYYY-MM-DD)'
        },
        dateTo: {
          type: 'string',
          description: 'End date for activities (YYYY-MM-DD)'
        },
        category: {
          type: 'string',
          description: 'Activity category',
          enum: ['cultural', 'adventure', 'nature', 'food', 'entertainment', 'sports']
        },
        participants: {
          type: 'number',
          description: 'Number of participants'
        }
      },
      required: ['destination', 'dateFrom']
    },
    category: 'travel'
  },
  async execute(params, context): Promise<ToolResult> {
    try {
      const { data, error } = await supabase.functions.invoke('unified-search', {
        body: {
          type: 'activity',
          query: {
            destination: params.destination,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            category: params.category,
            participants: params.participants || 1
          }
        }
      });

      if (error) throw error;

      return {
        id: context?.toolCallId || crypto.randomUUID(),
        success: true,
        result: {
          activities: data.activities || [],
          searchId: data.searchId,
          totalResults: data.activities?.length || 0
        }
      };
    } catch (error) {
      return {
        id: context?.toolCallId || crypto.randomUUID(),
        success: false,
        result: null,
        error: `Activity search failed: ${error.message}`
      };
    }
  }
};