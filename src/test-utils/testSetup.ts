import { vi } from 'vitest';
import { createAuthMock, createToastMock, createBookingDataClientMock } from './mockFactories';

/**
 * Reusable test setup functions
 * Phase 2: Test Environment Standardization
 */

// Standard setup for components requiring auth, toast, and booking data
export const setupStandardMocks = (userId = 'user1') => {
  const authMock = createAuthMock(userId);
  const toastMock = createToastMock();
  const bookingMocks = createBookingDataClientMock();

  return {
    ...authMock,
    ...toastMock,
    ...bookingMocks
  };
};

// Clear all mocks before each test (standard beforeEach)
export const clearAllMocks = () => {
  vi.clearAllMocks();
};

// Mock async success response
export const mockAsyncSuccess = <T>(data: T) => {
  return Promise.resolve(data);
};

// Mock async error response  
export const mockAsyncError = (message = 'Test error') => {
  return Promise.reject(new Error(message));
};

// Re-export mock factories
export * from './mockFactories';
export const createMockBooking = (overrides = {}) => ({
  id: '1',
  booking_reference: 'TEST123',
  status: 'confirmed',
  booking_data: { destination: 'NYC' },
  ...overrides
});

export const createMockOffer = (overrides = {}) => ({
  id: '1',
  route: 'SYD-MEL',
  discount_pct: 20,
  offer_type: 'flash_sale',
  description: 'Flash sale deal',
  valid_until: new Date().toISOString(),
  ...overrides
});

export const createMockPaymentMethod = (overrides = {}) => ({
  id: '1',
  provider: 'visa',
  type: 'card',
  is_default: true,
  ...overrides
});