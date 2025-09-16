import { render, screen, waitFor } from '@testing-library/react';
import OneClickBooking from '../OneClickBooking';
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
  fetchUserPreferences: vi.fn(),
  saveUserPreferences: vi.fn(),
  fetchPassportInfo: vi.fn(),
  fetchPaymentMethods: vi.fn()
}));

import { fetchUserPreferences, fetchPassportInfo, fetchPaymentMethods } from '@/lib/bookingDataClient';

describe('OneClickBooking', () => {
  const bookingData = { destination: 'NYC', checkIn: '2024-01-01', checkOut: '2024-01-02', guests: 1 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enables one-click booking when requirements met', async () => {
    (fetchUserPreferences as any).mockResolvedValue({ room_type: 'standard' });
    (fetchPassportInfo as any).mockResolvedValue({ verified: true });
    (fetchPaymentMethods as any).mockResolvedValue([{ id: 'pm1', is_default: true }]);

    render(<OneClickBooking bookingData={bookingData} />);

    await waitFor(() => {
      expect(screen.getByText(/One-Click Book Now/)).toBeInTheDocument();
    });
  });

  it('falls back when data fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (fetchUserPreferences as any).mockResolvedValue({});
    (fetchPassportInfo as any).mockRejectedValue(new Error('fail'));
    (fetchPaymentMethods as any).mockResolvedValue([]);

    render(<OneClickBooking bookingData={bookingData} />);

    await waitFor(() => {
      expect(screen.getByText(/Continue with Full Booking/)).toBeInTheDocument();
      expect(errorSpy).toHaveBeenCalled();
    });
    errorSpy.mockRestore();
  });
});
