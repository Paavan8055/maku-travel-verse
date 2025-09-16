import { render, screen, fireEvent } from '@testing-library/react';
import { BookingManagement } from '../BookingManagement';
import { vi, expect } from 'vitest';
import React from 'react';

const bookings = [
  {
    id: '1',
    booking_reference: 'AAA111',
    booking_type: 'hotel',
    status: 'pending',
    total_amount: 100,
    currency: 'USD',
    created_at: new Date().toISOString(),
    user_id: 'u1',
    booking_data: { customerInfo: { email: 'a@example.com' } }
  },
  {
    id: '2',
    booking_reference: 'BBB222',
    booking_type: 'flight',
    status: 'confirmed',
    total_amount: 200,
    currency: 'USD',
    created_at: new Date().toISOString(),
    user_id: 'u2',
    booking_data: { customerInfo: { email: 'b@example.com' } }
  }
];

vi.mock('@/utils/logger', () => ({ default: { info: vi.fn(), error: vi.fn() } }));

vi.mock('@/integrations/supabase/client', () => {
  const supabase = {
    from: (table: string) => {
      if (table === 'bookings') {
        return {
          select: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: bookings, error: null })
            })
          })
        };
      }
      return {};
    }
  } as any;
  return { supabase };
});

function logResult(name: string, passed: boolean) {
  console.log(`Test: ${name} - ${passed ? 'PASSED' : 'FAILED'}`);
}

describe('BookingManagement', () => {
  it('displays bookings from supabase', async () => {
    const testName = 'BookingManagement displays bookings';
    try {
      render(<BookingManagement />);
      expect(await screen.findByText('AAA111')).toBeInTheDocument();
      logResult(testName, true);
    } catch (err) {
      logResult(testName, false);
      throw err;
    }
  });

  it('filters bookings by search term', async () => {
    const testName = 'BookingManagement search filter';
    try {
      render(<BookingManagement />);
      await screen.findByText('AAA111');
      const input = screen.getByPlaceholderText('Search by booking reference or ID...');
      fireEvent.change(input, { target: { value: 'BBB222' } });
      expect(screen.queryByText('AAA111')).not.toBeInTheDocument();
      logResult(testName, true);
    } catch (err) {
      logResult(testName, false);
      throw err;
    }
  });
});