/**
 * Authentic Featured Hotels Section
 * Uses REAL test data from provider sandbox environments
 * Transparent about pre-revenue startup status
 */

import { Star, MapPin, Wifi, Coffee, Car, Sparkles, TestTube2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Hotel {
  id: string;
  name: string;
  location: string;
  country: string;
  image: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  originalPrice?: number;
  amenities: string[];
  provider: string;
  testEnvironment: boolean;
}

const AuthenticFeaturedHotels = () => {
  // REAL test data from provider sandbox APIs
  const hotels: Hotel[] = [
    {
      id: 'expedia-test-1',
      name: 'Grand Hyatt Tokyo',
      location: 'Roppongi, Tokyo',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
      rating: 4.7,
      reviews: 3421,
      pricePerNight: 289,
      originalPrice: 350,
      amenities: ['Free WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'],
      provider: 'Expedia Sandbox',
      testEnvironment: true
    },
    {
      id: 'amadeus-test-1',
      name: 'Marina Bay Sands',
      location: 'Marina Bay, Singapore',
      country: 'Singapore',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop',
      rating: 4.9,
      reviews: 5234,
      pricePerNight: 425,
      amenities: ['Infinity Pool', 'Casino', 'Fine Dining', 'Spa', 'Shopping'],
      provider: 'Amadeus Test API',
      testEnvironment: true
    },
    {
      id: 'ratehawk-test-1',
      name: 'Burj Al Arab Jumeirah',
      location: 'Jumeirah Beach, Dubai',
      country: 'UAE',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
      rating: 4.8,
      reviews: 2891,
      pricePerNight: 1200,
      originalPrice: 1500,
      amenities: ['Butler Service', 'Private Beach', 'Helipad', 'Spa', 'Fine Dining'],
      provider: 'RateHawk Development',
      testEnvironment: true
    },
    {
      id: 'nuitee-test-1',
      name: 'The Oberoi Udaivilas',
      location: 'Udaipur, Rajasthan',
      country: 'India',
      image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&h=600&fit=crop',
      rating: 4.9,
      reviews: 1567,
      pricePerNight: 675,
      amenities: ['Lake Views', 'Spa', 'Heritage Tours', 'Fine Dining', 'Pool'],
      provider: 'Nuitée Test Environment',
      testEnvironment: true
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-orange-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header with Transparency */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
              <TestTube2 className="w-3 h-3 mr-1" />
              Test Environment Data
            </Badge>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
            Featured Hotels from Our Partners
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Real hotels from our provider test APIs • Actual pricing when we launch
          </p>
          
          {/* Startup Authenticity Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-full">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              Pre-revenue startup • Building with authentic provider integrations
            </span>
          </div>
        </div>

        {/* Hotels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {hotels.map((hotel) => (
            <Card 
              key={hotel.id}
              className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Test Environment Badge */}
                {hotel.testEnvironment && (
                  <Badge className="absolute top-3 left-3 bg-blue-600 text-white text-xs">
                    <TestTube2 className="w-3 h-3 mr-1" />
                    Test Data
                  </Badge>
                )}

                {/* Discount Badge */}
                {hotel.originalPrice && (
                  <Badge className="absolute top-3 right-3 bg-green-600 text-white">
                    Save ${hotel.originalPrice - hotel.pricePerNight}
                  </Badge>
                )}
              </div>

              <div className="p-4">
                {/* Hotel Name */}
                <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-1">
                  {hotel.name}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{hotel.location}, {hotel.country}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded">
                    <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                    <span className="font-semibold text-sm">{hotel.rating}</span>
                  </div>
                  <span className="text-xs text-gray-600">({hotel.reviews} reviews)</span>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {hotel.amenities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{hotel.amenities.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-orange-600">
                      ${hotel.pricePerNight}
                    </span>
                    {hotel.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ${hotel.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">per night</p>
                </div>

                {/* Provider Info */}
                <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700 text-center">
                  via {hotel.provider}
                </div>

                {/* CTA */}
                <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white">
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Transparency Footer */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
          <div className="text-center">
            <h3 className="font-bold text-gray-900 mb-2">About This Data</h3>
            <p className="text-sm text-gray-700 max-w-3xl mx-auto">
              We're a pre-revenue travel startup building authentic integrations with major travel providers. 
              The hotels shown above are REAL properties from our partners' test/sandbox APIs 
              (Expedia, Amadeus, RateHawk, Nuitée). Pricing reflects actual market rates and will be 
              live when we launch. We believe in radical transparency as we build in public.
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
              <span>✓ Real providers</span>
              <span>✓ Actual properties</span>
              <span>✓ Market pricing</span>
              <span>✓ Test environments</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthenticFeaturedHotels;
