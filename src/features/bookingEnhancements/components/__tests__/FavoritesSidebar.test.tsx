import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { setupStandardMocks, clearAllMocks, createMockBooking } from '@/test-utils';
import FavoritesSidebar from '../FavoritesSidebar';
import { fetchUserFavorites, toggleFavorite } from '@/lib/bookingDataClient';
import { AuthProvider } from '@/features/auth/context/AuthContext';

vi.mock('@/lib/bookingDataClient');

describe('FavoritesSidebar', () => {
  beforeEach(() => {
    clearAllMocks();
    setupStandardMocks();
  });

  const renderComponent = () => {
    return render(
        <AuthProvider>
            <FavoritesSidebar />
        </AuthProvider>
    );
  };

  it('should render favorites on successful data fetch', async () => {
    const mockFavorites = [createMockBooking()];
    (fetchUserFavorites as Mock).mockResolvedValue(mockFavorites);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Wine Tasting in Napa')).toBeInTheDocument();
    });
  });

  it('should show empty state when there are no favorites', async () => {
    (fetchUserFavorites as Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no saved favorites/i)).toBeInTheDocument();
    });
  });

  it('should handle data fetch error gracefully', async () => {
    (fetchUserFavorites as Mock).mockRejectedValue(new Error('Failed to fetch'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/error fetching favorites/i)).toBeInTheDocument();
    });
  });

  it('should allow removing a favorite', async () => {
    const mockFavorites = [createMockBooking()];
    (fetchUserFavorites as Mock).mockResolvedValue(mockFavorites);
    (toggleFavorite as Mock).mockResolvedValue(true);

    renderComponent();

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('remove-favorite-btn'));
    });

    await waitFor(() => {
      expect(toggleFavorite).toHaveBeenCalledWith('123');
    });
  });
});