import { render, screen, fireEvent } from '@testing-library/react';
import { BookingManagement } from '../BookingManagement';
import { supabase } from '@/integrations/supabase/client';
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

const inserts: any[] = [];

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
      if (table === 'test_results') {
        return {
          insert: (data: any) => {
            inserts.push(data);
            return Promise.resolve({ data: null, error: null });
          }
        };
      }
      return {};
    }
  } as any;
  return { supabase };
});

async function logResult(name: string, passed: boolean) {
  await supabase.from('test_results').insert({ test_name: name, status: passed ? 'passed' : 'failed' });
}

describe('BookingManagement', () => {
  beforeEach(() => {
    inserts.length = 0;
  });

  it('displays bookings from supabase', async () => {
    const testName = 'BookingManagement displays bookings';
    try {
      render(<BookingManagement />);
      expect(await screen.findByText('AAA111')).toBeInTheDocument();
      await logResult(testName, true);
    } catch (err) {
      await logResult(testName, false);
      throw err;
    }
    expect(inserts.find(r => r.test_name === testName)?.status).toBe('passed');
  });

  it('filters bookings by search term', async () => {
    const testName = 'BookingManagement search filter';
    try {
      render(<BookingManagement />);
      await screen.findByText('AAA111');
      const input = screen.getByPlaceholderText('Search by booking reference or ID...');
      fireEvent.change(input, { target: { value: 'BBB222' } });
      expect(screen.queryByText('AAA111')).not.toBeInTheDocument();
      await logResult(testName, true);
    } catch (err) {
      await logResult(testName, false);
      throw err;
    }
    expect(inserts.find(r => r.test_name === testName)?.status).toBe('passed');
  });
});

