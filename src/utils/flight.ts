// Flight data utilities for consistent formatting and parsing

export interface FlightTime {
  time: string;
  airport: string;
  city?: string;
}

export interface FlightPrice {
  total: number | string;
  currency: string;
  base?: number;
  taxes?: number;
}

export interface StandardizedFlight {
  id: string;
  flightNumber: string;
  carrier: string;
  carrierName: string;
  aircraft?: string;
  departure: FlightTime;
  arrival: FlightTime;
  duration: string;
  price: FlightPrice;
  stops?: number;
  amenities?: {
    wifi?: boolean;
    meals?: boolean;
    entertainment?: boolean;
    baggage?: boolean;
  };
  cabinClass?: string;
  availableSeats?: number;
  provider?: string;
  offerId?: string;
}

/**
 * Parse ISO duration string (PT1H31M) to human readable format (1h 31m)
 */
export const parseDuration = (duration: string): string => {
  if (!duration) return '0h 0m';
  
  // Handle ISO 8601 duration format (PT1H31M)
  if (duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      }
    }
  }
  
  // Handle already formatted duration (1h 31m)
  if (duration.match(/^\d+h\s?\d*m?$/)) {
    return duration;
  }
  
  // Handle decimal hours (1.5 -> 1h 30m)
  const numericDuration = parseFloat(duration);
  if (!isNaN(numericDuration)) {
    const hours = Math.floor(numericDuration);
    const minutes = Math.round((numericDuration - hours) * 60);
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    }
  }
  
  return duration;
};

/**
 * Format time from ISO string to HH:MM format
 */
export const formatFlightTime = (timeString: string): string => {
  if (!timeString) return '00:00';
  
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      // If not a valid ISO string, try to extract time portion
      const timeMatch = timeString.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]}`;
      }
      return timeString;
    }
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    console.warn('Error formatting flight time:', timeString, error);
    return timeString;
  }
};

/**
 * Calculate stops from flight segments
 */
export const calculateStops = (segments?: any[]): number => {
  if (!segments || !Array.isArray(segments)) return 0;
  return Math.max(0, segments.length - 1);
};

/**
 * Transform Duffel flight data to standardized format
 */
export const transformDuffelFlight = (duffelFlight: any): StandardizedFlight => {
  const firstSlice = duffelFlight.slices?.[0];
  const firstSegment = firstSlice?.segments?.[0];
  const lastSegment = firstSlice?.segments?.[firstSlice.segments.length - 1];
  
  return {
    id: duffelFlight.offer_id || duffelFlight.id || 'unknown',
    flightNumber: firstSegment?.flight_number || 'Unknown',
    carrier: firstSegment?.marketing_carrier_iata || 'XX',
    carrierName: firstSegment?.marketing_carrier || 'Unknown Airline',
    aircraft: firstSegment?.aircraft || 'Unknown Aircraft',
    departure: {
      time: formatFlightTime(firstSegment?.depart_at || ''),
      airport: firstSlice?.origin || 'Unknown',
      city: firstSlice?.origin || 'Unknown'
    },
    arrival: {
      time: formatFlightTime(lastSegment?.arrive_at || ''),
      airport: firstSlice?.destination || 'Unknown', 
      city: firstSlice?.destination || 'Unknown'
    },
    duration: parseDuration(firstSlice?.duration || ''),
    price: {
      total: parseFloat(duffelFlight.total_amount || '0'),
      currency: duffelFlight.total_currency || 'USD'
    },
    stops: calculateStops(firstSlice?.segments),
    provider: 'Duffel',
    offerId: duffelFlight.offer_id
  };
};

/**
 * Transform Amadeus flight data to standardized format
 */
export const transformAmadeusFlight = (amadeusData: any): StandardizedFlight => {
  // Implementation for Amadeus data structure
  return {
    id: amadeusData.id || 'unknown',
    flightNumber: amadeusData.flightNumber || 'Unknown',
    carrier: amadeusData.carrier || 'XX',
    carrierName: amadeusData.carrierName || 'Unknown Airline',
    aircraft: amadeusData.aircraft,
    departure: {
      time: formatFlightTime(amadeusData.departure?.time || ''),
      airport: amadeusData.departure?.airport || 'Unknown'
    },
    arrival: {
      time: formatFlightTime(amadeusData.arrival?.time || ''),
      airport: amadeusData.arrival?.airport || 'Unknown'
    },
    duration: parseDuration(amadeusData.duration || ''),
    price: {
      total: parseFloat(amadeusData.price?.amount || '0'),
      currency: amadeusData.price?.currency || 'USD'
    },
    stops: amadeusData.stops || 0,
    provider: 'Amadeus'
  };
};

/**
 * Transform Sabre flight data to standardized format  
 */
export const transformSabreFlight = (sabreData: any): StandardizedFlight => {
  // Implementation for Sabre data structure
  return {
    id: sabreData.id || 'unknown',
    flightNumber: sabreData.flightNumber || 'Unknown',
    carrier: sabreData.airline || 'XX',
    carrierName: sabreData.airline || 'Unknown Airline',
    aircraft: sabreData.aircraft,
    departure: {
      time: sabreData.departure || '00:00',
      airport: sabreData.origin || 'Unknown'
    },
    arrival: {
      time: sabreData.arrival || '00:00', 
      airport: sabreData.destination || 'Unknown'
    },
    duration: parseDuration(sabreData.duration || ''),
    price: {
      total: parseFloat(sabreData.price?.amount || '0'),
      currency: sabreData.price?.currency || 'AUD'
    },
    stops: 0,
    provider: 'Sabre'
  };
};

/**
 * Auto-detect provider and transform flight data
 */
export const standardizeFlightData = (flightData: any, provider?: string): StandardizedFlight => {
  if (!flightData) {
    throw new Error('Flight data is required');
  }
  
  // Auto-detect provider if not specified
  if (!provider) {
    if (flightData.offer_id || flightData.slices) {
      provider = 'Duffel';
    } else if (flightData.airline && flightData.bookingClass) {
      provider = 'Sabre';
    } else {
      provider = 'Amadeus';
    }
  }
  
  switch (provider?.toLowerCase()) {
    case 'duffel':
      return transformDuffelFlight(flightData);
    case 'amadeus':
      return transformAmadeusFlight(flightData);
    case 'sabre':
      return transformSabreFlight(flightData);
    default:
      // Fallback - try to extract what we can
      return {
        id: flightData.id || 'unknown',
        flightNumber: flightData.flightNumber || flightData.flight_number || 'Unknown',
        carrier: flightData.carrier || flightData.validatingAirlineCodes?.[0] || 'XX',
        carrierName: flightData.carrierName || 'Unknown Airline',
        aircraft: flightData.aircraft,
        departure: {
          time: formatFlightTime(flightData.departure?.time || flightData.departureTime || ''),
          airport: flightData.departure?.airport || flightData.origin || 'Unknown'
        },
        arrival: {
          time: formatFlightTime(flightData.arrival?.time || flightData.arrivalTime || ''),
          airport: flightData.arrival?.airport || flightData.destination || 'Unknown'
        },
        duration: parseDuration(flightData.duration || ''),
        price: {
          total: parseFloat(flightData.price?.total || flightData.totalPrice || '0'),
          currency: flightData.price?.currency || 'USD'
        },
        stops: flightData.stops || 0,
        provider: provider || 'Unknown'
      };
  }
};