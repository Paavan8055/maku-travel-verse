import { test, expect, beforeEach } from 'vitest'
import { handler } from './index'

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
})

test('guest booking lookup succeeds with valid data', async () => {
  const mockClient = {
    from: (table: string) => {
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: 1,
                    booking_reference: 'ABC123',
                    status: 'confirmed',
                    booking_type: 'hotel',
                    total_amount: 100,
                    currency: 'USD',
                    booking_data: {},
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01'
                  },
                  error: null
                })
            })
          })
        }
      }
      if (table === 'booking_items') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null })
          })
        }
      }
      if (table === 'payments') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: () =>
                    Promise.resolve({
                      data: null,
                      error: { code: 'PGRST116' }
                    })
                })
              })
            })
          })
        }
      }
      throw new Error(`Unexpected table ${table}`)
    },
    rpc: (fn: string) => {
      if (fn === 'verify_guest_booking_access') {
        return Promise.resolve({ data: true, error: null })
      }
      if (fn === 'log_booking_access') {
        return Promise.resolve({ data: null, error: null })
      }
      throw new Error(`Unexpected rpc ${fn}`)
    }
  } as any

  const req = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ bookingReference: 'ABC123', email: 'a@b.com' })
  })

  const res = await handler(req, mockClient)
  const data = await res.json()

  expect(data.success).toBe(true)
  expect(data.booking.booking_reference).toBe('ABC123')
})
