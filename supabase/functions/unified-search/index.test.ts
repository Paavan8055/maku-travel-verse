import { aggregateResults, convertCurrency, DEFAULT_CURRENCY } from "./index.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { stub, returnsNext, FakeTime } from "https://deno.land/std@0.190.0/testing/mock.ts";

// Mock environment variables
Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-key');

// Mock global fetch for currency API calls
const originalFetch = globalThis.fetch;

function mockFetch(mockResponses: any[]) {
  let callCount = 0;
  globalThis.fetch = stub(
    globalThis,
    "fetch",
    returnsNext(mockResponses.map(response => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response)
      } as Response)
    ))
  );
  return () => {
    globalThis.fetch = originalFetch;
  };
}

Deno.test("aggregateResults - normalizes prices with mocked exchange rates", async () => {
  const cleanup = mockFetch([
    { result: 11.5 } // EUR to USD conversion result
  ]);

  const results = [
    {
      success: true,
      hotels: [
        { price: { amount: 10, currency: "EUR" }, source: "amadeus" }
      ]
    }
  ];

  const aggregated = await aggregateResults(results as any, "hotel");
  const normalized = aggregated[0];

  assertEquals(normalized.normalizedPrice, 11.5);
  assertEquals(normalized.normalizedCurrency, DEFAULT_CURRENCY);
  assertEquals(normalized.originalCurrency, "EUR");

  cleanup();
});

Deno.test("aggregateResults - handles same currency without conversion", async () => {
  const results = [
    {
      success: true,
      hotels: [
        { price: { amount: 100, currency: "USD" }, source: "amadeus" }
      ]
    }
  ];

  const aggregated = await aggregateResults(results as any, "hotel");
  const normalized = aggregated[0];

  assertEquals(normalized.normalizedPrice, 100);
  assertEquals(normalized.normalizedCurrency, DEFAULT_CURRENCY);
});

Deno.test("aggregateResults - sorts by price ascending", async () => {
  const results = [
    {
      success: true,
      hotels: [
        { price: { amount: 200, currency: "USD" }, source: "amadeus", name: "Expensive Hotel" },
        { price: { amount: 100, currency: "USD" }, source: "hotelbeds", name: "Budget Hotel" },
        { price: { amount: 150, currency: "USD" }, source: "sabre", name: "Mid Hotel" }
      ]
    }
  ];

  const aggregated = await aggregateResults(results as any, "hotel");

  assertEquals(aggregated[0].name, "Budget Hotel");
  assertEquals(aggregated[1].name, "Mid Hotel");
  assertEquals(aggregated[2].name, "Expensive Hotel");
});

Deno.test("aggregateResults - diversifies results by source", async () => {
  // Create 20 results from same source to test diversification limit
  const sameSourceResults = Array.from({ length: 20 }, (_, i) => ({
    price: { amount: i + 1, currency: "USD" },
    source: "amadeus",
    name: `Hotel ${i + 1}`
  }));

  const results = [
    {
      success: true,
      hotels: sameSourceResults
    }
  ];

  const aggregated = await aggregateResults(results as any, "hotel");

  // Should limit to 15 results per source
  assertEquals(aggregated.length, 15);
  aggregated.forEach(item => assertEquals(item.source, "amadeus"));
});

Deno.test("aggregateResults - filters out failed results", async () => {
  const results = [
    {
      success: false,
      hotels: [
        { price: { amount: 100, currency: "USD" }, source: "amadeus" }
      ]
    },
    {
      success: true,
      hotels: [
        { price: { amount: 150, currency: "USD" }, source: "hotelbeds" }
      ]
    }
  ];

  const aggregated = await aggregateResults(results as any, "hotel");

  assertEquals(aggregated.length, 1);
  assertEquals(aggregated[0].source, "hotelbeds");
});

Deno.test("aggregateResults - handles different price field names", async () => {
  const results = [
    {
      success: true,
      hotels: [
        { pricePerNight: 100, currency: "USD", source: "amadeus" },
        { totalPrice: 200, currency: "USD", source: "hotelbeds" },
        { price: { amount: 50 }, currency: "USD", source: "sabre" }
      ]
    }
  ];

  const aggregated = await aggregateResults(results as any, "hotel");

  assertEquals(aggregated.length, 3);
  assertEquals(aggregated[0].normalizedPrice, 50);
  assertEquals(aggregated[1].normalizedPrice, 100);
  assertEquals(aggregated[2].normalizedPrice, 200);
});

Deno.test("convertCurrency - handles API failure with fallback", async () => {
  // Mock failed primary API and successful fallback
  const cleanup = mockFetch([
    { result: 1.15 } // fallback API response
  ]);

  // Mock environment to simulate missing API key
  const originalApiKey = Deno.env.get('OPEN_EXCHANGE_RATES_API_KEY');
  Deno.env.delete('OPEN_EXCHANGE_RATES_API_KEY');

  const result = await convertCurrency(100, "EUR", "USD");

  assertEquals(result, 115);

  // Restore environment
  if (originalApiKey) {
    Deno.env.set('OPEN_EXCHANGE_RATES_API_KEY', originalApiKey);
  }

  cleanup();
});

Deno.test("convertCurrency - uses cache for repeated requests", async () => {
  const cleanup = mockFetch([
    { result: 1.20 } // Should only be called once due to caching
  ]);

  // Clear any existing cache
  const cache = (globalThis as any).RATE_CACHE;
  delete cache['EUR_USD'];

  const result1 = await convertCurrency(100, "EUR", "USD");
  const result2 = await convertCurrency(200, "EUR", "USD");

  assertEquals(result1, 120);
  assertEquals(result2, 240);

  cleanup();
});

Deno.test("aggregateResults - handles empty results gracefully", async () => {
  const results: any[] = [];
  const aggregated = await aggregateResults(results, "hotel");
  assertEquals(aggregated.length, 0);
});

Deno.test("aggregateResults - handles different service types", async () => {
  const flightResults = [
    {
      success: true,
      flights: [
        { price: { amount: 300, currency: "USD" }, source: "amadeus" }
      ]
    }
  ];

  const activityResults = [
    {
      success: true,
      activities: [
        { price: { amount: 50, currency: "USD" }, source: "hotelbeds" }
      ]
    }
  ];

  const flightAggregated = await aggregateResults(flightResults, "flight");
  const activityAggregated = await aggregateResults(activityResults, "activity");

  assertEquals(flightAggregated.length, 1);
  assertEquals(activityAggregated.length, 1);
  assertEquals(flightAggregated[0].normalizedPrice, 300);
  assertEquals(activityAggregated[0].normalizedPrice, 50);
});
