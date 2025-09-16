import { searchHotels, transformAmadeusHotels } from "./index.ts";
import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { stub, returnsNext } from "https://deno.land/std@0.190.0/testing/mock.ts";

// Mock environment variables to prevent real API calls
Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
Deno.env.set('AMADEUS_CLIENT_ID', 'test');
Deno.env.set('AMADEUS_CLIENT_SECRET', 'test');

function mockFetch() {
  const hotelListResponse = {
    data: [
      { hotelId: 'H1', distance: { value: 1 } }
    ]
  };

  const offersResponse = {
    data: [
      {
        hotel: {
          hotelId: 'H1',
          name: 'Test Hotel',
          rating: '4',
          address: { lines: ['123 Test St'], cityCode: 'ABC' },
          chainCode: 'CH',
          distance: { value: 1 }
        },
        offers: [
          {
            price: { total: 100, currency: 'USD' },
            policies: { cancellation: { description: 'Free cancel' } }
          }
        ]
      }
    ]
  };

  const fetchStub = stub(globalThis, 'fetch', returnsNext([
    Promise.resolve({ ok: true, json: () => Promise.resolve(hotelListResponse) } as Response),
    Promise.resolve({ ok: true, json: () => Promise.resolve(offersResponse) } as Response)
  ]));

  return () => fetchStub.restore();
}

Deno.test('searchHotels normalizes hotel data', async () => {
  const restoreFetch = mockFetch();

  const context = {
    cityCode: 'ABC',
    checkInDate: '2025-01-01',
    checkOutDate: '2025-01-02',
    adults: 2,
    children: 0,
    roomQuantity: 1,
    currency: 'USD'
  };

  const result = await searchHotels('fake-token', context);
  const hotels = transformAmadeusHotels(result.data);

  assertEquals(hotels.length, 1);
  const hotel = hotels[0];
  assertEquals(hotel.id, 'H1');
  assertEquals(hotel.name, 'Test Hotel');
  assertEquals(hotel.pricePerNight, 100);
  assertEquals(hotel.currency, 'USD');

  restoreFetch();
});
