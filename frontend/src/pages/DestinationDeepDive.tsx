/**
 * Destination Deep Dive - Immersive Destination Experience
 * Shows everything about a destination + related dreams + route building
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, TrendingUp, Users, DollarSign, Leaf, Star, Heart,
  Plane, Hotel, Camera, UtensilsCrossed, Sparkles, ArrowRight,
  Map as MapIcon, Route, Globe, Award, ShoppingBag
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface DestinationData {
  country: string;
  region: string;
  heroImage: string;
  heroVideo?: string;
  tagline: string;
  liveStats: {
    travelersPlanning: number;
    bookedThisWeek: number;
    trendingPercent: number;
    avgBudgetPerDay: number;
    carbonOffset: number;
    immersionScore: number;
  };
  spiritualSites: { name: string; description: string; image: string }[];
  hiddenGems: { name: string; type: string; description: string; price: string; mustTry: string }[];
  hotels: { name: string; provider: string; price: number; rating: number; bids: number }[];
  restaurants: { name: string; cuisine: string; priceRange: string; local: boolean; mustTry: string }[];
  airlines: { airline: string; route: string; price: number; provider: string }[];
  localBusinesses: { name: string; type: string; description: string; contact: string }[];
  relatedDestinations: { country: string; distance: string; flightTime: string; combinedSavings: number; image: string }[];
}

const DestinationDeepDive = () => {
  const { country } = useParams<{ country: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [destinationData, setDestinationData] = useState<DestinationData | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDestinationData();
  }, [country]);

  const loadDestinationData = async () => {
    // TODO: Fetch from API
    // Mock data for India as example
    const indiaData: DestinationData = {
      country: 'India',
      region: 'South Asia',
      heroImage: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200',
      tagline: 'Spiritual awakening meets vibrant culture',
      liveStats: {
        travelersPlanning: 234,
        bookedThisWeek: 18,
        trendingPercent: 23,
        avgBudgetPerDay: 60,
        carbonOffset: 45,
        immersionScore: 98
      },
      spiritualSites: [
        { name: 'Taj Mahal, Agra', description: 'Monument of eternal love, UNESCO World Heritage', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400' },
        { name: 'Varanasi Ghats', description: 'Sacred Ganges river ceremonies at dawn', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400' },
        { name: 'Golden Temple, Amritsar', description: 'Sikh holy shrine, free community kitchen', image: 'https://images.unsplash.com/photo-1588067479315-751b1a1e5b1e?w=400' }
      ],
      hiddenGems: [
        { name: 'Indian Coffee House Delhi', type: 'cafe', description: 'Intellectual hub since 1950s', price: '₹40', mustTry: 'Filter coffee & samosas' },
        { name: 'Karim\'s Jama Masjid', type: 'restaurant', description: 'Mughlai cuisine since 1913', price: '₹350', mustTry: 'Mutton korma' },
        { name: 'Social Hauz Khas', type: 'bar', description: 'Hipster bar ancient ruins', price: '₹500', mustTry: 'Craft cocktails overlooking lake' },
        { name: 'Lodhi Garden Dawn', type: 'spot', description: 'Locals yoga & meditation spot', price: 'Free', mustTry: 'Sunrise 6am, peaceful' }
      ],
      hotels: [
        { name: 'The Oberoi Udaivilas', provider: 'Nuitée Test', price: 675, rating: 4.9, bids: 3 },
        { name: 'Taj Lake Palace', provider: 'Amadeus Test', price: 550, rating: 4.8, bids: 5 },
        { name: 'ITC Maurya Delhi', provider: 'Expedia Sandbox', price: 220, rating: 4.7, bids: 2 }
      ],
      restaurants: [
        { name: 'Karim\'s', cuisine: 'Mughlai', priceRange: '₹₹', local: true, mustTry: 'Mutton korma since 1913' },
        { name: 'Indian Accent', cuisine: 'Modern Indian', priceRange: '₹₹₹₹', local: true, mustTry: 'Meetha achaar pork ribs' },
        { name: 'Paranthe Wali Gali', cuisine: 'Street Food', priceRange: '₹', local: true, mustTry: 'Stuffed parathas ₹50' }
      ],
      airlines: [
        { airline: 'Air India', route: 'NYC → DEL', price: 750, provider: 'Sabre Test' },
        { airline: 'Emirates', route: 'LON → DEL via DXB', price: 820, provider: 'Duffle Sandbox' },
        { airline: 'Qatar Airways', route: 'SFO → DEL via DOH', price: 890, provider: 'Amadeus Test' }
      ],
      localBusinesses: [
        { name: 'Delhi Heritage Walks', type: 'guide', description: 'Local historian guides, family-run', contact: 'WhatsApp booking' },
        { name: 'Kashmir Shawl Artisans', type: 'shop', description: 'Direct from weavers, authentic pashmina', contact: 'In-person only' },
        { name: 'Varanasi Boat Sunrise', type: 'experience', description: 'Family boat business 3 generations', contact: 'Book via guesthouse' }
      ],
      relatedDestinations: [
        { country: 'Nepal', distance: '200km', flightTime: '1.5hr', combinedSavings: 800, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' },
        { country: 'Bhutan', distance: '600km', flightTime: '2hr', combinedSavings: 1200, image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400' },
        { country: 'Sri Lanka', distance: '1800km', flightTime: '3hr', combinedSavings: 600, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400' },
        { country: 'Maldives', distance: '2200km', flightTime: '3.5hr', combinedSavings: 900, image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400' }
      ]
    };

    setDestinationData(indiaData);
  };

  if (!destinationData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <img 
          src={destinationData.heroImage} 
          alt={destinationData.country}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <Badge className="mb-4 bg-white/10 backdrop-blur border-white/20 text-white">
              {destinationData.region}
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">
              {destinationData.country}
            </h1>
            <p className="text-xl text-white/90 mb-6">{destinationData.tagline}</p>
            
            {/* Live Stats */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="text-center">
                <Users className="w-5 h-5 text-white/70 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{destinationData.liveStats.travelersPlanning}</p>
                <p className="text-xs text-white/70">Planning Now</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">↑{destinationData.liveStats.trendingPercent}%</p>
                <p className="text-xs text-white/70">Trending</p>
              </div>
              <div className="text-center">
                <DollarSign className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">${destinationData.liveStats.avgBudgetPerDay}</p>
                <p className="text-xs text-white/70">Avg/Day</p>
              </div>
              <div className="text-center">
                <Leaf className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">${destinationData.liveStats.carbonOffset}</p>
                <p className="text-xs text-white/70">Offset</p>
              </div>
              <div className="text-center">
                <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{destinationData.liveStats.immersionScore}</p>
                <p className="text-xs text-white/70">Immersion</p>
              </div>
              <div className="text-center">
                <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{destinationData.liveStats.bookedThisWeek}</p>
                <p className="text-xs text-white/70">Booked</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - 3 cols */}
            <div className="lg:col-span-3">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="spiritual">Spiritual Sites</TabsTrigger>
                  <TabsTrigger value="hidden">Hidden Gems</TabsTrigger>
                  <TabsTrigger value="hotels">Hotels (Live Bids)</TabsTrigger>
                  <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
                  <TabsTrigger value="activities">Activities</TabsTrigger>
                  <TabsTrigger value="local">Local Businesses</TabsTrigger>
                </TabsList>

                <TabsContent value="hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {destinationData.hiddenGems.map((gem, idx) => (
                      <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-lg">{gem.name}</h3>
                          <Badge variant="outline" className="capitalize">{gem.type}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{gem.description}</p>
                        <p className="text-sm font-semibold text-purple-600 mb-2">💰 {gem.price}</p>
                        <p className="text-sm text-amber-700">✨ Must try: {gem.mustTry}</p>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="hotels">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
                      <p className="text-sm font-semibold text-green-900">
                        🎯 {destinationData.hotels.reduce((sum, h) => sum + h.bids, 0)} providers actively bidding on India hotels
                      </p>
                    </div>

                    {destinationData.hotels.map((hotel, idx) => (
                      <Card key={idx} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-xl mb-1">{hotel.name}</h3>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {Array.from({length: Math.floor(hotel.rating)}).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                              <span className="text-sm text-slate-600">{hotel.rating}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-blue-600 text-white mb-2">
                              {hotel.bids} Active Bids
                            </Badge>
                            <p className="text-2xl font-bold text-purple-600">${hotel.price}</p>
                            <p className="text-xs text-slate-500">per night</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" className="flex-1">
                            View {hotel.bids} Offers
                          </Button>
                          <Button className="flex-1 bg-green-600 hover:bg-green-700">
                            Best Deal: ${hotel.price * 0.8}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="restaurants">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {destinationData.restaurants.map((rest, idx) => (
                      <Card key={idx} className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold">{rest.name}</h3>
                          {rest.local && <Badge className="bg-green-600 text-white text-xs">Local</Badge>}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{rest.cuisine}</p>
                        <p className="text-sm mb-2">{rest.priceRange}</p>
                        <p className="text-sm text-amber-700">✨ {rest.mustTry}</p>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Related Dreams & Route Builder */}
            <div className="space-y-6">
              {/* Related Destinations */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  Related Dreams Nearby
                </h3>
                <div className="space-y-4">
                  {destinationData.relatedDestinations.map((dest, idx) => (
                    <div key={idx} className="cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <img src={dest.image} alt={dest.country} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{dest.country}</h4>
                          <p className="text-xs text-slate-600">✈️ {dest.flightTime} • {dest.distance}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        Save ${dest.combinedSavings} if combined
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-rose-600">
                  <Route className="w-4 h-4 mr-2" />
                  Build Multi-Country Route
                </Button>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="font-bold mb-4">Create Dream</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create {country} Dream
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MapIcon className="w-4 h-4 mr-2" />
                    Build Custom Route
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DestinationDeepDive;
