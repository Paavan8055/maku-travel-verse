import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedBookingOperations } from '../EnhancedBookingOperations';
import { vi, expect } from 'vitest';
import React from 'react';

const mockBookingRow = {
  id: '1',
  booking_reference: 'ABC123',
  booking_type: 'hotel',
  status: 'failed',
  total_amount: 100,
  currency: 'USD',
  booking_data: { customerInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

let invokeMock: ReturnType<typeof vi.fn>;

vi.mock('@/integrations/supabase/client', () => {
  invokeMock = vi.fn(async (fn: string, _args: any) => {
    if (fn === 'critical-booking-alerts') {
      return { data: { active_alerts: [] }, error: null };
    }
    if (fn === 'bulk-booking-operations') {
      return { data: { summary: { success: 1, failed: 0 }, results: [{ booking_id: '1', status: 'success' }] }, error: null };
    }
    return { data: {}, error: null };
  });

  const supabase = {
    from: (table: string) => {
      if (table === 'bookings') {
        return {
          select: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [mockBookingRow], error: null })
            })
          }),
          update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
        };
      }
      if (table === 'booking_status_history') {
        return { insert: () => Promise.resolve({ data: null, error: null }) };
      }
      return {};
    },
    functions: { invoke: invokeMock }
  } as any;
  return { supabase };
});

function logResult(name: string, passed: boolean) {
  console.log(`Test: ${name} - ${passed ? 'PASSED' : 'FAILED'}`);
}

describe('EnhancedBookingOperations', () => {
  beforeEach(() => {
    invokeMock.mockClear();
  });

  it('loads bookings and displays them', async () => {
    const testName = 'EnhancedBookingOperations loads bookings';
    try {
      render(<EnhancedBookingOperations />);
      expect(await screen.findByText('ABC123')).toBeInTheDocument();
      logResult(testName, true);
    } catch (err) {
      logResult(testName, false);
      throw err;
    }
  });

  it('performs bulk retry operation', async () => {
    const testName = 'EnhancedBookingOperations bulk retry';
    try {
      render(<EnhancedBookingOperations />);
      await screen.findByText('ABC123');
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      const retryButton = screen.getByText(/Retry Selected/);
      fireEvent.click(retryButton);
      await waitFor(() => {
        expect(invokeMock).toHaveBeenCalledWith(
          'bulk-booking-operations',
          expect.objectContaining({ body: expect.objectContaining({ operationType: 'retry', bookingIds: ['1'] }) })
        );
      });
      logResult(testName, true);
    } catch (err) {
      logResult(testName, false);
      throw err;
    }
  });
});