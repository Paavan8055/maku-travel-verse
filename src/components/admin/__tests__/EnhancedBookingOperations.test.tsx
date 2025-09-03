import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedBookingOperations } from '../EnhancedBookingOperations';
import { supabase } from '@/integrations/supabase/client';
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

const inserts: any[] = [];
var invokeMock: any;

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
      if (table === 'test_results') {
        return {
          insert: (data: any) => {
            inserts.push(data);
            return Promise.resolve({ data: null, error: null });
          }
        };
      }
      return {};
    },
    functions: { invoke: invokeMock }
  } as any;
  return { supabase };
});

async function logResult(name: string, passed: boolean) {
  await supabase.from('test_results').insert({ test_name: name, status: passed ? 'passed' : 'failed' });
}

describe('EnhancedBookingOperations', () => {
  beforeEach(() => {
    invokeMock.mockClear();
    inserts.length = 0;
  });

  it('loads bookings and displays them', async () => {
    const testName = 'EnhancedBookingOperations loads bookings';
    try {
      render(<EnhancedBookingOperations />);
      expect(await screen.findByText('ABC123')).toBeInTheDocument();
      await logResult(testName, true);
    } catch (err) {
      await logResult(testName, false);
      throw err;
    }
    expect(inserts.find(r => r.test_name === testName)?.status).toBe('passed');
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
      await logResult(testName, true);
    } catch (err) {
      await logResult(testName, false);
      throw err;
    }
    expect(inserts.find(r => r.test_name === testName)?.status).toBe('passed');
  });
});

