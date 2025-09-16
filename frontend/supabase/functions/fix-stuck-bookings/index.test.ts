import { handler } from "./index.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${actual} !== ${expected}`);
  }
}

Deno.test("automated cleanup logs trigger source", async () => {
  const inserts: any[] = [];
  const supabaseStub = {
    from: (table: string) => {
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              lt: () => Promise.resolve({ data: [], error: null })
            })
          })
        };
      }
      if (table === 'cleanup_audit') {
        return {
          insert: (data: any) => {
            inserts.push(data);
            return Promise.resolve({ data: null, error: null });
          }
        };
      }
      throw new Error(`Unexpected table ${table}`);
    }
  } as any;

  const req = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ automated: true })
  });

  const res = await handler(req, supabaseStub, {});
  const data = await res.json();

  assertEquals(data.triggered_by, 'automated');
  assertEquals(inserts[0].triggered_by, 'automated');
});
