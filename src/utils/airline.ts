// Airline utility functions for flight display

export interface AirlineData {
  iata: string;
  icao: string;
  name: string;
  logo: string;
}

// Common airline logos - using public CDN for airline logos
const AIRLINE_LOGOS: Record<string, string> = {
  'AA': 'https://logos-world.net/wp-content/uploads/2020/03/American-Airlines-Logo.png',
  'UA': 'https://logos-world.net/wp-content/uploads/2020/03/United-Airlines-Logo.png',
  'DL': 'https://logos-world.net/wp-content/uploads/2020/03/Delta-Air-Lines-Logo.png',
  'WN': 'https://logos-world.net/wp-content/uploads/2020/03/Southwest-Airlines-Logo.png',
  'B6': 'https://logos-world.net/wp-content/uploads/2020/03/JetBlue-Logo.png',
  'NK': 'https://logos-world.net/wp-content/uploads/2020/03/Spirit-Airlines-Logo.png',
  'F9': 'https://logos-world.net/wp-content/uploads/2020/03/Frontier-Airlines-Logo.png',
  'AS': 'https://logos-world.net/wp-content/uploads/2020/03/Alaska-Airlines-Logo.png',
  
  // Australian Airlines
  'QF': 'https://logos-world.net/wp-content/uploads/2020/03/Qantas-Logo.png',
  'JQ': 'https://logos-world.net/wp-content/uploads/2020/03/Jetstar-Airways-Logo.png',
  'VA': 'https://logos-world.net/wp-content/uploads/2020/03/Virgin-Australia-Logo.png',
  'TT': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvmqE2k7Y7yZLJdIkP8FTlYqGRQVJJ9HJU3Q&s',
  'ZL': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Rex_Airlines_logo.svg/1200px-Rex_Airlines_logo.svg.png',
  
  // European Airlines  
  'LH': 'https://logos-world.net/wp-content/uploads/2020/03/Lufthansa-Logo.png',
  'AF': 'https://logos-world.net/wp-content/uploads/2020/03/Air-France-Logo.png',
  'BA': 'https://logos-world.net/wp-content/uploads/2020/03/British-Airways-Logo.png',
  'KL': 'https://logos-world.net/wp-content/uploads/2020/03/KLM-Logo.png',
  'LX': 'https://logos-world.net/wp-content/uploads/2020/03/Swiss-International-Air-Lines-Logo.png',
  
  // Asian Airlines
  'SQ': 'https://logos-world.net/wp-content/uploads/2020/03/Singapore-Airlines-Logo.png',
  'CX': 'https://logos-world.net/wp-content/uploads/2020/03/Cathay-Pacific-Logo.png',
  'ANA': 'https://logos-world.net/wp-content/uploads/2020/03/ANA-Logo.png',
  'JAL': 'https://logos-world.net/wp-content/uploads/2020/03/Japan-Airlines-Logo.png',
  'TG': 'https://logos-world.net/wp-content/uploads/2020/03/Thai-Airways-Logo.png'
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
  'TG': 'Thai Airways'
};

export const getAirlineLogo = (iataCode: string): string => {
  if (!iataCode) return '/placeholder-airline.svg';
  
  const code = iataCode.toUpperCase();
  return AIRLINE_LOGOS[code] || `/airline-logos/${code.toLowerCase()}.png`;
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