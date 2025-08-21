import { render, screen, waitFor } from '@testing-library/react';
import LocalTipsPanel from '../LocalTipsPanel';
import { vi } from 'vitest';
import React from 'react';

vi.mock('@/lib/bookingDataClient', () => ({
  fetchLocalInsights: vi.fn()
}));

import { fetchLocalInsights } from '@/lib/bookingDataClient';

describe('LocalTipsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches insights on success', async () => {
    (fetchLocalInsights as any).mockResolvedValue([{ id: '1', tip_type: 'dining', content: 'Tip' }]);

    render(<LocalTipsPanel locationId="LOC" />);

    await waitFor(() => {
      expect(fetchLocalInsights).toHaveBeenCalledWith('LOC');
    });
  });

  it('handles fetch failure gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (fetchLocalInsights as any).mockRejectedValue(new Error('fail'));

    render(<LocalTipsPanel locationId="LOC" />);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
    errorSpy.mockRestore();
  });
});
