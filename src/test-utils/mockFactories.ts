import { vi } from 'vitest';

/**
 * Centralized mock factories for consistent testing
 * Phase 2: Test Environment Standardization
 */

// Auth Mock Factory
export const createAuthMock = (userId = 'user1') => {
  const mockAuth = {
    useAuth: () => ({ user: { id: userId } })
  };

  vi.mock('@/features/auth/hooks/useAuth', () => mockAuth);
  return mockAuth;
};

// Toast Mock Factory  
export const createToastMock = () => {
  const toast = vi.fn();
  vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast })
  }));
  return { toast };
};

// Supabase Client Mock Factory
export const createSupabaseMock = () => {
  const mockInvoke = vi.fn();
  const mockSupabase = {
    supabase: {
      functions: { invoke: mockInvoke },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }))
    }
  };

  vi.mock('@/integrations/supabase/client', () => mockSupabase);
  return { mockInvoke, mockSupabase };
};

// Booking Data Client Mock Factory
export const createBookingDataClientMock = () => {
  const mocks = {
    fetchUserFavorites: vi.fn(),
    fetchLocalInsights: vi.fn(),
    listDynamicOffers: vi.fn(),
    fetchPaymentMethods: vi.fn(),
    fetchUserPreferences: vi.fn(),
    saveUserPreferences: vi.fn(),
    fetchPassportInfo: vi.fn(),
    savePassportInfo: vi.fn(),
  };

  vi.mock('@/lib/bookingDataClient', () => mocks);
  return mocks;
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