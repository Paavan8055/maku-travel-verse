import { render, screen, fireEvent } from '@testing-library/react';
import { BookingStatusResolver } from '../BookingStatusResolver';
import { vi, expect } from 'vitest';
import React from 'react';

const mockBooking = {
  id: '1',
  booking_reference: 'STUCK1',
  status: 'pending',
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  total_amount: 150,
  currency: 'USD',
  booking_type: 'hotel'
};

var invokeMock: any;

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

vi.mock('@/integrations/supabase/client', () => {
  invokeMock = vi.fn(async () => ({ data: { summary: { confirmed: 1 }, results: [] }, error: null }));

  const supabase = {
    from: (table: string) => {
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              lt: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: [mockBooking], error: null })
                })
              })
            })
          })
        };
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

describe('BookingStatusResolver', () => {
  beforeEach(() => {
    invokeMock.mockClear();
  });

  it('renders stuck bookings', async () => {
    const testName = 'BookingStatusResolver renders stuck bookings';
    try {
      render(<BookingStatusResolver />);
      expect(await screen.findByText('STUCK1')).toBeInTheDocument();
      logResult(testName, true);
    } catch (err) {
      logResult(testName, false);
      throw err;
    }
  });

  it('runs bulk resolution', async () => {
    const testName = 'BookingStatusResolver bulk resolve';
    try {
      render(<BookingStatusResolver />);
      await screen.findByText('STUCK1');
      fireEvent.click(screen.getByText('Resolve All'));
      expect(invokeMock).toHaveBeenCalledWith('fix-stuck-bookings');
      logResult(testName, true);
    } catch (err) {
      logResult(testName, false);
      throw err;
    }
  });
});