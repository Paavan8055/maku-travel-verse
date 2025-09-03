import { render, screen, waitFor, vi } from '@/test-utils';
import { clearAllMocks, createConsoleMock } from '@/test-utils/testSetup';
import { createBookingDataClientMock } from '@/test-utils/mockFactories';
import LocalTipsPanel from '../LocalTipsPanel';
import React from 'react';

describe('LocalTipsPanel', () => {
  const { fetchLocalInsights } = createBookingDataClientMock();

  beforeEach(() => {
    clearAllMocks();
  });

  it('fetches insights on success', async () => {
    fetchLocalInsights.mockResolvedValue([{ id: '1', tip_type: 'dining', content: 'Tip' }]);

    render(<LocalTipsPanel locationId="LOC" />);

    await waitFor(() => {
      expect(fetchLocalInsights).toHaveBeenCalledWith('LOC');
    });
  });

  it('handles fetch failure gracefully', async () => {
    const consoleMock = createConsoleMock();
    fetchLocalInsights.mockRejectedValue(new Error('fail'));

    render(<LocalTipsPanel locationId="LOC" />);

    await waitFor(() => {
      expect(consoleMock.error).toHaveBeenCalled();
    });
    consoleMock.restore();
  });
});
