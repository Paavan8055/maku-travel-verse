import { render, screen, waitFor, vi } from '@/test-utils';
import { clearAllMocks, createMockOffer, createConsoleMock } from '@/test-utils/testSetup';
import { createBookingDataClientMock } from '@/test-utils/mockFactories';
import OffersWidget from '../OffersWidget';
import React from 'react';

describe('OffersWidget', () => {
  const { listDynamicOffers } = createBookingDataClientMock();

  beforeEach(() => {
    clearAllMocks();
  });

  it('renders offers on success', async () => {
    const offer = createMockOffer({ discount_pct: 20 });
    listDynamicOffers.mockResolvedValue([offer]);

    render(<OffersWidget />);

    await waitFor(() => {
      expect(screen.getByText(/20% OFF/)).toBeInTheDocument();
    });
  });

  it('logs error on failure', async () => {
    const consoleMock = createConsoleMock();
    listDynamicOffers.mockRejectedValue(new Error('fail'));

    render(<OffersWidget />);

    await waitFor(() => {
      expect(consoleMock.error).toHaveBeenCalled();
    });
    consoleMock.restore();
  });
});
