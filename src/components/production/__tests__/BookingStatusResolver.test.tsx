import { render, screen, fireEvent } from '@testing-library/react';
import { BookingStatusResolver } from '../BookingStatusResolver';
import { supabase } from '@/integrations/supabase/client';
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

const inserts: any[] = [];
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

describe('BookingStatusResolver', () => {
  beforeEach(() => {
    invokeMock.mockClear();
    inserts.length = 0;
  });

  it('renders stuck bookings', async () => {
    const testName = 'BookingStatusResolver renders stuck bookings';
    try {
      render(<BookingStatusResolver />);
      expect(await screen.findByText('STUCK1')).toBeInTheDocument();
      await logResult(testName, true);
    } catch (err) {
      await logResult(testName, false);
      throw err;
    }
    expect(inserts.find(r => r.test_name === testName)?.status).toBe('passed');
  });

  it('runs bulk resolution', async () => {
    const testName = 'BookingStatusResolver bulk resolve';
    try {
      render(<BookingStatusResolver />);
      await screen.findByText('STUCK1');
      fireEvent.click(screen.getByText('Resolve All'));
      expect(invokeMock).toHaveBeenCalledWith('fix-stuck-bookings');
      await logResult(testName, true);
    } catch (err) {
      await logResult(testName, false);
      throw err;
    }
    expect(inserts.find(r => r.test_name === testName)?.status).toBe('passed');
  });
});

