import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  TrendingUp
} from 'lucide-react';

import { SocialGamificationHub } from '../gamification/SocialGamificationHub';
import { TravelDNACard } from '../ai-intelligence/TravelDNACard';
import { IntelligentRecommendationsGrid } from '../ai-intelligence/IntelligentRecommendationsGrid'; 
import { PredictiveInsightsPanel } from '../ai-intelligence/PredictiveInsightsPanel';
import { JourneyOptimizerCard } from '../ai-intelligence/JourneyOptimizerCard';
import { useEnhancedDreams } from '@/hooks/useEnhancedDreams';
import { useAIIntelligence } from '@/hooks/useAIIntelligence';
import { useSmartDreamProviders } from '@/hooks/useSmartDreamProviders';

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
    
    // Trigger Smart Dreams Enhanced Provider Search
    if (aiEnabled) {
      try {
        await searchProviders({
          companionType: companion.type === 'partner' ? 'romantic' : companion.type,
          travelDNA: travelDNA,
          preferences: companion.perks
        });
      } catch (error) {
        console.error('Enhanced provider search failed:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="relative border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  My Dream Journey
                </h1>
                <p className="text-purple-200/80 text-sm">
                  Build your perfect adventure, step by step
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {aiEnabled && (
                <div className="flex items-center space-x-2 text-white">
                  <Brain className="h-5 w-5 text-blue-400" />
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-300">{travelDNA ? Math.round(travelDNA.confidence_score * 100) : 0}%</div>
                    <div className="text-xs">AI Match</div>
                  </div>
                </div>
              )}
              
              {currentJourney && (
                <div className="flex items-center space-x-4 text-white">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-300">{currentJourney.destinations.length}</div>
                    <div className="text-xs">Destinations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-300">{currentJourney.totalDays}</div>
                    <div className="text-xs">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-300">${currentJourney.totalBudget}</div>
                    <div className="text-xs">Budget</div>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{excitementLevel}%</div>
                <div className="text-xs text-yellow-200">Excitement</div>
              </div>
              
              <Button 
                onClick={() => setAiEnabled(!aiEnabled)}
                variant={aiEnabled ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">AI {aiEnabled ? 'On' : 'Off'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
            <TabsTrigger value="my-journey" className="flex items-center space-x-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Journey</span>
            </TabsTrigger>
            <TabsTrigger value="dream-destinations" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Dreams</span>
            </TabsTrigger>
            <TabsTrigger value="ai-intelligence" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI DNA</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="social-hub" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger value="planner" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Plan</span>
            </TabsTrigger>
          </TabsList>

          {/* Journey Tab */}
          <TabsContent value="my-journey" className="space-y-8 mt-8">
            {!currentJourney ? (
              <div className="space-y-8">
                <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">What's your dream journey called?</h2>
                    <Input
                      placeholder="My Epic Adventure, Honeymoon Bliss, Squad Goals Trip..."
                      value={journeyName}
                      onChange={(e) => setJourneyName(e.target.value)}
                      className="text-center text-xl bg-white/10 border-white/20 text-white placeholder:text-white/50 mb-6"
                    />
                  </CardContent>
                </Card>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">Who's joining your adventure?</h2>
                  <p className="text-purple-200 mb-8">Choose your travel style and unlock personalized recommendations</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {companions.map((companion) => (
                    <Card 
                      key={companion.type}
                      className="group cursor-pointer bg-black/40 backdrop-blur-xl border-white/10 hover:border-purple-400/50 transition-all duration-500 hover:scale-105"
                      onClick={() => initializeJourney(companion)}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="mb-6">
                          {companion.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{companion.journeyType}</h3>
                        <p className="text-gray-300 text-sm mb-6">{companion.description}</p>
                        
                        <div className="space-y-2 mb-6">
                          {companion.perks.map((perk, index) => (
                            <Badge key={index} variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
                              {perk}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                          <Play className="h-4 w-4 mr-2" />
                          Start Journey
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <Card className="bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-blue-900/50 border-purple-500/30 backdrop-blur-xl">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        {selectedCompanion?.icon}
                        <div>
                          <h2 className="text-3xl font-bold text-white">{currentJourney.title}</h2>
                          <p className="text-purple-200">{selectedCompanion?.description}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={shareJourney}
                        className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Journey
                      </Button>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">Journey Progress</span>
                        <span className="text-purple-300">{currentJourney.progress}% Complete</span>
                      </div>
                      <Progress value={currentJourney.progress} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-white/10 rounded-xl">
                        <div className="text-2xl font-bold text-purple-400">{currentJourney.destinations.length}</div>
                        <div className="text-xs text-white">Dreams Added</div>
                      </div>
                      <div className="text-center p-4 bg-white/10 rounded-xl">
                        <div className="text-2xl font-bold text-pink-400">{currentJourney.totalDays}</div>
                        <div className="text-xs text-white">Total Days</div>
                      </div>
                      <div className="text-center p-4 bg-white/10 rounded-xl">
                        <div className="text-2xl font-bold text-blue-400">${currentJourney.totalBudget}</div>
                        <div className="text-xs text-white">Estimated Cost</div>
                      </div>
                      <div className="text-center p-4 bg-white/10 rounded-xl">
                        <div className="text-2xl font-bold text-yellow-400">{excitementLevel}%</div>
                        <div className="text-xs text-white">Excitement Level</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
              <p className="text-purple-200">Collaborate with friends, family, or your partner</p>
            </div>

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-8 text-center">
                <Calendar className="h-24 w-24 mx-auto mb-6 text-purple-400" />
                <h3 className="text-2xl font-bold text-white mb-4">Collaborative Planning</h3>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  Invite your travel companions to vote on destinations, share ideas, and build your dream journey together.
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg"
                  onClick={() => alert('Collaborative planning feature coming soon! 🚀')}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Start Planning Together
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SmartDreamDashboard;