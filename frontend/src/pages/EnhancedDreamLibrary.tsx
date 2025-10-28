import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  MapPin, Calendar, Users, DollarSign, Star, TrendingUp, 
  Heart, Share2, Sparkles, Award, Clock, Tag, ChevronRight,
  Sun, Palmtree, Mountain, Coffee, ShoppingBag, Camera
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

interface DreamPackage {
  id: string;
  title: string;
  tagline: string;
  destination: string;
  country: string;
  region: string;
  image_url: string;
  image_gallery?: string[];  // Multiple images for gallery view
  duration_days: number;
  age_groups: string[];
  travel_styles: string[];
  pricing: {
    budget: number;
    standard: number;
    premium: number;
    luxury: number;
  };
  itinerary: any[];
  hidden_gems: any[];
  viator_activities_real: any[];
  expedia_hotels_real: any[];
  promotions: any[];
  included: string[];
  upgrades: any[];
  category: string;
  popularity_score: number;
  avg_rating?: number;
  travelers_booked_count?: number;
}

export default function EnhancedDreamLibrary() {
  const [dreams, setDreams] = useState<DreamPackage[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [curatedLists, setCuratedLists] = useState<any>(null);
  const [trendingWidget, setTrendingWidget] = useState<any[]>([]);
  const [seasonalWidget, setSeasonalWidget] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDreamLibrary();
    fetchCuratedLists();
    fetchWidgets();
  }, [selectedRegion, selectedCategory]);

  const fetchDreamLibrary = async () => {
    try {
      const params: any = {};
      if (selectedRegion !== 'all') params.region = selectedRegion;
      if (selectedCategory !== 'all') params.category = selectedCategory;

      const response = await axios.get(`${BACKEND_URL}/api/dream-library/featured`, { params });
      setDreams(response.data.dreams || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dream library:', error);
      setLoading(false);
    }
  };

  const fetchCuratedLists = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/dream-library/curated-lists`);
      setCuratedLists(response.data.curated_lists);
    } catch (error) {
      console.error('Failed to fetch curated lists:', error);
    }
  };

  const fetchWidgets = async () => {
    try {
      const [trending, seasonal] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/dream-library/widgets/trending`),
        axios.get(`${BACKEND_URL}/api/dream-library/widgets/seasonal`)
      ]);
      
      setTrendingWidget(trending.data.dreams || []);
      setSeasonalWidget(seasonal.data.deals || []);
    } catch (error) {
      console.error('Failed to fetch widgets:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('wellness')) return <Sparkles className="w-4 h-4" />;
    if (category.includes('adventure')) return <Mountain className="w-4 h-4" />;
    if (category.includes('cultural')) return <Camera className="w-4 h-4" />;
    if (category.includes('luxury')) return <Award className="w-4 h-4" />;
    if (category.includes('beach')) return <Palmtree className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">
            ✨ Curated Dream Library
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Expert-curated journeys with real Viator experiences & Expedia stays
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <Badge className="bg-white/20 text-white text-lg px-6 py-2">
              <MapPin className="w-4 h-4 mr-2" />
              India, Asia & Middle East
            </Badge>
            <Badge className="bg-white/20 text-white text-lg px-6 py-2">
              <Award className="w-4 h-4 mr-2" />
              Real Viator & Expedia Data
            </Badge>
            <Badge className="bg-white/20 text-white text-lg px-6 py-2">
              <Tag className="w-4 h-4 mr-2" />
              Active Promotions
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Trending Widget */}
        {trendingWidget.length > 0 && (
          <Card className="mb-12 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                🔥 Trending Now
              </CardTitle>
              <CardDescription>Most popular dream packages this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {trendingWidget.map((dream, idx) => (
                  <Card key={dream.id} className="hover:shadow-xl transition-all cursor-pointer group">
                    <div className="relative">
                      <img 
                        src={dream.image_url} 
                        alt={dream.title}
                        className="w-full h-40 object-cover rounded-t-lg"
                      />
                      <Badge className="absolute top-2 left-2 bg-orange-600">
                        #{idx + 1} Trending
                      </Badge>
                      <Badge className="absolute top-2 right-2 bg-green-600">
                        ⭐ {dream.popularity_score}/100
                      </Badge>
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                        {dream.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">{dream.destination}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600 font-bold">${dream.starting_price}</span>
                        <span className="text-xs text-gray-500">{dream.duration_days}D</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seasonal Promotions Widget */}
        {seasonalWidget.length > 0 && (
          <Card className="mb-12 border-pink-200 bg-gradient-to-br from-pink-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Tag className="w-6 h-6 text-pink-600" />
                🎉 Limited Time Offers
              </CardTitle>
              <CardDescription>Save up to 50% on seasonal packages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {seasonalWidget.slice(0, 3).map((deal) => (
                  <Card key={deal.dream_id} className="border-pink-200 hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img 
                        src={deal.image_url} 
                        alt={deal.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <Badge className="absolute top-3 right-3 bg-red-600 text-white text-lg px-4 py-2">
                        {deal.discount_percent}% OFF
                      </Badge>
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-bold mb-2">{deal.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{deal.destination}</p>
                      <div className="bg-green-100 p-3 rounded-lg mb-3">
                        <p className="text-xs font-semibold text-green-800">{deal.promo_title}</p>
                        <p className="text-xs text-green-600 mt-1">Code: {deal.promo_code}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 line-through">${deal.original_price}</p>
                          <p className="text-2xl font-bold text-pink-600">${Math.round(deal.discounted_price)}</p>
                        </div>
                        <Button className="bg-pink-600 hover:bg-pink-700">
                          View Deal
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <Card className="flex-1">
            <CardContent className="pt-6">
              <label className="block text-sm font-medium mb-2">Region</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">All Regions</option>
                <option value="Asia">Asia</option>
                <option value="Middle East">Middle East</option>
                <option value="Europe">Europe</option>
                <option value="Africa">Africa</option>
              </select>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="pt-6">
              <label className="block text-sm font-medium mb-2">Category</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="cultural">Cultural & Heritage</option>
                <option value="wellness">Wellness & Yoga</option>
                <option value="adventure">Adventure</option>
                <option value="luxury">Luxury</option>
                <option value="spiritual">Spiritual</option>
              </select>
            </CardContent>
          </Card>
        </div>

        {/* Curated Lists Tabs */}
        {curatedLists && (
          <Tabs defaultValue="all" className="mb-12">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Dreams</TabsTrigger>
              <TabsTrigger value="wellness">🧘 Wellness</TabsTrigger>
              <TabsTrigger value="adventure">🏔️ Adventure</TabsTrigger>
              <TabsTrigger value="budget">💰 Budget</TabsTrigger>
              <TabsTrigger value="spiritual">🕉️ Spiritual</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <DreamGrid dreams={dreams} />
            </TabsContent>

            <TabsContent value="wellness" className="mt-6">
              <DreamGrid dreams={curatedLists.wellness_retreats?.dreams || []} />
            </TabsContent>

            <TabsContent value="adventure" className="mt-6">
              <DreamGrid dreams={curatedLists.adventure_journeys?.dreams || []} />
            </TabsContent>

            <TabsContent value="budget" className="mt-6">
              <DreamGrid dreams={curatedLists.budget_friendly?.dreams || []} />
            </TabsContent>

            <TabsContent value="spiritual" className="mt-6">
              <DreamGrid dreams={curatedLists.spiritual_paths?.dreams || []} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// Dream Grid Component
function DreamGrid({ dreams }: { dreams: DreamPackage[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {dreams.map((dream) => (
        <Card key={dream.id} className="hover:shadow-2xl transition-all group cursor-pointer overflow-hidden">
          {/* Image */}
          <div className="relative overflow-hidden">
            <img 
              src={dream.image_url} 
              alt={dream.title}
              className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Overlays */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Badge className="bg-orange-600 text-white">
                {dream.region}
              </Badge>
              {dream.promotions && dream.promotions.length > 0 && (
                <Badge className="bg-red-600 text-white animate-pulse">
                  {dream.promotions[0].discount_percent}% OFF
                </Badge>
              )}
            </div>

            <div className="absolute top-4 right-4">
              <Button size="sm" variant="ghost" className="bg-white/80 hover:bg-white">
                <Heart className="w-4 h-4" />
              </Button>
            </div>

            {/* Rating Badge */}
            {dream.avg_rating && (
              <div className="absolute bottom-4 left-4 bg-white/95 px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{dream.avg_rating}</span>
                <span className="text-xs text-gray-600">({dream.travelers_booked_count})</span>
              </div>
            )}
          </div>

          <CardContent className="p-6">
            {/* Title */}
            <h3 className="text-xl font-bold mb-2 group-hover:text-orange-600 transition-colors">
              {dream.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4">{dream.tagline}</p>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {dream.destination}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {dream.duration_days} days
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {getCategoryIcon(dream.category)}
                {dream.category.split('-')[0]}
              </Badge>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 rounded-lg mb-4">
              <p className="text-xs text-gray-600 mb-1">Starting from</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-600">
                  ${dream.pricing.budget}
                </span>
                <span className="text-sm text-gray-500">/ person</span>
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-gray-600">Standard: ${dream.pricing.standard}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">Premium: ${dream.pricing.premium}</span>
              </div>
            </div>

            {/* Data Sources */}
            <div className="flex gap-2 mb-4">
              {dream.viator_activities_real && dream.viator_activities_real.length > 0 && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {dream.viator_activities_real.length} Viator Activities
                </Badge>
              )}
              {dream.expedia_hotels_real && dream.expedia_hotels_real.length > 0 && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {dream.expedia_hotels_real.length} Expedia Hotels
                </Badge>
              )}
            </div>

            {/* CTA */}
            <div className="flex gap-2">
              <Button className="flex-1 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700">
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Popular indicator */}
            {dream.popularity_score && dream.popularity_score > 90 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-orange-600">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold">Popular Choice - {dream.travelers_booked_count}+ travelers</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
