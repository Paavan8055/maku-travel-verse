import { aggregateResults, DEFAULT_CURRENCY } from "./index.ts";

function approxEquals(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance;
}

Deno.test("normalizes prices with live exchange rates", async () => {
  const amount = 10;
  const results = [
    {
      success: true,
      hotels: [
        { price: { amount, currency: "EUR" }, source: "amadeus" }
      ]
    }
  ];

  const aggregated = await aggregateResults(results as any, "hotel");
  const normalized = aggregated[0];

  const res = await fetch(
    `https://api.exchangerate.host/convert?from=EUR&to=${DEFAULT_CURRENCY}&amount=${amount}`
  );
  const data = await res.json();
  const expected = data.result;

  if (!approxEquals(normalized.normalizedPrice, expected, 0.5)) {
    throw new Error(`Expected ~${expected} but got ${normalized.normalizedPrice}`);
  }

  if (normalized.normalizedCurrency !== DEFAULT_CURRENCY) {
    throw new Error(`Expected currency ${DEFAULT_CURRENCY}`);
  }
});
