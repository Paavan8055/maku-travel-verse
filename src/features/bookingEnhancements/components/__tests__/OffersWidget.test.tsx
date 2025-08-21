import { render, screen, waitFor } from '@testing-library/react';
import OffersWidget from '../OffersWidget';
import { vi } from 'vitest';
import React from 'react';

vi.mock('@/lib/bookingDataClient', () => ({
  listDynamicOffers: vi.fn()
}));

import { listDynamicOffers } from '@/lib/bookingDataClient';

describe('OffersWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders offers on success', async () => {
    (listDynamicOffers as any).mockResolvedValue([
      { id: '1', route: 'SYD-MEL', discount_pct: 20, offer_type: 'flash_sale', description: 'deal', valid_until: new Date().toISOString() }
    ]);

    render(<OffersWidget />);

    await waitFor(() => {
      expect(screen.getByText(/20% OFF/)).toBeInTheDocument();
    });
  });

  it('logs error on failure', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (listDynamicOffers as any).mockRejectedValue(new Error('fail'));

    render(<OffersWidget />);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
    errorSpy.mockRestore();
  });
});
