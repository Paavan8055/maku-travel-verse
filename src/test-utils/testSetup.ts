import { vi } from 'vitest';
import { createAuthMock, createToastMock, createSupabaseMock, createBookingDataClientMock } from './mockFactories';

/**
 * Reusable test setup functions
 * Phase 2: Test Environment Standardization
 */

// Standard setup for components requiring auth, toast, and booking data
export const setupStandardMocks = () => {
  const authMock = createAuthMock();
  const toastMock = createToastMock();
  const bookingMocks = createBookingDataClientMock();
  const { mockSupabaseClient } = createSupabaseMock();

  return {
    ...authMock,
    ...toastMock,
    ...bookingMocks,
    mockSupabaseClient
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

export const createMockTask = (overrides = {}) => ({
  id: 'test-task-id',
  agent_id: 'booking-assistant',
  intent: 'test_intent',
  status: 'completed',
  progress: 100,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:05:00Z',
  params: { test: true },
  result: { success: true, message: 'Test completed' },
  error_message: null,
  user_id: 'test-user',
  ...overrides,
});

export const createMockAgentResponse = (overrides = {}) => ({
  success: true,
  message: 'Agent completed successfully',
  data: { result: 'test' },
  timestamp: new Date().toISOString(),
  ...overrides,
});