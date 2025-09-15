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
    user: null,
    isLoading: false,
    signOut: vi.fn()
  }))
});

export const createToastMock = () => ({
  toast: vi.fn()
});

export const createBookingDataClientMock = () => ({
  fetchSpecialOffers: vi.fn().mockResolvedValue([]),
  fetchLocalTips: vi.fn().mockResolvedValue([])
});