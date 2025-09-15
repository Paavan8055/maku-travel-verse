/**
 * Enhanced test setup for 70-agent system
 * Provides comprehensive mocking and utilities
 */

import '@testing-library/jest-dom'; // Must be imported before any tests or mocks that rely on its matchers
import * as matchers from '@testing-library/jest-dom/matchers'; // Import matchers
import { vi, expect } from 'vitest';
import { 
  createSupabaseMock, 
  createAuthMock, 
  createToastMock, 
  createBookingDataClientMock 
} from './mockFactories';

// Extend Vitest's expect with jest-dom matchers
// This is crucial for toBeInTheDocument and similar assertions
expect.extend(matchers);

// Initialize mocks using factories
const { mockSupabaseClient } = createSupabaseMock();
const authMocks = createAuthMock();
const { toast: mockToast } = createToastMock();
const bookingDataClientMocks = createBookingDataClientMock();

// Mock Supabase client with comprehensive functionality
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock auth context
vi.mock('@/features/auth/hooks/useAuth', () => authMocks);

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: authMocks.useAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock toast functionality
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
  toast: mockToast,
}));

// Mock booking data client
vi.mock('@/lib/bookingDataClient', () => bookingDataClientMocks);

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/test' }),
    useParams: () => ({}),
  };
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue('test'),
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = class {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor() {}
} as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Enhanced test utilities
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

// Test helper functions
export const waitForStableState = async (timeout = 5000) => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

export const mockConsoleError = () => {
  const originalError = console.error;
  console.error = vi.fn();
  return () => {
    console.error = originalError;
  };
};

// Setup global test environment
beforeEach(() => {
  vi.clearAllMocks();
  mockToast.mockClear();
});
