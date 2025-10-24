import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { SmartDreamsFundIntegration } from '@/components/travel-fund/SmartDreamsFundIntegration';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Heart,
  Users,
  User,
  Baby,
  Map,
  Calendar,
  Star,
  Trophy,
  MapPin,
  Share2,
  Play,
  Crown,
  Medal,
  Brain,
  Target,
  Sparkles,
  TrendingUp,
  Zap,
  Coins,
  PlusCircle,
  Loader2
} from 'lucide-react';

import { SocialGamificationHub } from '../gamification/SocialGamificationHub';
import { TravelDNACard } from '../ai-intelligence/TravelDNACard';
import { IntelligentRecommendationsGrid } from '../ai-intelligence/IntelligentRecommendationsGrid'; 
import { PredictiveInsightsPanel } from '../ai-intelligence/PredictiveInsightsPanel';
import { JourneyOptimizerCard } from '../ai-intelligence/JourneyOptimizerCard';
import { useEnhancedDreams } from '@/hooks/useEnhancedDreams';
import { useAIIntelligence } from '@/hooks/useAIIntelligence';
import { useSmartDreamProviders } from '@/hooks/useSmartDreamProviders';
import { searchProvidersV2 } from '@/services/smart-dreams-v2-orchestrator';

interface TravelCompanion {
  type: 'solo' | 'partner' | 'friends' | 'family';
  name: string;
  description: string;
  icon: React.ReactNode;
  perks: string[];
  journeyType: string;
}

interface PersonalJourney {
  id: string;
  title: string;
  companion: TravelCompanion;
  destinations: any[];
  totalDays: number;
  totalBudget: number;
  progress: number;
  excitement: number;
  achievements: string[];
}

