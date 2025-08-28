import { render, waitFor, fireEvent } from '@testing-library/react';
import PassportUploader from '../PassportUploader';
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
  savePassportInfo: vi.fn()
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } }
}));

import { supabase } from '@/integrations/supabase/client';

describe('PassportUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates passport successfully', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ data: { success: true, verified: true, extractedData: {} } });

    const { container } = render(<PassportUploader />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'passport.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Upload successful' }));
    });
  });

  it('shows error on validation failure', async () => {
    (supabase.functions.invoke as any).mockRejectedValue(new Error('fail'));

    const { container } = render(<PassportUploader />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'passport.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Validation error' }));
    });
  });
});
