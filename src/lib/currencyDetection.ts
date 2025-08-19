// Currency detection based on flight routes and locations
// No fallbacks - returns appropriate currency for the region

interface CurrencyMapping {
  [key: string]: string;
}

// Airport code to currency mapping
const AIRPORT_CURRENCY_MAP: CurrencyMapping = {
  // Australia
  'SYD': 'AUD', 'MEL': 'AUD', 'BNE': 'AUD', 'PER': 'AUD', 'ADL': 'AUD', 'DRW': 'AUD', 'CNS': 'AUD', 'OOL': 'AUD',
  
  // India
  'DEL': 'INR', 'BOM': 'INR', 'BLR': 'INR', 'MAA': 'INR', 'CCU': 'INR', 'HYD': 'INR', 'PNQ': 'INR', 'AMD': 'INR',
  'COK': 'INR', 'TRV': 'INR', 'GOI': 'INR', 'IXC': 'INR', 'JAI': 'INR', 'LKO': 'INR', 'PAT': 'INR', 'IXB': 'INR',
  
  // Europe
  'LHR': 'EUR', 'CDG': 'EUR', 'FRA': 'EUR', 'AMS': 'EUR', 'FCO': 'EUR', 'BCN': 'EUR', 'MAD': 'EUR', 'MUC': 'EUR',
  'ZUR': 'EUR', 'VIE': 'EUR', 'BRU': 'EUR', 'CPH': 'EUR', 'ARN': 'EUR', 'HEL': 'EUR', 'OSL': 'EUR', 'DUB': 'EUR',
  
  // UK (specifically GBP)
  'LGW': 'GBP', 'STN': 'GBP', 'LTN': 'GBP', 'MAN': 'GBP', 'EDI': 'GBP', 'GLA': 'GBP', 'BHX': 'GBP',
  
  // Southeast Asia - International USD
  'SIN': 'USD', 'BKK': 'USD', 'KUL': 'USD', 'CGK': 'USD', 'MNL': 'USD', 'HKG': 'USD', 'TPE': 'USD',
  
  // East Asia
  'NRT': 'JPY', 'HND': 'JPY', 'KIX': 'JPY', 'ICN': 'KRW', 'PVG': 'CNY', 'PEK': 'CNY', 'CAN': 'CNY',
  
  // Middle East
  'DXB': 'USD', 'DOH': 'USD', 'AUH': 'USD', 'RUH': 'USD', 'JED': 'USD', 'KWI': 'USD',
  
  // North America
  'JFK': 'USD', 'LAX': 'USD', 'ORD': 'USD', 'DFW': 'USD', 'ATL': 'USD', 'DEN': 'USD', 'SEA': 'USD', 'SFO': 'USD',
  'YYZ': 'CAD', 'YVR': 'CAD', 'YUL': 'CAD'
};

// Country code to currency mapping for location-based detection
const COUNTRY_CURRENCY_MAP: CurrencyMapping = {
  'AU': 'AUD', 'IN': 'INR', 'GB': 'GBP', 'JP': 'JPY', 'KR': 'KRW', 'CN': 'CNY',
  'SG': 'USD', 'TH': 'USD', 'MY': 'USD', 'ID': 'USD', 'PH': 'USD', 'HK': 'USD',
  'AE': 'USD', 'QA': 'USD', 'SA': 'USD', 'KW': 'USD',
  'US': 'USD', 'CA': 'CAD'
};

/**
 * Detects appropriate currency based on flight route
 * Priority: Domestic routes -> Origin airport -> Destination airport
 */
export const detectFlightCurrency = (origin: string, destination: string): string => {
  const originCurrency = AIRPORT_CURRENCY_MAP[origin];
  const destinationCurrency = AIRPORT_CURRENCY_MAP[destination];
  
  // If both airports are in the same currency region (domestic route)
  if (originCurrency && destinationCurrency && originCurrency === destinationCurrency) {
    return originCurrency;
  }
  
  // For international routes, use origin airport currency
  if (originCurrency) {
    return originCurrency;
  }
  
  // If origin not mapped, use destination currency
  if (destinationCurrency) {
    return destinationCurrency;
  }
  
  // If neither airport is mapped, use USD as international standard
  return 'USD';
};

/**
 * Detects currency based on location (for hotels, cars, activities)
 */
export const detectLocationCurrency = (locationCode: string, countryCode?: string): string => {
  // Try airport code first
  const airportCurrency = AIRPORT_CURRENCY_MAP[locationCode];
  if (airportCurrency) {
    return airportCurrency;
  }
  
  // Try country code
  if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
    return COUNTRY_CURRENCY_MAP[countryCode];
  }
  
  // Default to USD for international bookings
  return 'USD';
};

/**
 * Get supported currencies for validation
 */
export const getSupportedCurrencies = (): string[] => {
  return ['USD', 'AUD', 'EUR', 'GBP', 'INR', 'JPY', 'KRW', 'CNY', 'CAD'];
};

/**
 * Validate if currency is supported by both Amadeus and Stripe
 */
export const isCurrencySupported = (currency: string): boolean => {
  return getSupportedCurrencies().includes(currency);
};