/**
 * Trending Destinations Section
 * Modern visual destination showcase
 */

import { TrendingUp, Users, ThumbsUp, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  description: string;
  trendingScore: number;
  bookingsThisWeek: number;
  startingPrice: number;
  popularActivities: string[];
  bestTimeToVisit: string;
}

const TrendingDestinationsSection = () => {
  const destinations: Destination[] = [
    {
      id: '1',
      name: 'Santorini',
      country: 'Greece',
      image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=600&fit=crop',
      description: 'Iconic white-washed buildings and stunning sunsets',
      trendingScore: 98,
      bookingsThisWeek: 1247,
      startingPrice: 599,
      popularActivities: ['Sunset Views', 'Wine Tasting', 'Beach Hopping'],
      bestTimeToVisit: 'Apr - Oct'
    },
    {
      id: '2',
      name: 'Kyoto',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop',
      description: 'Ancient temples and traditional Japanese culture',
      trendingScore: 95,
      bookingsThisWeek: 1089,
      startingPrice: 749,
      popularActivities: ['Temple Tours', 'Tea Ceremony', 'Cherry Blossoms'],
      bestTimeToVisit: 'Mar - May'
    },
    {
      id: '3',
      name: 'Iceland',
      country: 'Northern Europe',
      image: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&h=600&fit=crop',
      description: 'Northern lights and breathtaking natural wonders',
      trendingScore: 92,
      bookingsThisWeek: 876,
      startingPrice: 899,
      popularActivities: ['Northern Lights', 'Blue Lagoon', 'Glacier Hiking'],
      bestTimeToVisit: 'Sep - Mar'
    },
    {
      id: '4',
      name: 'Morocco',
      country: 'North Africa',
      image: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800&h=600&fit=crop',
      description: 'Exotic markets and Sahara desert adventures',
      trendingScore: 89,
      bookingsThisWeek: 734,
      startingPrice: 549,
      popularActivities: ['Sahara Desert', 'Medina Tours', 'Moroccan Cuisine'],
      bestTimeToVisit: 'Oct - Apr'
    },
    {
      id: '5',
      name: 'New Zealand',
      country: 'Oceania',
      image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&h=600&fit=crop',
      description: 'Epic landscapes and adventure activities',
      trendingScore: 94,
      bookingsThisWeek: 1156,
      startingPrice: 1099,
      popularActivities: ['Bungee Jumping', 'Milford Sound', 'Hobbiton'],
      bestTimeToVisit: 'Nov - Apr'
    },
    {
      id: '6',
      name: 'Peru',
      country: 'South America',
      image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop',
      description: 'Machu Picchu and ancient Incan civilization',
      trendingScore: 91,
      bookingsThisWeek: 923,
      startingPrice: 649,
      popularActivities: ['Machu Picchu', 'Inca Trail', 'Amazon Rainforest'],
      bestTimeToVisit: 'May - Sep'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <Badge className="bg-green-100 text-green-700 text-sm px-3 py-1">
              Trending Now
            </Badge>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Most Popular Destinations
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover where travelers are heading this season
          </p>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((destination, index) => (
            <Card 
              key={destination.id}
              className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-none"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Image with Overlay */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Trending Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-gray-900 font-semibold">
                    <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                    #{index + 1} Trending
                  </Badge>
                </div>

                {/* Like Button */}
                <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                  <Heart className="w-5 h-5 text-gray-700 hover:fill-red-500 hover:text-red-500 transition-colors" />
                </button>

                {/* Destination Name Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {destination.name}
                  </h3>
                  <p className="text-white/90 text-sm">{destination.country}</p>
                </div>
              </div>

              <div className="p-6">
                {/* Description */}
                <p className="text-gray-600 mb-4 min-h-[48px]">
                  {destination.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <ThumbsUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Trend Score</p>
                      <p className="font-bold text-orange-600">{destination.trendingScore}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">This Week</p>
                      <p className="font-bold text-blue-600">{destination.bookingsThisWeek.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Popular Activities */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">POPULAR ACTIVITIES</p>
                  <div className="flex flex-wrap gap-2">
                    {destination.popularActivities.map((activity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Best Time */}
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Best time to visit:</span> {destination.bestTimeToVisit}
                  </p>
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Starting from</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${destination.startingPrice}
                    </p>
                  </div>
                  <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white">
                    Explore
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View More */}
        <div className="text-center mt-12">
          <Button 
            size="lg"
            variant="outline"
            className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-8"
          >
            Discover More Destinations
          </Button>
        </div>
      </div>

      {/* Add animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default TrendingDestinationsSection;
