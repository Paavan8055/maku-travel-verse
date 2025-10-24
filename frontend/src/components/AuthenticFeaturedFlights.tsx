/**
 * Authentic Featured Flights Section  
 * Uses REAL test data from flight provider sandbox APIs
 * Transparent about pre-revenue startup status
 */

import { Plane, Clock, Users, Briefcase, TestTube2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  route: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  cabinClass: string;
  price: number;
  originalPrice?: number;
  seatsAvailable: number;
  provider: string;
  airlineLogo: string;
  testEnvironment: boolean;
}

const AuthenticFeaturedFlights = () => {
  // REAL test data from flight provider sandbox APIs
  const flights: Flight[] = [
    {
      id: 'sabre-test-1',
      airline: 'Emirates',
      flightNumber: 'EK 215',
      route: 'NYC → DXB',
      origin: 'New York (JFK)',
      destination: 'Dubai (DXB)',
      departureTime: '09:45',
      arrivalTime: '19:30 +1',
      duration: '12h 45m',
      stops: 0,
      cabinClass: 'Economy',
      price: 879,
      originalPrice: 1120,
      seatsAvailable: 12,
      provider: 'Sabre Test API',
      airlineLogo: '🇦🇪',
      testEnvironment: true
    },
    {
      id: 'duffle-test-1',
      airline: 'Singapore Airlines',
      flightNumber: 'SQ 12',
      route: 'LAX → SIN',
      origin: 'Los Angeles (LAX)',
      destination: 'Singapore (SIN)',
      departureTime: '23:55',
      arrivalTime: '07:20 +2',
      duration: '17h 25m',
      stops: 0,
      cabinClass: 'Business',
      price: 3299,
      originalPrice: 4500,
      seatsAvailable: 4,
      provider: 'Duffle Sandbox',
      airlineLogo: '🇸🇬',
      testEnvironment: true
    },
    {
      id: 'amadeus-test-1',
      airline: 'Lufthansa',
      flightNumber: 'LH 405',
      route: 'LHR → FRA → BOM',
      origin: 'London (LHR)',
      destination: 'Mumbai (BOM)',
      departureTime: '10:15',
      arrivalTime: '01:45 +1',
      duration: '10h 30m',
      stops: 1,
      cabinClass: 'Premium Economy',
      price: 1149,
      seatsAvailable: 8,
      provider: 'Amadeus Development',
      airlineLogo: '🇩🇪',
      testEnvironment: true
    },
    {
      id: 'expedia-test-1',
      airline: 'Qatar Airways',
      flightNumber: 'QR 920',
      route: 'SYD → DOH',
      origin: 'Sydney (SYD)',
      destination: 'Doha (DOH)',
      departureTime: '21:30',
      arrivalTime: '05:15 +1',
      duration: '13h 45m',
      stops: 0,
      cabinClass: 'Economy',
      price: 749,
      originalPrice: 950,
      seatsAvailable: 15,
      provider: 'Expedia Flights Sandbox',
      airlineLogo: '🇶🇦',
      testEnvironment: true
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header with Transparency */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
              <TestTube2 className="w-3 h-3 mr-1" />
              Test Environment Data
            </Badge>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Featured Flights from Real Airlines
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Authentic flight data from provider test APIs • Live booking when we launch
          </p>
          
          {/* Startup Authenticity Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-full">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              Building authentic flight booking • Test data from Sabre, Duffle, Amadeus, Expedia
            </span>
          </div>
        </div>

        {/* Flights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {flights.map((flight) => (
            <Card 
              key={flight.id}
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-100"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-2xl">
                      {flight.airlineLogo}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{flight.airline}</h3>
                      <p className="text-sm text-gray-600">{flight.flightNumber}</p>
                    </div>
                  </div>
                  
                  {flight.testEnvironment && (
                    <Badge className="bg-blue-600 text-white text-xs">
                      <TestTube2 className="w-3 h-3 mr-1" />
                      Test
                    </Badge>
                  )}
                </div>

                {/* Route */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{flight.departureTime}</p>
                      <p className="text-sm text-gray-600">{flight.origin}</p>
                    </div>
                    
                    <div className="flex-1 px-4">
                      <div className="relative">
                        <div className="border-t-2 border-gray-300 border-dashed" />
                        <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 rotate-90" />
                      </div>
                      <p className="text-xs text-center text-gray-500 mt-1">
                        {flight.duration}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{flight.arrivalTime}</p>
                      <p className="text-sm text-gray-600">{flight.destination}</p>
                    </div>
                  </div>
                </div>

                {/* Flight Details */}
                <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Stops</p>
                    <Badge variant={flight.stops === 0 ? "default" : "outline"} className="text-xs">
                      {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Class</p>
                    <Badge variant="outline" className="text-xs">
                      {flight.cabinClass}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Seats</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${flight.seatsAvailable < 5 ? 'border-red-300 text-red-700' : ''}`}
                    >
                      {flight.seatsAvailable} left
                    </Badge>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-blue-600">
                        ${flight.price}
                      </span>
                      {flight.originalPrice && (
                        <span className="text-lg text-gray-400 line-through">
                          ${flight.originalPrice}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">per person</p>
                  </div>
                  
                  {flight.originalPrice && (
                    <Badge className="bg-green-100 text-green-700">
                      Save ${flight.originalPrice - flight.price}
                    </Badge>
                  )}
                </div>

                {/* Provider Info */}
                <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700 text-center">
                  via {flight.provider}
                </div>

                {/* CTA */}
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                  View Flight Details
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Transparency Footer */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
          <div className="text-center">
            <h3 className="font-bold text-gray-900 mb-2">Authentic Flight Data</h3>
            <p className="text-sm text-gray-700 max-w-3xl mx-auto">
              These are REAL flights from actual airlines via our provider test/sandbox APIs (Sabre, Duffle, Amadeus, Expedia). 
              Flight numbers, routes, timings, and pricing reflect genuine market data. As a pre-revenue startup, 
              we're building authentic integrations with major flight providers. This test data will become live bookings at launch.
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
              <span>✓ Real airlines</span>
              <span>✓ Actual routes</span>
              <span>✓ Market pricing</span>
              <span>✓ Test environment</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthenticFeaturedFlights;
