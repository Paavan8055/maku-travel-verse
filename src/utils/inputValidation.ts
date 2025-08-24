/**
 * Input validation utilities for MAKU.Travel search forms
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFlightSearch = (params: {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: number;
}): ValidationResult => {
  const { origin, destination, departureDate, passengers } = params;

  // Validate airport codes
  if (!origin || origin.length !== 3) {
    return { isValid: false, error: 'Please enter a valid origin airport code (3 letters)' };
  }

  if (!destination || destination.length !== 3) {
    return { isValid: false, error: 'Please enter a valid destination airport code (3 letters)' };
  }

  if (origin.toUpperCase() === destination.toUpperCase()) {
    return { isValid: false, error: 'Origin and destination must be different' };
  }

  // Validate departure date
  const depDate = new Date(departureDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(depDate.getTime())) {
    return { isValid: false, error: 'Please enter a valid departure date' };
  }

  if (depDate < today) {
    return { isValid: false, error: 'Departure date cannot be in the past' };
  }

  // Validate passengers
  if (!passengers || passengers < 1 || passengers > 9) {
    return { isValid: false, error: 'Number of passengers must be between 1 and 9' };
  }

  return { isValid: true };
};

export const validateHotelSearch = (params: {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}): ValidationResult => {
  const { destination, checkIn, checkOut, guests } = params;

  // Validate destination
  if (!destination || destination.trim().length < 2) {
    return { isValid: false, error: 'Please enter a destination (minimum 2 characters)' };
  }

  // Validate dates
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(checkInDate.getTime())) {
    return { isValid: false, error: 'Please enter a valid check-in date' };
  }

  if (isNaN(checkOutDate.getTime())) {
    return { isValid: false, error: 'Please enter a valid check-out date' };
  }

  if (checkInDate < today) {
    return { isValid: false, error: 'Check-in date cannot be in the past' };
  }

  if (checkOutDate <= checkInDate) {
    return { isValid: false, error: 'Check-out date must be after check-in date' };
  }

  // Validate guests
  if (!guests || guests < 1 || guests > 8) {
    return { isValid: false, error: 'Number of guests must be between 1 and 8' };
  }

  return { isValid: true };
};

export const validateActivitySearch = (params: {
  destination: string;
  date: string;
  participants: number;
}): ValidationResult => {
  const { destination, date, participants } = params;

  // Validate destination
  if (!destination || destination.trim().length < 2) {
    return { isValid: false, error: 'Please enter a destination (minimum 2 characters)' };
  }

  // Validate date
  const activityDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(activityDate.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }

  if (activityDate < today) {
    return { isValid: false, error: 'Activity date cannot be in the past' };
  }

  // Validate participants
  if (!participants || participants < 1 || participants > 20) {
    return { isValid: false, error: 'Number of participants must be between 1 and 20' };
  }

  return { isValid: true };
};