/**
 * Flash Deals Section with Countdown Timer
 * Modern OTA feature - time-sensitive offers
 */

import { useState, useEffect } from 'react';
import { Clock, MapPin, Star, TrendingDown, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FlashDeal {
  id: string;
  destination: string;
  country: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  expiresAt: Date;
  type: 'hotel' | 'flight' | 'package';
}

const FlashDealsSection = () => {
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({});

  const flashDeals: FlashDeal[] = [
    {
      id: '1',
      destination: 'Maldives',
      country: 'Indian Ocean',
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=600&fit=crop',
      originalPrice: 1299,
      discountedPrice: 799,
      discount: 38,
      rating: 4.8,
      reviews: 2341,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
      type: 'hotel'
    },
    {
      id: '2',
      destination: 'Dubai',
      country: 'UAE',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
      originalPrice: 899,
      discountedPrice: 549,
      discount: 39,
      rating: 4.9,
      reviews: 1876,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      type: 'package'
    },
    {
      id: '3',
      destination: 'Bali',
      country: 'Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
      originalPrice: 749,
      discountedPrice: 499,
      discount: 33,
      rating: 4.7,
      reviews: 3102,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      type: 'hotel'
    },
    {
      id: '4',
      destination: 'Tokyo',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
      originalPrice: 1099,
      discountedPrice: 699,
      discount: 36,
      rating: 4.9,
      reviews: 2789,
      expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours
      type: 'flight'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: Record<string, string> = {};
      
      flashDeals.forEach(deal => {
        const now = new Date().getTime();
        const distance = deal.expiresAt.getTime() - now;

        if (distance > 0) {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          newTimeLeft[deal.id] = `${hours}h ${minutes}m ${seconds}s`;
        } else {
          newTimeLeft[deal.id] = 'EXPIRED';
        }
      });

      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
            <Badge className="bg-red-500 text-white text-lg px-4 py-2 animate-bounce">
              FLASH DEALS
            </Badge>
            <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Limited Time Offers
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unbeatable prices that won't last long. Book now before they're gone!
          </p>
        </div>

        {/* Flash Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {flashDeals.map((deal) => (
            <Card 
              key={deal.id}
              className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-orange-100 hover:border-orange-300"
            >
              {/* Deal Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={deal.image} 
                  alt={deal.destination}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                
                {/* Discount Badge */}
                <Badge className="absolute top-3 right-3 bg-red-500 text-white text-lg px-3 py-1 shadow-lg">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  {deal.discount}% OFF
                </Badge>

                {/* Type Badge */}
                <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 capitalize">
                  {deal.type}
                </Badge>
              </div>

              <div className="p-4">
                {/* Destination */}
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <h3 className="font-bold text-lg text-gray-900">{deal.destination}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{deal.country}</p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded">
                    <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                    <span className="font-semibold text-sm">{deal.rating}</span>
                  </div>
                  <span className="text-sm text-gray-600">({deal.reviews} reviews)</span>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-orange-600">
                      ${deal.discountedPrice}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      ${deal.originalPrice}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">per person</p>
                </div>

                {/* Countdown Timer */}
                <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-red-500 animate-pulse" />
                    <span className="text-sm font-bold text-red-600">
                      {timeLeft[deal.id] || 'Loading...'}
                    </span>
                  </div>
                  <p className="text-xs text-center text-gray-600 mt-1">Ends soon!</p>
                </div>

                {/* CTA Button */}
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg">
                  Grab This Deal
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* View All Deals */}
        <div className="text-center mt-10">
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold"
          >
            View All Flash Deals
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FlashDealsSection;
