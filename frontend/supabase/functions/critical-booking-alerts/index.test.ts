import { handler } from "./index.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${actual} !== ${expected}`);
  }
}

Deno.test("returns active critical alerts", async () => {
  const inserts: any[] = [];
  const supabaseStub = {
    from: (table: string) => {
      if (table === 'critical_alerts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({
                  data: [{ id: 1, resolved: false }],
                  error: null
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
    }
  } as any;

  const req = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ action: 'get_active_alerts' })
  });

  const res = await handler(req, supabaseStub);
  const data = await res.json();

  assertEquals(data.count, 1);

  await supabaseStub.from('test_results').insert({
    test_name: 'critical alerts get active',
    status: data.count === 1 ? 'passed' : 'failed'
  });
  assertEquals(inserts[0].status, 'passed');
});

