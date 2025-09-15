import { vi } from 'vitest';

/**
 * Centralized mock factories for consistent testing
 * Phase 2: Test Environment Standardization
 */

// Auth Mock Factory
export const createAuthMock = (userId = 'user1') => {
  return {
    useAuth: () => ({ user: { id: userId } })
  };
};

// Toast Mock Factory  
export const createToastMock = () => {
  const toast = vi.fn();
  return { toast };
};

// Supabase Client Mock Factory
export const createSupabaseMock = () => {
  const mockSupabaseClient = {
    functions: { invoke: vi.fn() },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }))
  };
  return mockSupabaseClient;
};

// Booking Data Client Mock Factory
export const createBookingDataClientMock = () => {
  return {
    fetchUserFavorites: vi.fn(),
    toggleFavorite: vi.fn(),
    fetchLocalInsights: vi.fn(),
    listDynamicOffers: vi.fn(),
    fetchPaymentMethods: vi.fn(),
    fetchUserPreferences: vi.fn(),
    saveUserPreferences: vi.fn(),
    fetchPassportInfo: vi.fn(),
    savePassportInfo: vi.fn(),
    fetchLocalTips: vi.fn(),
    fetchSpecialOffers: vi.fn(),
  };
};

// Console Mock Factory (for error logging tests)
export const createConsoleMock = () => {
  const consoleMocks = {
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  };

  return {
    ...consoleMocks,
    restore: () => {
      Object.values(consoleMocks).forEach(mock => mock.mockRestore());
    }
  };
};