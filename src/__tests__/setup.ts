/**
 * Enhanced test setup for 70-agent system
 * Provides comprehensive mocking and utilities
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Supabase client with comprehensive functionality
export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user', email: 'test@example.com' } },
      error: null,
    }),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock auth context
export const mockAuthContext = {
  user: { id: 'test-user', email: 'test@example.com' },
  session: { access_token: 'test-token' },
  loading: false,
};

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock toast functionality
export const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
  toast: mockToast,
}));

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