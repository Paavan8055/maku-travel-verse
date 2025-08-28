import { fetchUserPreferences, fetchPassportInfo } from './bookingDataClient';

// Mock data generators for testing and development
export const generateMockPersonalData = () => {
  const baseData = {
    title: "MR" as 'MR' | 'MRS' | 'MS' | 'DR' | 'PROF',
    firstName: "JOHN",
    lastName: "SMITH",
    dateOfBirth: "1985-03-15",
    nationality: "US",
    idDocument: "P123456789",
    email: "john.smith@example.com",
    phone: "+15551234567",
    specialRequests: "Late check-in preferred",
    acknowledge: true
  };
  
  // Apply random variation to make demo data more realistic
  return generateRandomVariation(baseData);
};

export const generateMockHotelGuest = () => {
  const baseData = {
    title: "Mr",
    firstName: "JOHN",
    lastName: "SMITH", 
    email: "john.smith@example.com",
    phone: "+15551234567",
    arrivalTime: "3:00 PM",
    roomPreferences: "High floor, quiet room",
    specialRequests: "Extra towels and late check-in",
    smsNotifications: true,
    emailUpdates: true,
    acknowledgment: true
  };
  
  // Apply random variation to make demo data more realistic
  return generateRandomVariation(baseData);
};

export const generateMockActivityParticipants = (count: number = 2) => ({
  participants: Array.from({ length: count }, (_, i) => ({
    title: i === 0 ? "Mr" : "Mrs",
    firstName: i === 0 ? "JOHN" : "JANE",
    lastName: "SMITH",
    dateOfBirth: i === 0 ? "1985-03-15" : "1987-07-22",
    email: i === 0 ? "john.smith@example.com" : "jane.smith@example.com",
    phone: i === 0 ? "+15551234567" : "+15551234568",
    dietaryRestrictions: i === 0 ? "None" : "Vegetarian",
    emergencyContact: i === 0 ? "+15559876543" : "+15559876544"
  })),
  specialRequests: "Group booking - please keep together",
  acknowledgment: true
});

// User data loaders
export const loadUserStoredData = async (userId: string) => {
  try {
    const [preferences, passport] = await Promise.all([
      fetchUserPreferences(userId),
      fetchPassportInfo(userId)
    ]);

    return {
      preferences: preferences || {},
      passport: passport || {},
      hasStoredData: !!(preferences || passport)
    };
  } catch (error) {
    console.error('Error loading user stored data:', error);
    return {
      preferences: {},
      passport: {},
      hasStoredData: false
    };
  }
};

// Convert user stored data to form format
export const userDataToPersonalForm = (userData: any) => ({
  title: (userData.passport?.gender === 'F' ? 'MRS' : 'MR') as 'MR' | 'MRS' | 'MS' | 'DR' | 'PROF',
  firstName: userData.passport?.first_name?.toUpperCase() || '',
  lastName: userData.passport?.last_name?.toUpperCase() || '',
  dateOfBirth: userData.passport?.date_of_birth || '',
  nationality: userData.passport?.nationality || '',
  idDocument: userData.passport?.passport_number || '',
  email: userData.preferences?.email || '',
  phone: userData.preferences?.phone || '',
  specialRequests: userData.preferences?.special_requests || '',
  acknowledge: false // Always require user to re-confirm
});

export const userDataToHotelForm = (userData: any) => ({
  title: userData.passport?.gender === 'F' ? 'Mrs' : 'Mr',
  firstName: userData.passport?.first_name?.toUpperCase() || '',
  lastName: userData.passport?.last_name?.toUpperCase() || '',
  email: userData.preferences?.email || '',
  phone: userData.preferences?.phone || '',
  arrivalTime: userData.preferences?.preferred_arrival_time || '',
  roomPreferences: userData.preferences?.room_preferences || '',
  specialRequests: userData.preferences?.special_requests || '',
  smsNotifications: userData.preferences?.sms_notifications || false,
  emailUpdates: userData.preferences?.email_updates !== false, // Default true
  acknowledgment: false // Always require user to re-confirm
});

// Random variation generators for testing
export const generateRandomVariation = (baseData: any) => {
  const variations = {
    firstNames: ['JOHN', 'JANE', 'MICHAEL', 'SARAH', 'DAVID', 'EMMA'],
    lastNames: ['SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA'],
    emails: ['example.com', 'test.com', 'demo.com', 'sample.org'],
    specialRequests: [
      'Late check-in preferred',
      'Quiet room please',
      'High floor requested',
      'Near elevator',
      'Accessibility needs',
      'Early check-in if possible'
    ]
  };

  const randomFirst = variations.firstNames[Math.floor(Math.random() * variations.firstNames.length)];
  const randomLast = variations.lastNames[Math.floor(Math.random() * variations.lastNames.length)];
  const randomEmail = variations.emails[Math.floor(Math.random() * variations.emails.length)];
  const randomRequest = variations.specialRequests[Math.floor(Math.random() * variations.specialRequests.length)];

  return {
    ...baseData,
    firstName: randomFirst,
    lastName: randomLast,
    email: `${randomFirst.toLowerCase()}.${randomLast.toLowerCase()}@${randomEmail}`,
    specialRequests: randomRequest
  };
};

// Mock data for activity searches
export const generateMockActivitySearch = () => {
  const destinations = [
    "Sydney, Australia",
    "Tokyo, Japan", 
    "Paris, France",
    "New York, USA",
    "Bangkok, Thailand",
    "Barcelona, Spain"
  ];
  
  const today = new Date();
  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
  
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + Math.floor(Math.random() * 3) + 1);
  
  return {
    destination: destinations[Math.floor(Math.random() * destinations.length)],
    checkIn,
    checkOut: Math.random() > 0.5 ? checkOut : undefined, // Sometimes no end date for day trips
    adults: Math.floor(Math.random() * 4) + 1,
    children: Math.floor(Math.random() * 3),
  };
};

export const autofillService = {
  generateMockPersonalData,
  generateMockHotelGuest,
  generateMockActivityParticipants,
  loadUserStoredData,
  userDataToPersonalForm,
  userDataToHotelForm,
  generateRandomVariation,
  generateMockActivitySearch
};