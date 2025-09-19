import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Sparkles, 
  Brain,
  Target,
  Lightbulb,
  Plane,
  Zap,
  RefreshCw,
  TrendingUp,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Heart,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Layers,
  Globe,
  Camera,
  Compass
} from 'lucide-react';

import { EnhancedDreamGrid } from './EnhancedDreamGrid';
import { UserInsightsPanel } from './UserInsightsPanel';
import { SocialGamificationHub } from '../gamification/SocialGamificationHub';
import { useEnhancedDreams } from '@/hooks/useEnhancedDreams';

interface AIInsight {
  id: string;
  type: 'price_drop' | 'weather_optimal' | 'trending' | 'personal_match';
  title: string;
  description: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actionText: string;
  destination?: string;
  savings?: number;
}

interface DreamDestination {
  id: string;
  name: string;
  country: string;
  continent: string;
  category: string;
  rating: number;
  price: number;
  currency: string;
  image: string;
  aiScore: number;
  description: string;
  highlights: string[];
  bestTime: string;
  trending: boolean;
  urgent: boolean;
}

export const InnovativeSmartDreamDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [travelDNA, setTravelDNA] = useState<any>(null);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [dreamDestinations, setDreamDestinations] = useState<DreamDestination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<DreamDestination | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'immersive' | 'comparison'>('cards');

  const {
    destinations,
    userProfile,
    userInsights,
    loading,
    error,
    refetch,
    behaviorTracking,
    setBehaviorTracking,
  } = useEnhancedDreams({
    includeAIContext: true
  });

  // Initialize with stunning destinations
  useEffect(() => {
    const stunningDestinations: DreamDestination[] = [
      {
        id: 'tokyo-japan',
        name: 'Tokyo',
        country: 'Japan',
        continent: 'Asia',
        category: 'Cultural',
        rating: 4.8,
        price: 180,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1698923824953-a0bf7462e79d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjB0cmF2ZWwlMjBkZXN0aW5hdGlvbnN8ZW58MHx8fHwxNzU4MzAxMjQ2fDA&ixlib=rb-4.1.0&q=85',
        aiScore: 94,
        description: 'Ultra-modern metropolis blending ancient traditions with cutting-edge technology',
        highlights: ['Shibuya Crossing', 'Tokyo Skytree', 'Imperial Palace', 'Robot Restaurant'],
        bestTime: 'March-May, September-November',
        trending: true,
        urgent: false
      },
      {
        id: 'santorini-greece',
        name: 'Santorini',
        country: 'Greece',
        continent: 'Europe',
        category: 'Romance',
        rating: 4.9,
        price: 220,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1552873547-b88e7b2760e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjB0cmF2ZWwlMjBkZXN0aW5hdGlvbnN8ZW58MHx8fHwxNzU4MzAxMjQ2fDA&ixlib=rb-4.1.0&q=85',
        aiScore: 96,
        description: 'Breathtaking sunsets over whitewashed villages and crystal-clear Aegean waters',
        highlights: ['Oia Village', 'Red Beach', 'Akrotiri Ruins', 'Wine Tasting'],
        bestTime: 'April-June, September-October',
        trending: false,
        urgent: true
      },
      {
        id: 'bali-indonesia',
        name: 'Bali',
        country: 'Indonesia',
        continent: 'Asia',
        category: 'Adventure',
        rating: 4.7,
        price: 95,
        currency: 'USD',
        image: 'https://images.pexels.com/photos/261204/pexels-photo-261204.jpeg',
        aiScore: 88,
        description: 'Tropical paradise with lush rice terraces, ancient temples, and vibrant culture',
        highlights: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Mount Batur', 'Seminyak Beach'],
        bestTime: 'April-October',
        trending: true,
        urgent: false
      },
      {
        id: 'iceland-reykjavik',
        name: 'Iceland',
        country: 'Iceland',
        continent: 'Europe',
        category: 'Nature',
        rating: 4.8,
        price: 280,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1694084086064-9cdd1ef07d71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxzdHVubmluZyUyMGxhbmRzY2FwZXN8ZW58MHx8fHwxNzU4MzAxMjUxfDA&ixlib=rb-4.1.0&q=85',
        aiScore: 92,
        description: 'Land of fire and ice with dramatic landscapes, Northern Lights, and geothermal wonders',
        highlights: ['Blue Lagoon', 'Northern Lights', 'Golden Circle', 'Jokulsarlon Glacier'],
        bestTime: 'June-August, September-March (Northern Lights)',
        trending: true,
        urgent: true
      },
      {
        id: 'dubai-uae',
        name: 'Dubai',
        country: 'UAE',
        continent: 'Asia',
        category: 'Luxury',
        rating: 4.6,
        price: 250,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1719294008010-44116946e5b5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB0cmF2ZWwlMjBkZXN0aW5hdGlvbnN8ZW58MHx8fHwxNzU4MzAxMjQ2fDA&ixlib=rb-4.1.0&q=85',
        aiScore: 89,
        description: 'Futuristic city of luxury, innovation, and architectural marvels in the desert',
        highlights: ['Burj Khalifa', 'Palm Jumeirah', 'Dubai Mall', 'Desert Safari'],
        bestTime: 'November-March',
        trending: false,
        urgent: false
      },
      {
        id: 'scotland-highlands',
        name: 'Scottish Highlands',
        country: 'Scotland',
        continent: 'Europe',
        category: 'Adventure',
        rating: 4.8,
        price: 160,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1694084854989-24693f767f98?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwzfHxzdXVubmluZyUyMGxhbmRzY2FwZXN8ZW58MHx8fHwxNzU4MzAxMjUxfDA&ixlib=rb-4.1.0&q=85',
        aiScore: 91,
        description: 'Rugged landscapes, ancient castles, and mystical lochs in breathtaking natural beauty',
        highlights: ['Isle of Skye', 'Loch Ness', 'Edinburgh Castle', 'Glen Coe'],
        bestTime: 'May-September',
        trending: true,
        urgent: false
      }
    ];

    setDreamDestinations(stunningDestinations);

    // Initialize AI insights
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'price_drop',
        title: 'Flight Price Alert: Tokyo',
        description: 'Flights to Tokyo dropped 25% - perfect time to book your dream trip!',
        confidence: 94,
        urgency: 'high',
        actionText: 'Book Now',
        destination: 'Tokyo',
        savings: 420
      },
      {
        id: '2',
        type: 'weather_optimal',
        title: 'Perfect Weather Window: Iceland',
        description: 'Northern Lights season begins next month with ideal viewing conditions predicted',
        confidence: 87,
        urgency: 'medium',
        actionText: 'Plan Trip',
        destination: 'Iceland'
      },
      {
        id: '3',
        type: 'trending',
        title: 'Rising Destination: Scottish Highlands',
        description: 'Instagram buzz +300% this month. Book before crowds discover this gem!',
        confidence: 91,
        urgency: 'medium',
        actionText: 'Explore',
        destination: 'Scottish Highlands'
      }
    ];

    setAIInsights(mockInsights);
  }, []);

  const analyzeTravelDNA = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const mockDNA = {
        primaryType: 'Cultural Explorer',
        confidence: 89,
        traits: [
          { name: 'Cultural Curiosity', score: 94, trend: 'increasing' },
          { name: 'Photography Passion', score: 87, trend: 'stable' },
          { name: 'Culinary Adventure', score: 82, trend: 'increasing' },
          { name: 'Social Connection', score: 76, trend: 'stable' }
        ],
        recommendations: [
          'You thrive in destinations rich with history and local traditions',
          'Photography opportunities significantly influence your destination choices',
          'Local cuisine exploration is a key motivator for your travels'
        ]
      };
      
      setTravelDNA(mockDNA);
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleDestinationClick = (destination: DreamDestination) => {
    setSelectedDestination(destination);
  };

  const handleBookNow = (destination: DreamDestination) => {
    // Simulate booking action
    alert(`Booking ${destination.name} - Connecting to booking system...`);
  };

  const handleAddToWishlist = (destination: DreamDestination) => {
    // Simulate wishlist action
    alert(`${destination.name} added to your dream destinations!`);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'price_drop': return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'weather_optimal': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'trending': return <TrendingUp className="h-5 w-5 text-purple-500" />;
      default: return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Futuristic Header */}
      <div className="relative border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-purple-500 p-2 rounded-full">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI Dream Intelligence Hub
                </h1>
                <p className="text-cyan-200/80 text-sm">
                  Next-generation travel planning powered by advanced AI
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant={showAIInsights ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAIInsights(!showAIInsights)}
                className={`relative overflow-hidden transition-all duration-300 ${
                  showAIInsights 
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600' 
                    : 'border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10'
                }`}
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Intelligence
                {showAIInsights && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white text-xs">
                    ACTIVE
                  </Badge>
                )}
              </Button>

              <Button
                variant={behaviorTracking ? "default" : "outline"}
                size="sm"
                onClick={() => setBehaviorTracking(!behaviorTracking)}
                className={`transition-all duration-300 ${
                  behaviorTracking 
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600' 
                    : 'border-pink-400/50 text-pink-300 hover:bg-pink-500/10'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Learning
                {behaviorTracking && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white text-xs">
                    ON
                  </Badge>
                )}
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* AI Intelligence Banner */}
        {showAIInsights && (
          <Card className="mb-8 bg-gradient-to-r from-cyan-900/50 via-purple-900/50 to-pink-900/50 border-cyan-500/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur opacity-75"></div>
                    <Brain className="relative h-8 w-8 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">AI Intelligence Dashboard</h3>
                    <p className="text-cyan-200/80">Real-time insights powered by advanced machine learning</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {aiInsights.slice(0, 2).map((insight, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      {getInsightIcon(insight.type)}
                      <span className="text-white/90">{insight.title.split(':')[0]}</span>
                      <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                        {insight.confidence}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400">Travel DNA</div>
                    <div className="text-xs text-cyan-200">Personality Analysis</div>
                    <Progress value={travelDNA ? 89 : 0} className="mt-2 h-1" />
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{dreamDestinations.length}</div>
                    <div className="text-xs text-purple-200">AI Recommendations</div>
                    <Progress value={85} className="mt-2 h-1" />
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">{aiInsights.length}</div>
                    <div className="text-xs text-orange-200">Live Insights</div>
                    <Progress value={92} className="mt-2 h-1" />
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-400 rounded-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">$1,420</div>
                    <div className="text-xs text-green-200">Potential Savings</div>
                    <Progress value={76} className="mt-2 h-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revolutionary Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
            {[
              { value: 'discover', label: 'Discover', icon: Compass },
              { value: 'ai-dna', label: 'Travel DNA', icon: Brain },
              { value: 'ai-recs', label: 'AI Picks', icon: Target },
              { value: 'insights', label: 'Insights', icon: Lightbulb },
              { value: 'social', label: 'Social', icon: Users },
              { value: 'planner', label: 'Planner', icon: Plane }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 rounded-xl"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Discover Tab - Enhanced with real functionality */}
          <TabsContent value="discover" className="space-y-8 mt-8">
            {/* Advanced Search */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 h-5 w-5" />
                    <Input
                      placeholder="Where do you dream of going? Try 'Tokyo', 'Aurora', or 'Beach paradise'..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                      className={viewMode === 'cards' ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'border-white/20 text-white hover:bg-white/10'}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'immersive' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('immersive')}
                      className={viewMode === 'immersive' ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'border-white/20 text-white hover:bg-white/10'}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stunning Destination Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dreamDestinations
                .filter(dest => searchQuery === '' || 
                  dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  dest.category.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((destination) => (
                <Card 
                  key={destination.id} 
                  className="group overflow-hidden bg-black/40 backdrop-blur-xl border-white/10 hover:border-cyan-400/50 transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleDestinationClick(destination)}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={destination.image} 
                      alt={destination.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {/* Overlays */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {destination.trending && (
                        <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {destination.urgent && (
                        <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse">
                          <Clock className="h-3 w-3 mr-1" />
                          Limited Time
                        </Badge>
                      )}
                    </div>
                    
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-lg font-bold">
                        {destination.aiScore}
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-bold text-white mb-1">{destination.name}</h3>
                      <p className="text-cyan-200 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {destination.country}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{destination.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(destination.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                          />
                        ))}
                        <span className="text-white ml-2">{destination.rating}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-400">${destination.price}</div>
                        <div className="text-xs text-gray-400">per day</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {destination.highlights.slice(0, 3).map((highlight, index) => (
                        <Badge key={index} variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
                          {highlight}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookNow(destination);
                        }}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                        size="sm"
                      >
                        <Plane className="h-4 w-4 mr-2" />
                        Book Now
                      </Button>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToWishlist(destination);
                        }}
                        variant="outline" 
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Travel DNA Tab - Functional Analysis */}
          <TabsContent value="ai-dna" className="space-y-8 mt-8">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-8">
                {!travelDNA && !isAnalyzing ? (
                  <div className="text-center py-16">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur-2xl opacity-30"></div>
                      <Brain className="relative h-24 w-24 mx-auto text-cyan-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Discover Your Travel DNA</h3>
                    <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                      Our advanced AI will analyze your preferences, behavior patterns, and dreams to create 
                      a personalized travel profile that evolves with you.
                    </p>
                    <Button 
                      onClick={analyzeTravelDNA}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-3 text-lg"
                    >
                      <Brain className="h-5 w-5 mr-2" />
                      Start AI Analysis
                    </Button>
                  </div>
                ) : isAnalyzing ? (
                  <div className="text-center py-16">
                    <div className="relative mb-8">
                      <Brain className="h-24 w-24 mx-auto text-cyan-400 animate-pulse" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Analyzing Your Travel DNA</h3>
                    <p className="text-gray-300 mb-8">
                      Our AI is processing your travel patterns, preferences, and behavioral data...
                    </p>
                    <div className="max-w-md mx-auto">
                      <Progress value={75} className="h-2" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🧬</div>
                      <h3 className="text-3xl font-bold text-white mb-2">{travelDNA.primaryType}</h3>
                      <p className="text-cyan-200">Confidence: {travelDNA.confidence}% match</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {travelDNA.traits.map((trait: any, index: number) => (
                        <div key={index} className="p-6 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-white">{trait.name}</h4>
                            <div className="flex items-center space-x-2">
                              <TrendingUp className={`h-4 w-4 ${trait.trend === 'increasing' ? 'text-green-400' : 'text-gray-400'}`} />
                              <span className="text-cyan-400 font-bold">{trait.score}%</span>
                            </div>
                          </div>
                          <Progress value={trait.score} className="h-2" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-6 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl border border-cyan-500/30">
                      <h4 className="text-xl font-semibold text-white mb-4">AI Recommendations</h4>
                      <ul className="space-y-2">
                        {travelDNA.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-300">
                            <Lightbulb className="h-4 w-4 text-yellow-400 mt-1 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Recommendations Tab */}
          <TabsContent value="ai-recs" className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {dreamDestinations.filter(d => d.aiScore >= 90).map((destination) => (
                  <Card key={destination.id} className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden">
                    <div className="flex">
                      <div className="w-48 h-32">
                        <img 
                          src={destination.image} 
                          alt={destination.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-white">{destination.name}</h3>
                          <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                            AI Score: {destination.aiScore}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">{destination.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-cyan-400 font-bold">${destination.price}/day</div>
                          <Button 
                            onClick={() => handleBookNow(destination)}
                            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                            size="sm"
                          >
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="space-y-6">
                <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiInsights.map((insight) => (
                      <div key={insight.id} className={`p-4 rounded-xl border ${getUrgencyColor(insight.urgency)}`}>
                        <div className="flex items-start space-x-3">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm">{insight.title}</h4>
                            <p className="text-gray-300 text-xs mt-1">{insight.description}</p>
                            <Button 
                              size="sm" 
                              className="mt-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                              onClick={() => alert(`Taking action: ${insight.actionText}`)}
                            >
                              {insight.actionText}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiInsights.map((insight) => (
                <Card key={insight.id} className={`bg-black/40 backdrop-blur-xl border-white/10 ${getUrgencyColor(insight.urgency)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      {getInsightIcon(insight.type)}
                      <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                        {insight.confidence}% confident
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{insight.title}</h3>
                    <p className="text-gray-300 mb-4">{insight.description}</p>
                    {insight.savings && (
                      <div className="text-green-400 font-bold mb-4">
                        Potential savings: ${insight.savings}
                      </div>
                    )}
                    <Button 
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                      onClick={() => alert(`Action: ${insight.actionText} for ${insight.destination}`)}
                    >
                      {insight.actionText}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-8 mt-8">
            <SocialGamificationHub />
          </TabsContent>

          {/* Planner Tab */}
          <TabsContent value="planner" className="space-y-8 mt-8">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-8 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur-2xl opacity-30"></div>
                  <Plane className="relative h-24 w-24 mx-auto text-cyan-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">AI Journey Optimizer</h3>
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                  Let our advanced AI create the perfect multi-destination itinerary optimized for your preferences, 
                  budget, and time constraints.
                </p>
                <Button 
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-3 text-lg"
                  onClick={() => alert('Opening Journey Optimizer - Feature coming soon!')}
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Start Planning
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};