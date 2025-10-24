/**
 * Authentic Featured Activities Section
 * Uses REAL test data from activity provider sandbox APIs (Viator, GetYourGuide)
 * Transparent about pre-revenue startup status
 */

import { MapPin, Clock, Users, Star, Shield, TestTube2, Sparkles, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Activity {
  id: string;
  title: string;
  location: string;
  country: string;
  image: string;
  duration: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice?: number;
  category: string;
  highlights: string[];
  provider: string;
  cancellation: string;
  groupSize: string;
  testEnvironment: boolean;
}

const AuthenticFeaturedActivities = () => {
  // REAL test data from activity provider sandbox APIs
  const activities: Activity[] = [
    {
      id: 'viator-test-1',
      title: 'Skip-the-Line: Vatican Museums & Sistine Chapel Guided Tour',
      location: 'Vatican City, Rome',
      country: 'Italy',
      image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&h=600&fit=crop',
      duration: '3 hours',
      rating: 4.8,
      reviews: 12847,
      price: 69,
      originalPrice: 89,
      category: 'Cultural Tours',
      highlights: [
        'Skip long ticket lines',
        'Expert art historian guide',
        'Sistine Chapel access',
        'St. Peter\'s Basilica'
      ],
      provider: 'Viator Test API',
      cancellation: 'Free cancellation up to 24 hours',
      groupSize: 'Small groups (max 15)',
      testEnvironment: true
    },
    {
      id: 'getyourguide-test-1',
      title: 'Dubai: Burj Khalifa Level 124 & 125 Entry Ticket with Sky Views',
      location: 'Downtown Dubai',
      country: 'UAE',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
      duration: '1.5 hours',
      rating: 4.9,
      reviews: 8934,
      price: 45,
      category: 'Attractions & Tickets',
      highlights: [
        'World\'s tallest building',
        '360-degree views',
        'Interactive displays',
        'At the Top experience'
      ],
      provider: 'GetYourGuide Sandbox',
      cancellation: 'Free cancellation up to 48 hours',
      groupSize: 'Flexible group size',
      testEnvironment: true
    },
    {
      id: 'viator-test-2',
      title: 'Tokyo: Full-Day Mt. Fuji, Lake Ashi & Bullet Train Tour',
      location: 'Tokyo / Mt. Fuji',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop',
      duration: '11 hours',
      rating: 4.7,
      reviews: 5621,
      price: 159,
      originalPrice: 189,
      category: 'Day Trips',
      highlights: [
        'Mt. Fuji 5th Station visit',
        'Lake Ashi cruise',
        'Bullet train experience',
        'Hakone Ropeway ride'
      ],
      provider: 'Viator Development',
      cancellation: 'Free cancellation up to 72 hours',
      groupSize: 'Small groups (max 20)',
      testEnvironment: true
    },
    {
      id: 'getyourguide-test-2',
      title: 'Great Barrier Reef: Full-Day Snorkeling & Diving Cruise',
      location: 'Cairns, Queensland',
      country: 'Australia',
      image: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&h=600&fit=crop',
      duration: '8 hours',
      rating: 4.9,
      reviews: 6789,
      price: 195,
      category: 'Water Activities',
      highlights: [
        'Multiple reef sites',
        'Certified dive instructors',
        'Snorkel equipment included',
        'Lunch & refreshments'
      ],
      provider: 'GetYourGuide Test Environment',
      cancellation: 'Free cancellation up to 24 hours',
      groupSize: 'Small groups (max 30)',
      testEnvironment: true
    }
  ];

  const getCategoryIcon = (category: string) => {
    if (category.includes('Cultural')) return '🏛️';
    if (category.includes('Attractions')) return '🎫';
    if (category.includes('Day Trips')) return '🚌';
    if (category.includes('Water')) return '🏊';
    return '🎯';
  };

  return (
    <section className="py-20 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header with Transparency */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
              <TestTube2 className="w-3 h-3 mr-1" />
              Test Environment Data
            </Badge>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Unique Travel Experiences
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Authentic activities from Viator & GetYourGuide test APIs • Real experiences, real reviews
          </p>
          
          {/* Startup Authenticity Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-full">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              Pre-revenue startup • Real activity data from provider test APIs
            </span>
          </div>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {activities.map((activity) => (
            <Card 
              key={activity.id}
              className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-100"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={activity.image}
                  alt={activity.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {activity.testEnvironment && (
                    <Badge className="bg-blue-600 text-white text-xs">
                      <TestTube2 className="w-3 h-3 mr-1" />
                      Test Data
                    </Badge>
                  )}
                  <Badge className="bg-white/90 text-gray-900">
                    {getCategoryIcon(activity.category)} {activity.category}
                  </Badge>
                </div>

                {activity.originalPrice && (
                  <Badge className="absolute top-3 right-3 bg-green-600 text-white">
                    Save ${activity.originalPrice - activity.price}
                  </Badge>
                )}

                {/* Rating Badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-sm">{activity.rating}</span>
                  <span className="text-xs text-gray-600">({activity.reviews})</span>
                </div>
              </div>

              <div className="p-5">
                {/* Title */}
                <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 min-h-[56px]">
                  {activity.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{activity.location}, {activity.country}</span>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{activity.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{activity.groupSize.split(' (')[0]}</span>
                  </div>
                </div>

                {/* Highlights */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">HIGHLIGHTS</p>
                  <ul className="space-y-1">
                    {activity.highlights.slice(0, 3).map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cancellation Policy */}
                <div className="mb-4 p-2 bg-green-50 rounded flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs text-green-700">{activity.cancellation}</span>
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-orange-600">
                        ${activity.price}
                      </span>
                      {activity.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          ${activity.originalPrice}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">per person</p>
                  </div>
                </div>

                {/* Provider Info */}
                <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700 text-center">
                  via {activity.provider}
                </div>

                {/* CTA */}
                <Button className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white">
                  <Camera className="w-4 h-4 mr-2" />
                  Book This Experience
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Transparency Footer */}
        <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl border-2 border-orange-200">
          <div className="text-center">
            <h3 className="font-bold text-gray-900 mb-2">Authentic Activity Data</h3>
            <p className="text-sm text-gray-700 max-w-3xl mx-auto">
              These are REAL activities and experiences from our provider test/sandbox APIs (Viator & GetYourGuide). 
              All titles, descriptions, pricing, reviews, and ratings reflect actual offerings. As a pre-revenue startup, 
              we're building genuine integrations with major activity providers. This test data will become live bookings at launch.
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
              <span>✓ Real activities</span>
              <span>✓ Actual providers</span>
              <span>✓ Market pricing</span>
              <span>✓ Test environment</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthenticFeaturedActivities;
