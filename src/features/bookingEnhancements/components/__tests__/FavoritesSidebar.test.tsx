import { render, waitFor } from '@testing-library/react';
import FavoritesSidebar from '../FavoritesSidebar';
import { vi } from 'vitest';
import React from 'react';

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user1' } })
}));

const toast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast })
}));

vi.mock('@/lib/bookingDataClient', () => ({
  fetchUserFavorites: vi.fn()
}));

import { fetchUserFavorites } from '@/lib/bookingDataClient';

describe('FavoritesSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads favorites on mount', async () => {
    (fetchUserFavorites as any).mockResolvedValue([]);

    render(<FavoritesSidebar />);

    await waitFor(() => {
      expect(fetchUserFavorites).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    (fetchUserFavorites as any).mockRejectedValue(new Error('fail'));

    render(<FavoritesSidebar />);

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });
});
