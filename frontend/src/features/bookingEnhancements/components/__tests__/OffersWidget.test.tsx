import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { setupStandardMocks, clearAllMocks, createMockOffer } from '@/test-utils';
import OffersWidget from '../OffersWidget';
import { fetchSpecialOffers } from '@/lib/bookingDataClient';

vi.mock('@/lib/bookingDataClient');

describe('OffersWidget', () => {
  beforeEach(() => {
    clearAllMocks();
    setupStandardMocks();
  });

  const renderComponent = () => {
    return render(<OffersWidget route="global" />);
  };

  it('should display offers when the API call is successful', async () => {
    const mockOffers = [createMockOffer()];
    (fetchSpecialOffers as Mock).mockResolvedValue(mockOffers);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Last Minute Deal to Hawaii')).toBeInTheDocument();
    });
  });

  it('should show an empty state when no offers are available', async () => {
    (fetchSpecialOffers as Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no special offers/i)).toBeInTheDocument();
    });
  });

  it('should display an error message on API failure', async () => {
    (fetchSpecialOffers as Mock).mockRejectedValue(new Error('Failed to fetch'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/error loading offers/i)).toBeInTheDocument();
    });
  });
});