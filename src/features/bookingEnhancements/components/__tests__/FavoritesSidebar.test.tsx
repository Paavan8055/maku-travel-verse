import { render, waitFor, vi } from '@/test-utils';
import { setupStandardMocks, clearAllMocks } from '@/test-utils/testSetup';
import FavoritesSidebar from '../FavoritesSidebar';
import React from 'react';

describe('FavoritesSidebar', () => {
  const { toast, fetchUserFavorites } = setupStandardMocks();

  beforeEach(() => {
    clearAllMocks();
  });

  it('loads favorites on mount', async () => {
    fetchUserFavorites.mockResolvedValue([]);

    render(<FavoritesSidebar />);

    await waitFor(() => {
      expect(fetchUserFavorites).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    fetchUserFavorites.mockRejectedValue(new Error('fail'));

    render(<FavoritesSidebar />);

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });
});
