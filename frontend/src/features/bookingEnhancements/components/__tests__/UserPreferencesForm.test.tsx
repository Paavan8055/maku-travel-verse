import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserPreferencesForm from '../UserPreferencesForm';
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
  saveUserPreferences: vi.fn()
}));

import { fetchUserPreferences, saveUserPreferences } from '@/lib/bookingDataClient';

describe('UserPreferencesForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads preferences and saves successfully', async () => {
    (fetchUserPreferences as any).mockResolvedValue(null);
    (saveUserPreferences as any).mockResolvedValue({});

    render(<UserPreferencesForm />);

    fireEvent.click(await screen.findByText('Save Preferences'));

    await waitFor(() => {
      expect(saveUserPreferences).toHaveBeenCalled();
      expect(toast).toHaveBeenCalled();
    });
  });

  it('shows error toast on save failure', async () => {
    (fetchUserPreferences as any).mockResolvedValue(null);
    (saveUserPreferences as any).mockRejectedValue(new Error('fail'));

    render(<UserPreferencesForm />);

    fireEvent.click(await screen.findByText('Save Preferences'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });
});
