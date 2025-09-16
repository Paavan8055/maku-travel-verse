import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { setupStandardMocks, clearAllMocks } from '@/test-utils';
import LocalTipsPanel from '../LocalTipsPanel';
import { fetchLocalTips } from '@/lib/bookingDataClient';

vi.mock('@/lib/bookingDataClient');

describe('LocalTipsPanel', () => {
  beforeEach(() => {
    clearAllMocks();
    setupStandardMocks();
  });

  const renderComponent = () => {
    return render(<LocalTipsPanel locationId="Paris" />);
  };

  it('should display tips for the given destination', async () => {
    const mockTips = [{ id: '1', tip: 'Try the pizza!' }];
    (fetchLocalTips as Mock).mockResolvedValue(mockTips);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Try the pizza!')).toBeInTheDocument();
    });
  });

  it('should display a message when no tips are available', async () => {
    (fetchLocalTips as Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no local tips/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetchLocalTips as Mock).mockRejectedValue(new Error('API Error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/error fetching tips/i)).toBeInTheDocument();
    });
  });
});