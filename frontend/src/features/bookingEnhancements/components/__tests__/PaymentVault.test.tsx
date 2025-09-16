import { render, screen, waitFor } from '@testing-library/react';
import PaymentVault from '../PaymentVault';
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
  fetchPaymentMethods: vi.fn()
}));

import { fetchPaymentMethods } from '@/lib/bookingDataClient';

describe('PaymentVault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payment methods on success', async () => {
    (fetchPaymentMethods as any).mockResolvedValue([
      { id: '1', provider: 'visa', type: 'card', is_default: true }
    ]);

    render(<PaymentVault />);

    await waitFor(() => {
      expect(screen.getByText(/visa/i)).toBeInTheDocument();
    });
  });

  it('shows error toast on failure', async () => {
    (fetchPaymentMethods as any).mockRejectedValue(new Error('fail'));

    render(<PaymentVault />);

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });
});
