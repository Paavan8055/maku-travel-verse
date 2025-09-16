import { vi } from 'vitest';

export const createSupabaseMock = () => {
  const mockSupabaseClient = {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
  };

  return { mockSupabaseClient };
};

export const createAuthMock = () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isLoading: false,
    signOut: vi.fn()
  }))
});

export const createConsoleMock = () => {
  const originalConsole = { ...console };
  console.error = vi.fn();
  console.warn = vi.fn();
  console.log = vi.fn();
  
  return {
    restore: () => {
      Object.assign(console, originalConsole);
    }
  };
};

export const createToastMock = () => ({
  toast: vi.fn()
});

export const createBookingDataClientMock = () => ({
  fetchSpecialOffers: vi.fn().mockResolvedValue([]),
  fetchLocalTips: vi.fn().mockResolvedValue([]),
  fetchUserFavorites: vi.fn().mockResolvedValue([]),
  toggleFavorite: vi.fn().mockResolvedValue(true)
});

export const createMockBooking = (overrides = {}) => ({
  id: '123',
  title: 'Wine Tasting in Napa',
  booking_reference: 'TEST123',
  status: 'confirmed',
  booking_data: { destination: 'Napa Valley' },
  ...overrides
});

export const createMockOffer = (overrides = {}) => ({
  id: '1',
  title: 'Last Minute Deal to Hawaii',
  route: 'SYD-HNL',
  discount_pct: 20,
  offer_type: 'flash_sale',
  description: 'Amazing Hawaii deal',
  valid_until: new Date().toISOString(),
  ...overrides
});