export const SmartDreamDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('my-journey');
  const [selectedCompanion, setSelectedCompanion] = useState<TravelCompanion | null>(null);
  const [currentJourney, setCurrentJourney] = useState<PersonalJourney | null>(null);
  const [excitementLevel, setExcitementLevel] = useState(85);
  const [journeyName, setJourneyName] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showFundCreation, setShowFundCreation] = useState(false);
  
  // Smart Dreams V2 Integration States
  const [v2Loading, setV2Loading] = useState(false);
  const [v2Results, setV2Results] = useState<any>(null);
  const [v2Error, setV2Error] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    destinations,
    userProfile,
    userInsights,
    loading,
    error,
  } = useEnhancedDreams({
    includeAIContext: true
  });

  const {
    travelDNA,
    intelligentRecommendations,
    predictiveInsights,
    loading: aiLoading,
    error: aiError,
    analyzeTravelDNA: refreshTravelDNA,
    getIntelligentRecommendations: refreshRecommendations,
    getPredictiveInsights: refreshPredictiveInsights
  } = useAIIntelligence();

  // Smart Dreams Enhanced Provider Integration
  const {
    results: providerResults,
    loading: providerLoading,
    error: providerError,
    searchProviders,
    getTopRecommendations,
    hasResults: hasProviderResults,
    totalResults: totalProviderResults
  } = useSmartDreamProviders();

  const companions: TravelCompanion[] = [
    {
      type: 'solo',
      name: 'Solo Adventure',
      description: 'Just me, my dreams, and endless possibilities',
      icon: <User className="h-8 w-8 text-purple-500" />,
      perks: ['Complete freedom', 'Self-discovery'],
      journeyType: 'Soul Quest'
    },
    {
      type: 'partner',
      name: 'Romantic Journey',
      description: 'Creating magical memories with my special someone',
      icon: <Heart className="h-8 w-8 text-pink-500" />,
      perks: ['Romantic moments', 'Shared experiences'],
      journeyType: 'Love Story'
    },
    {
      type: 'friends',
      name: 'Squad Adventure',
      description: 'Epic adventures with my favorite people',
      icon: <Users className="h-8 w-8 text-blue-500" />,
      perks: ['Shared costs', 'Group activities'],
      journeyType: 'Friendship Quest'
    },
    {
      type: 'family',
      name: 'Family Bonding',
      description: 'Building precious family moments together',
      icon: <Baby className="h-8 w-8 text-green-500" />,
      perks: ['Family bonding', 'Kid-friendly fun'],
      journeyType: 'Family Saga'
    }
  ];

  const dreamDestinations = [
    {
      id: 'bali-indonesia',
      name: 'Bali',
      country: 'Indonesia',
      image: 'https://images.pexels.com/photos/261204/pexels-photo-261204.jpeg',
      price: 95,
      days: 7,
      excitement: 92,
      perfectFor: ['Solo soul searching', 'Romantic getaways'],
    },
    {
      id: 'tokyo-japan',
      name: 'Tokyo',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1698923824953-a0bf7462e79d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjB0cmF2ZWwlMjBkZXN0aW5hdGlvbnN8ZW58MHx8fHwxNzU4MzAxMjQ2fDA&ixlib=rb-4.1.0&q=85',
      price: 180,
      days: 5,
      excitement: 95,
      perfectFor: ['Cultural exploration', 'Food adventures'],
    },
    {
      id: 'santorini-greece',
      name: 'Santorini',
      country: 'Greece',
      image: 'https://images.unsplash.com/photo-1552873547-b88e7b2760e2?crop=entropy&cs=srgb&fm=jpg',
      price: 220,
      days: 6,
      excitement: 98,
      perfectFor: ['Romantic escapes', 'Photography lovers'],
    }
  ];

  const initializeJourney = async (companion: TravelCompanion) => {
    const newJourney: PersonalJourney = {
      id: `journey_${Date.now()}`,
      title: journeyName || `My ${companion.journeyType}`,
      companion,
      destinations: [],
      totalDays: 0,
      totalBudget: 0,
      progress: 10,
      excitement: excitementLevel,
      achievements: ['Journey Starter']
    };

    setCurrentJourney(newJourney);
    setSelectedCompanion(companion);
    
    // Trigger Smart Dreams V2 Provider Search with Real AI Scoring
    if (aiEnabled) {
      try {
        setV2Loading(true);
        setV2Error(null);
        
        const result = await searchProvidersV2({
          companionType: companion.type === 'partner' ? 'romantic' : companion.type,
          travelDNA: travelDNA,
          preferences: companion.perks,
          destination: journeyName || "Singapore"  // Use journey name as destination hint
        });
        
        setV2Results(result);
        
        // Also trigger legacy hook for compatibility
        await searchProviders({
          companionType: companion.type === 'partner' ? 'romantic' : companion.type,
          travelDNA: travelDNA,
          preferences: companion.perks
        });
      } catch (error: any) {
        console.error('Smart Dreams V2 search failed:', error);
        setV2Error(error?.message || "Search failed");
        
        // Show correlation ID in error
        if (error?.response?.data?.correlation_id) {
          console.log(`Correlation ID: ${error.response.data.correlation_id}`);
        }
      } finally {
        setV2Loading(false);
      }
    }
    
    setActiveTab('dream-destinations');
  };

  const addDestinationToJourney = (destination: any) => {
    if (!currentJourney) return;

    const updatedJourney = {
      ...currentJourney,
      destinations: [...currentJourney.destinations, destination],
      totalDays: currentJourney.totalDays + destination.days,
      totalBudget: currentJourney.totalBudget + (destination.price * destination.days),
      progress: Math.min(currentJourney.progress + 25, 100),
      achievements: [...currentJourney.achievements, 'Dream Collector']
    };

    setCurrentJourney(updatedJourney);
    setExcitementLevel(Math.min(excitementLevel + 5, 100));
    
    alert(`🎉 ${destination.name} added to your journey! Excitement level: ${excitementLevel + 5}%`);
  };

  const shareJourney = () => {
    if (!currentJourney) return;
    
    const shareText = `🌟 I'm planning my ${currentJourney.title}! ${currentJourney.destinations.length} amazing destinations, ${currentJourney.totalDays} days of adventure. Join me! 🗺️✈️`;
    
    if (navigator.share) {
      navigator.share({
        title: currentJourney.title,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Journey details copied to clipboard! 📋');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Maku.Travel Brand Header */}
      <div className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Maku Brand Integration */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-green-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Maku</span>
            </div>
            
            {/* AI Status with Maku Branding */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-orange-50 px-4 py-2 rounded-full border border-orange-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-sm"></div>
                  <span className="text-sm font-medium text-orange-700">AI Match: {travelDNA ? Math.round(travelDNA.confidence_score * 100) : 0}%</span>
                </div>
                <div className="w-px h-4 bg-orange-200"></div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Excitement: {excitementLevel}%</span>
                </div>
                <div className="w-px h-4 bg-orange-200"></div>
                <button
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    aiEnabled 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-label={`AI is currently ${aiEnabled ? 'enabled' : 'disabled'}`}
                >
                  <Sparkles className={`h-3 w-3 ${aiEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>AI {aiEnabled ? 'On' : 'Off'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Maku Branding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm border border-orange-100 rounded-xl p-1">
            <TabsTrigger 
              value="my-journey" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-600 hover:text-orange-500 transition-all duration-200 rounded-lg py-3"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Journey</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dream-destinations" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-600 hover:text-orange-500 transition-all duration-200 rounded-lg py-3"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Dreams</span>
              {providerResults && (
                <div className="ml-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {providerResults.hotels.length + providerResults.flights.length + providerResults.activities.length}
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="ai-intelligence" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-600 hover:text-orange-500 transition-all duration-200 rounded-lg py-3"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">AI DNA</span>
              {travelDNA && (
                <div className="ml-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {Math.round(travelDNA.confidence_score * 100)}%
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-600 hover:text-orange-500 transition-all duration-200 rounded-lg py-3"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Achievements</span>
            </TabsTrigger>
            <TabsTrigger 
              value="social-hub" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-600 hover:text-orange-500 transition-all duration-200 rounded-lg py-3"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Social</span>
            </TabsTrigger>
            <TabsTrigger 
              value="planner" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-600 hover:text-orange-500 transition-all duration-200 rounded-lg py-3"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Plan</span>
            </TabsTrigger>
          </TabsList>

          {/* Journey Tab - Maku Branded */}
          <TabsContent value="my-journey" className="space-y-8 mt-8">
            {!currentJourney ? (
              <div className="space-y-8">
                {/* Journey Naming Card */}
                <Card className="bg-white shadow-lg border border-orange-100 rounded-2xl">
                  <CardContent className="p-8 text-center">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-green-500 rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">M</span>
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">What's your dream journey called?</h2>
                    <p className="text-gray-600 mb-6">Give your adventure a memorable name</p>
                    <Input
                      placeholder="My Epic Adventure, Honeymoon Bliss, Squad Goals Trip..."
                      value={journeyName}
                      onChange={(e) => setJourneyName(e.target.value)}
                      className="text-center text-xl bg-orange-50 border-orange-200 text-gray-800 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-400 rounded-full py-4 px-6"
                    />
                  </CardContent>
                </Card>

                {/* Companion Selection Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Who's joining your adventure?</h2>
                  <p className="text-gray-600 mb-8">Choose your travel style and unlock personalized AI recommendations</p>
                </div>

                {/* Companion Cards - Maku Branded */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {companions.map((companion) => (
                    <Card 
                      key={companion.type}
                      className="group cursor-pointer bg-white shadow-lg border border-orange-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-2xl overflow-hidden"
                      onClick={() => initializeJourney(companion)}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                          {companion.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{companion.journeyType}</h3>
                        <p className="text-gray-600 text-sm mb-6">{companion.description}</p>
                        
                        <div className="space-y-2 mb-6">
                          {companion.perks.map((perk, index) => (
                            <Badge 
                              key={index} 
                              className="bg-orange-100 text-orange-700 border-orange-200 text-xs px-3 py-1 rounded-full font-medium"
                            >
                              {perk}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-orange-500 via-green-500 to-orange-500 hover:from-orange-600 hover:via-green-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={() => initializeJourney(companion)}
                        >
                          <span className="flex items-center justify-center space-x-2">
                            <span>Start Journey</span>
                            <MapPin className="h-4 w-4" />
                          </span>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Journey Progress Card - Maku Branded */}
                <Card className="bg-white shadow-lg border border-green-200 rounded-2xl overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-green-500 rounded-lg flex items-center justify-center shadow-md">
                          <span className="text-white font-bold">M</span>
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-gray-800">{currentJourney.title}</h2>
                          <p className="text-gray-600">{selectedCompanion?.description}</p>
                        </div>
                      </div>
                      <Button 
                        className="bg-gradient-to-r from-orange-500 via-green-500 to-orange-500 hover:from-orange-600 hover:via-green-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        onClick={shareJourney}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Journey
                      </Button>
                    </div>

                    {/* Progress Section */}
                    <div className="mb-6 bg-orange-50 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-800 font-semibold">Journey Progress</span>
                        <span className="text-orange-600 font-medium">{currentJourney.progress}% Complete</span>
                      </div>
                      <Progress value={currentJourney.progress} className="h-3 bg-orange-100" />
                    </div>

                    {/* Journey Stats - Maku Branded */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="text-2xl font-bold text-orange-600">{currentJourney.destinations.length}</div>
                        <div className="text-sm text-orange-700 font-medium">Dreams Added</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="text-2xl font-bold text-green-600">{currentJourney.totalDays}</div>
                        <div className="text-sm text-green-700 font-medium">Total Days</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                        <div className="text-2xl font-bold text-yellow-600">${currentJourney.totalBudget}</div>
                        <div className="text-sm text-yellow-700 font-medium">Estimated Cost</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="text-2xl font-bold text-green-600">{excitementLevel}%</div>
                        <div className="text-sm text-green-700 font-medium">Excitement Level</div>
                      </div>
                    </div>

                    {/* Travel Fund Creation Integration */}
                    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 mt-6">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Coins className="h-5 w-5 text-purple-600" />
                              Turn Your Dream Into Savings Goal
                            </h4>
                            <p className="text-sm text-gray-600">
                              Create a travel fund to make this ${currentJourney.totalBudget} journey a reality
                            </p>
                          </div>
                          <Button
                            onClick={() => setShowFundCreation(true)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create Fund
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm text-gray-600">Monthly Goal</p>
                            <p className="text-lg font-bold text-purple-600">
                              ${Math.round(currentJourney.totalBudget / 12)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Est. Timeline</p>
                            <p className="text-lg font-bold text-green-600">12 months</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">NFT Rewards</p>
                            <p className="text-lg font-bold text-yellow-600">4+ NFTs</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                {/* Smart Dreams Fund Integration Dialog */}
                <SmartDreamsFundIntegration
                  dreamData={{
                    destination: currentJourney.destinations[0]?.name || 'Dream Destination',
                    travelStyle: selectedCompanion?.type || 'adventure',
                    duration: currentJourney.totalDays,
                    companions: selectedCompanion?.type === 'solo' ? 0 : 1,
                    budget: currentJourney.totalBudget,
                    dreamName: journeyName || currentJourney.title,
                    travelDates: {
                      start: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                      end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 + currentJourney.totalDays * 24 * 60 * 60 * 1000)
                    }
                  }}
                  open={showFundCreation}
                  onOpenChange={setShowFundCreation}
                  onFundCreated={(fundId) => {
                    toast({
                      title: "Dream fund created!",
                      description: "Your savings journey begins now. Start contributing today!",
                    });
                    // Navigate to the fund or close dialog
                    navigate(`/travel-fund`);
                  }}
                />

                {currentJourney.destinations.length > 0 && (
                  <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-purple-400" />
                        <span>My Dream Destinations</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentJourney.destinations.map((destination, index) => (
                          <Card key={index} className="bg-white/5 border-white/10 overflow-hidden">
                            <div className="h-32">
                              <img 
                                src={destination.image} 
                                alt={destination.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <CardContent className="p-4">
                              <h3 className="text-lg font-bold text-white mb-2">{destination.name}</h3>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-purple-300">{destination.days} days</span>
                                <span className="text-blue-300">${destination.price}/day</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Dream Destinations Tab */}
          <TabsContent value="dream-destinations" className="space-y-8 mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Build Your Dream Collection</h2>
              <p className="text-purple-200">Add destinations that spark joy and excitement in your journey</p>
              {aiEnabled && intelligentRecommendations.length > 0 && (
                <div className="mt-4">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {intelligentRecommendations.length} AI-Recommended Destinations Available
                  </Badge>
                </div>
              )}
            </div>

            {/* AI Recommendations Section */}
            {aiEnabled && intelligentRecommendations.length > 0 && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 border border-blue-500/30 backdrop-blur-xl rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    <span>AI-Powered Perfect Matches</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {intelligentRecommendations.slice(0, 3).map((rec, index) => (
                      <Card key={index} className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-blue-400/50 transition-all duration-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-white">{rec.destination_name}</h4>
                            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {rec.recommendation_score}% Match
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm mb-3">{rec.country}, {rec.continent}</p>
                          {rec.recommendation_reasons.slice(0, 1).map((reason, reasonIndex) => (
                            <p key={reasonIndex} className="text-blue-300 text-xs mb-3">{reason.reason_text}</p>
                          ))}
                          <Button 
                            onClick={() => {
                              const aiDestination = {
                                id: `ai-${rec.destination_name.toLowerCase().replace(' ', '-')}`,
                                name: rec.destination_name,
                                country: rec.country,
                                image: dreamDestinations[index % dreamDestinations.length].image,
                                price: Math.floor(Math.random() * 150) + 80,
                                days: Math.floor(Math.random() * 7) + 3,
                                excitement: rec.recommendation_score,
                                perfectFor: ['AI Recommended', 'Perfect Match']
                              };
                              addDestinationToJourney(aiDestination);
                            }}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm"
                            disabled={!currentJourney}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Add AI Match
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Provider Results Section */}
            {hasProviderResults && aiEnabled && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-indigo-900/50 via-purple-900/50 to-pink-900/50 border border-purple-500/30 backdrop-blur-xl rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        <span>Enhanced Provider Recommendations</span>
                      </h3>
                      <p className="text-purple-200 text-sm">
                        {totalProviderResults} personalized options from {providerResults?.searchMetadata.providersQueried.join(', ')} 
                        • {Math.round(providerResults?.aggregatedInsights.aiProcessingTime || 0)}ms AI processing
                      </p>
                    </div>
                    
                    {providerLoading && (
                      <div className="flex items-center space-x-2 text-yellow-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                        <span className="text-sm">Enhancing results...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Top Hotels from Enhanced Search */}
                  {getTopRecommendations('hotels', 3).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                        <Heart className="h-4 w-4 text-pink-400" />
                        <span>Smart Hotel Matches</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {getTopRecommendations('hotels', 3).map((hotel, index) => (
                          <Card key={hotel.id} className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-pink-400/50 transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-bold text-white text-sm">{hotel.name}</h5>
                                <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs">
                                  {hotel.aiConfidenceScore}% AI Match
                                </Badge>
                              </div>
                              <p className="text-gray-300 text-xs mb-2">{hotel.location}</p>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-pink-400 font-bold">${hotel.price}/night</span>
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-yellow-400 text-xs ml-1">{hotel.rating}</span>
                                </div>
                              </div>
                              <div className="mb-3">
                                <div className="text-xs text-gray-400 mb-1">Companion Match: {hotel.companionSuitability}%</div>
                                <div className="w-full bg-gray-700 rounded-full h-1">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full" 
                                    style={{ width: `${hotel.companionSuitability}%` }}
                                  />
                                </div>
                              </div>
                              <Button 
                                onClick={() => {
                                  const hotelDestination = {
                                    id: hotel.id,
                                    name: hotel.location,
                                    country: hotel.location,
                                    image: dreamDestinations[index % dreamDestinations.length].image,
                                    price: hotel.price,
                                    days: 3,
                                    excitement: hotel.aiConfidenceScore,
                                    perfectFor: hotel.recommendationReasons
                                  };
                                  addDestinationToJourney(hotelDestination);
                                }}
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-xs"
                                disabled={!currentJourney}
                              >
                                <Heart className="h-3 w-3 mr-1" />
                                Add to Journey
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Top Activities from Enhanced Search */}
                  {getTopRecommendations('activities', 2).length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span>Curated Experiences</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getTopRecommendations('activities', 2).map((activity) => (
                          <Card key={activity.id} className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-blue-400/50 transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-bold text-white text-sm">{activity.name}</h5>
                                <Badge className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-xs">
                                  Rank #{activity.aiRecommendationRank}
                                </Badge>
                              </div>
                              <p className="text-gray-300 text-xs mb-2">{activity.description}</p>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-blue-400 font-bold">${activity.price}</span>
                                <span className="text-gray-400 text-xs">{activity.duration}</span>
                              </div>
                              <div className="mb-3">
                                <div className="text-xs text-gray-400 mb-1">Experience Match: {activity.companionMatch}%</div>
                                <div className="w-full bg-gray-700 rounded-full h-1">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-1 rounded-full" 
                                    style={{ width: `${activity.companionMatch}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {activity.highlights.slice(0, 2).map((highlight, index) => (
                                  <Badge key={index} variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
                                    {highlight}
                                  </Badge>
                                ))}
                              </div>
                              <Button 
                                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white text-xs"
                                disabled={!currentJourney}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Add Experience
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dreamDestinations.map((destination) => (
                <Card 
                  key={destination.id}
                  className="group overflow-hidden bg-black/40 backdrop-blur-xl border-white/10 hover:border-purple-400/50 transition-all duration-500 hover:scale-[1.02]"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={destination.image} 
                      alt={destination.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-lg font-bold">
                        {destination.excitement}% ✨
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-bold text-white mb-1">{destination.name}</h3>
                      <p className="text-purple-200 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {destination.country}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-400">${destination.price}</div>
                        <div className="text-xs text-gray-400">per day • {destination.days} days</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-300 text-sm mb-3">Perfect for:</p>
                      <div className="flex flex-wrap gap-1">
                        {destination.perfectFor.map((perfect, index) => (
                          <Badge key={index} variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
                            {perfect}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={() => addDestinationToJourney(destination)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      disabled={!currentJourney}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      {currentJourney ? 'Add to My Journey' : 'Start Journey First'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI Intelligence Tab */}
          <TabsContent value="ai-intelligence" className="space-y-8 mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Your Travel DNA & AI Insights</h2>
              <p className="text-purple-200">Discover your unique travel personality and get personalized recommendations</p>
            </div>

            {aiEnabled ? (
              <div className="space-y-8">
                {/* Travel DNA Section */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <TravelDNACard 
                    travelDNA={travelDNA}
                    loading={aiLoading}
                    onRefresh={refreshTravelDNA}
                  />
                </div>

                {/* AI Recommendations */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <IntelligentRecommendationsGrid
                    recommendations={intelligentRecommendations}
                    loading={aiLoading}
                    onRefresh={refreshRecommendations}
                  />
                </div>

                {/* Predictive Insights */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <PredictiveInsightsPanel
                    insights={predictiveInsights}
                    loading={aiLoading}
                    onRefresh={refreshPredictiveInsights}
                  />
                </div>

                {/* Journey Optimizer */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <JourneyOptimizerCard />
                </div>
              </div>
            ) : (
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardContent className="p-12 text-center">
                  <Brain className="h-24 w-24 mx-auto mb-6 text-gray-400" />
                  <h3 className="text-2xl font-bold text-white mb-4">AI Intelligence Disabled</h3>
                  <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    Enable AI Intelligence to unlock personalized travel recommendations, DNA analysis, and predictive insights.
                  </p>
                  <Button 
                    onClick={() => setAiEnabled(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg"
                  >
                    <Brain className="h-5 w-5 mr-2" />
                    Enable AI Intelligence
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-8 mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Your Travel Achievements</h2>
              <p className="text-purple-200">Unlock badges, earn points, and level up your journey</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/30 backdrop-blur-xl text-center">
                <CardContent className="p-6">
                  <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                  <div className="text-3xl font-bold text-yellow-400">{currentJourney?.achievements.length || 0}</div>
                  <div className="text-yellow-200 text-sm">Badges Earned</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30 backdrop-blur-xl text-center">
                <CardContent className="p-6">
                  <Star className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                  <div className="text-3xl font-bold text-purple-400">{(currentJourney?.achievements.length || 0) * 250}</div>
                  <div className="text-purple-200 text-sm">Total Points</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-blue-500/30 backdrop-blur-xl text-center">
                <CardContent className="p-6">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                  <div className="text-3xl font-bold text-blue-400">Level {Math.floor((currentJourney?.achievements.length || 0) / 2) + 1}</div>
                  <div className="text-blue-200 text-sm">Dream Explorer</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-green-900/50 to-teal-900/50 border-green-500/30 backdrop-blur-xl text-center">
                <CardContent className="p-6">
                  <Medal className="h-12 w-12 mx-auto mb-4 text-green-400" />
                  <div className="text-3xl font-bold text-green-400">{excitementLevel}%</div>
                  <div className="text-green-200 text-sm">Excitement</div>
                </CardContent>
              </Card>
            </div>

            {currentJourney && currentJourney.achievements.length > 0 && (
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Your Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentJourney.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl">
                        <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{achievement}</h4>
                          <p className="text-gray-300 text-sm">Congratulations on this milestone!</p>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-400 font-bold">+250</div>
                          <div className="text-gray-400 text-xs">points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Social Hub Tab */}
          <TabsContent value="social-hub" className="space-y-8 mt-8">
            <SocialGamificationHub />
          </TabsContent>

          {/* Planner Tab */}
          <TabsContent value="planner" className="space-y-8 mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Plan Together</h2>
              <p className="text-purple-200">Collaborate with friends, family, or your travel companions</p>
            </div>

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-8 text-center">
                <Users className="h-24 w-24 mx-auto mb-6 text-purple-400" />
                <h3 className="text-2xl font-bold text-white mb-4">Collaborative Travel Planning</h3>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  Invite your travel companions to vote on destinations, pool budgets with Travel Fund, 
                  share Smart Dreams, and build your perfect journey together.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg"
                    onClick={() => navigate('/collaborative-planning')}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Start Planning Together
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg"
                    onClick={() => navigate('/travel-fund')}
                  >
                    <Coins className="h-5 w-5 mr-2" />
                    Pool Budgets in Travel Fund
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SmartDreamDashboard;