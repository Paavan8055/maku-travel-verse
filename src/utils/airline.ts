// Airline utility functions for flight display

export interface AirlineData {
  iata: string;
  icao: string;
  name: string;
  logo: string;
}

// Common airline logos - using reliable CDN for airline logos
const AIRLINE_LOGOS: Record<string, string> = {
  // US Airlines
  'AA': 'https://pics.avs.io/200/100/AA.png',
  'UA': 'https://pics.avs.io/200/100/UA.png',
  'DL': 'https://pics.avs.io/200/100/DL.png',
  'WN': 'https://pics.avs.io/200/100/WN.png',
  'B6': 'https://pics.avs.io/200/100/B6.png',
  'NK': 'https://pics.avs.io/200/100/NK.png',
  'F9': 'https://pics.avs.io/200/100/F9.png',
  'AS': 'https://pics.avs.io/200/100/AS.png',
  
  // Australian Airlines
  'QF': 'https://pics.avs.io/200/100/QF.png',
  'JQ': 'https://pics.avs.io/200/100/JQ.png',
  'VA': 'https://pics.avs.io/200/100/VA.png',
  'TT': 'https://pics.avs.io/200/100/TT.png',
  'ZL': 'https://pics.avs.io/200/100/ZL.png',
  
  // European Airlines  
  'LH': 'https://pics.avs.io/200/100/LH.png',
  'AF': 'https://pics.avs.io/200/100/AF.png',
  'BA': 'https://pics.avs.io/200/100/BA.png',
  'KL': 'https://pics.avs.io/200/100/KL.png',
  'LX': 'https://pics.avs.io/200/100/LX.png',
  
  // Asian Airlines
  'SQ': 'https://pics.avs.io/200/100/SQ.png',
  'CX': 'https://pics.avs.io/200/100/CX.png',
  'NH': 'https://pics.avs.io/200/100/NH.png', // ANA (corrected IATA code)
  'JL': 'https://pics.avs.io/200/100/JL.png', // JAL (corrected IATA code)
  'TG': 'https://pics.avs.io/200/100/TG.png',
  
  // Test/Demo Airlines
  'ZZ': '/placeholder-airline.svg'
};

// Common airline names
const AIRLINE_NAMES: Record<string, string> = {
  'AA': 'American Airlines',
  'UA': 'United Airlines', 
  'DL': 'Delta Air Lines',
  'WN': 'Southwest Airlines',
  'B6': 'JetBlue Airways',
  'NK': 'Spirit Airlines',
  'F9': 'Frontier Airlines',
  'AS': 'Alaska Airlines',
  
  // Australian Airlines
  'QF': 'Qantas',
  'JQ': 'Jetstar Airways',
  'VA': 'Virgin Australia',
  'TT': 'Tigerair Australia',
  'ZL': 'Rex Airlines',
  
  // European Airlines
  'LH': 'Lufthansa',
  'AF': 'Air France',
  'BA': 'British Airways', 
  'KL': 'KLM',
  'LX': 'Swiss International Air Lines',
  
  // Asian Airlines
  'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific',
  'NH': 'ANA',
  'JL': 'Japan Airlines',
  'TG': 'Thai Airways',
  
  // Test/Demo Airlines
  'ZZ': 'Demo Airways'
};

export const getAirlineLogo = (iataCode: string): string => {
  if (!iataCode) return '/placeholder-airline.svg';
  
  const code = iataCode.toUpperCase();
  return AIRLINE_LOGOS[code] || '/placeholder-airline.svg';
};

export const getAirlineName = (iataCode: string): string => {
  if (!iataCode) return 'Unknown Airline';
  
  const code = iataCode.toUpperCase();
  return AIRLINE_NAMES[code] || `${code} Airlines`;
};

export const formatFlightNumber = (carrierCode: string, flightNumber: string): string => {
  if (!carrierCode || !flightNumber) return 'Unknown';
  
  // Remove carrier code from flight number if it's duplicated
  const cleanFlightNumber = flightNumber.replace(new RegExp(`^${carrierCode}`, 'i'), '');
  return `${carrierCode.toUpperCase()}${cleanFlightNumber}`;
};

export const getAirlineData = (iataCode: string): AirlineData => {
  const code = iataCode?.toUpperCase() || '';
  return {
    iata: code,
    icao: '', // Could be expanded with ICAO codes if needed
    name: getAirlineName(code),
    logo: getAirlineLogo(code)
  };
};