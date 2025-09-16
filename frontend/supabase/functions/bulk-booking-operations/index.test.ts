import { handler } from "./index.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${actual} !== ${expected}`);
  }
}

Deno.test("bulk booking retry operation", async () => {
  const inserts: any[] = [];
  const supabaseStub = {
    from: (table: string) => {
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: '1',
                  booking_reference: 'ABC',
                  status: 'failed',
                  booking_type: 'hotel',
                  booking_data: {},
                  total_amount: 100,
                  currency: 'USD'
                },
                error: null
              })
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
    functions: { invoke: () => Promise.resolve({ data: {}, error: null }) }
  } as any;

  const req = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({
      operation: 'bulk_operation',
      operationType: 'retry',
      bookingIds: ['1'],
      correlationId: 'test'
    })
  });

  const res = await handler(req, supabaseStub);
  const data = await res.json();

  assertEquals(data.results[0].status, 'success');

  console.log(`Test: bulk booking retry operation - ${data.results[0].status === 'success' ? 'PASSED' : 'FAILED'}`);
  assertEquals(data.results[0].status, 'success');
});

