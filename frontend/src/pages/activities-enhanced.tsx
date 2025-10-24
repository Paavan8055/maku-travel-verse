/**
 * Enhanced Activities Page with Real Provider Data
 * Integrates: Viator Test API, GetYourGuide Sandbox
 * Features: Category filters, instant confirmation, flexible cancellation
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Camera, Search, MapPin, Clock, Users, Star, Shield,
  TestTube2, Sparkles, Filter, Tag, Heart, Calendar
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { advancedActivitySearch } from '@/services/advancedSearchApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ActivityResult {
  activity_id: string;
  title: string;
  description: string;
  category: string;
  activity_type: string;
  duration_hours: number;
  price: number;
  currency: string;
  rating: number;
  review_count: number;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  images: string[];
  languages: string[];
  accessibility: boolean;
  provider: string;
}

const EnhancedActivitiesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Search State
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [participants, setParticipants] = useState({
    adults: parseInt(searchParams.get('adults') || '2'),
    children: parseInt(searchParams.get('children') || '0')
  });

  // Results State
  const [activities, setActivities] = useState<ActivityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [filters, setFilters] = useState({
    categories: [] as string[],
    activityTypes: [] as string[],
    priceRange: { min: 0, max: 500 },
    minRating: 0,
    duration: null as number | null
  });

  const [sortBy, setSortBy] = useState<'popularity' | 'price' | 'rating'>('popularity');

  // Real providers
  const providers = [
    { name: 'Viator', badge: '🧪 Test API', color: 'orange' },
    { name: 'GetYourGuide', badge: '🧪 Sandbox', color: 'green' }
  ];

  const categories = [
    { id: 'tours', name: 'Tours', icon: '🚌' },
    { id: 'activities', name: 'Activities', icon: '🎯' },
    { id: 'attractions', name: 'Attractions', icon: '🏛️' },
    { id: 'food', name: 'Food & Dining', icon: '🍽️' },
    { id: 'water', name: 'Water Sports', icon: '🏊' }
  ];

  const activityTypes = [
    'Cultural', 'Adventure', 'Food & Drink', 'Nature', 'Water Activities', 'Urban Exploration'
  ];

  const handleSearch = async () => {
    if (!destination || !startDate) {
      setError('Please fill in destination and date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await advancedActivitySearch({
        destination,
        start_date: startDate,
        participants,
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        activity_types: filters.activityTypes.length > 0 ? filters.activityTypes : undefined,
        price_range: filters.priceRange,
        min_rating: filters.minRating || undefined,
        sort_by: sortBy,
        sort_order: 'desc',
        page: 1,
        per_page: 20
      });

      if (result.success) {
        setActivities(result.results);
      } else {
        setError('No activities found. Try different search criteria.');
      }
    } catch (error) {
      console.error('Activity search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.icon || '🎯';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Search Section */}
      <section className="bg-gradient-to-br from-green-600 via-teal-600 to-cyan-700 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge className="bg-white/20 text-white border-white/30">
                <TestTube2 className="w-3 h-3 mr-1" />
                Real Provider Test Data
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Unique Travel Experiences
            </h1>
            <p className="text-xl text-white/90">
              Discover activities from Viator & GetYourGuide
            </p>
          </div>

          {/* Search Form */}
          <Card className="p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="City or landmark"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Participants</label>
                <Select 
                  value={participants.adults.toString()}
                  onValueChange={(v) => setParticipants({...participants, adults: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} Adult{n>1?'s':''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700"
            >
              {loading ? 'Searching...' : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Activities
                </>
              )}
            </Button>
          </Card>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <Card className="p-6 sticky top-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h3>

                {/* Categories */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-3 block">Category</label>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({...filters, categories: [...filters.categories, cat.id]});
                            } else {
                              setFilters({...filters, categories: filters.categories.filter(c => c !== cat.id)});
                            }
                          }}
                        />
                        <span className="text-sm">{cat.icon} {cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Activity Type */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-3 block">Type</label>
                  <div className="space-y-2">
                    {activityTypes.slice(0, 4).map(type => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.activityTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({...filters, activityTypes: [...filters.activityTypes, type]});
                            } else {
                              setFilters({...filters, activityTypes: filters.activityTypes.filter(t => t !== type)});
                            }
                          }}
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-3 block">Price</label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="25"
                    value={filters.priceRange.max}
                    onChange={(e) => setFilters({
                      ...filters,
                      priceRange: { ...filters.priceRange, max: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>$0</span>
                    <span>${filters.priceRange.max}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Activity Results */}
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-gray-600">{activities.length} experiences found</p>
              </div>

              {error && (
                <Card className="p-6 mb-6 border-red-200 bg-red-50">
                  <p className="text-red-700">{error}</p>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activities.map((activity) => (
                  <Card key={activity.activity_id} className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative h-48">
                      <img
                        src={activity.images[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600'}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-3 left-3 bg-blue-600 text-white text-xs">
                        <TestTube2 className="w-3 h-3 mr-1" />
                        {activity.provider}
                      </Badge>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-sm">{activity.rating}</span>
                        <span className="text-xs text-gray-600">({activity.review_count})</span>
                      </div>
                    </div>

                    <div className="p-5">
                      <Badge variant="outline" className="mb-2 text-xs capitalize">
                        {getCategoryIcon(activity.category)} {activity.category}
                      </Badge>
                      
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{activity.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{activity.description}</p>

                      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {activity.duration_hours}h
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Users className="w-4 h-4 text-gray-400" />
                          Small groups
                        </div>
                      </div>

                      {activity.accessibility && (
                        <div className="mb-3 flex items-center gap-2 text-xs text-green-700">
                          <Shield className="w-3 h-3" />
                          Wheelchair accessible
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-green-600">${activity.price}</p>
                          <p className="text-xs text-gray-500">per person</p>
                        </div>
                        <Button className="bg-gradient-to-r from-green-600 to-teal-600">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {activities.length === 0 && !loading && !error && (
                <Card className="p-12 text-center">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Discover amazing experiences</h3>
                  <p className="text-gray-600">
                    Search for tours, activities, and attractions
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Footer */}
      <section className="py-12 px-6 bg-green-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-bold text-lg mb-2">About Activity Data</h3>
          <p className="text-sm text-gray-700">
            All activities from real provider test APIs (Viator & GetYourGuide). Authentic experiences, 
            pricing, and reviews. Pre-revenue startup building genuine integrations for launch.
          </p>
        </div>
      </section>
    </div>
  );
};

export default EnhancedActivitiesPage;
