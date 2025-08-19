import { fetchUserPreferences, fetchPassportInfo } from './bookingDataClient';

// Production app - mock data generators removed
// All user input is now handled through real user data or empty forms

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

// Production app - mock data generators removed

export const autofillService = {
  loadUserStoredData,
  userDataToPersonalForm,
  userDataToHotelForm
};