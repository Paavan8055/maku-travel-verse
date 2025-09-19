import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart,
  Users,
  User,
  UserHeart,
  Baby,
  Sparkles, 
  Map,
  Calendar,
  Camera,
  Compass,
  Star,
  Trophy,
  Target,
  Gift,
  Plane,
  MapPin,
  Clock,
  DollarSign,
  Share2,
  Play,
  BookOpen,
  Award,
  Zap,
  Crown,
  Medal
} from 'lucide-react';

import { SocialGamificationHub } from '../gamification/SocialGamificationHub';
import { useEnhancedDreams } from '@/hooks/useEnhancedDreams';
// import { useGamification } from '@/hooks/useGamification';

interface TravelCompanion {
  type: 'solo' | 'partner' | 'friends' | 'family';
  count?: number;
  description: string;
  icon: React.ReactNode;
  perks: string[];
  journeyType: string;
}

interface PersonalJourney {
  id: string;
  title: string;
  companion: TravelCompanion;
  destinations: DreamDestination[];
  totalDays: number;
  totalBudget: number;
  progress: number;
  excitement: number;
  achievements: string[];
  milestones: JourneyMilestone[];
  shareableStory: string;
}

interface JourneyMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  reward: string;
  points: number;
}

interface DreamDestination {
  id: string;
  name: string;
  country: string;
  image: string;
  price: number;
  days: number;
  excitement: number;
  activities: string[];
  perfectFor: string[];
  userNotes: string;
  added: Date;
}

export const PersonalJourneyDreamHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('my-journey');
  const [selectedCompanion, setSelectedCompanion] = useState<TravelCompanion | null>(null);
  const [currentJourney, setCurrentJourney] = useState<PersonalJourney | null>(null);
  const [excitementLevel, setExcitementLevel] = useState(85);
  const [journeyName, setJourneyName] = useState('');

  // Mock gamification data for now
  const achievements = [];
  const userStats = null;
  const leaderboard = [];
  const currentChallenges = [];
  const socialActivity = [];
  const gamificationLoading = false;

  const {
    destinations,
    userProfile,
    loading,
    error,
  } = useEnhancedDreams({
    includeAIContext: true
  });

  const companions: TravelCompanion[] = [
    {
      type: 'solo',
      description: 'Just me, my dreams, and endless possibilities',
      icon: <User className="h-8 w-8 text-purple-500" />,
      perks: ['Complete freedom', 'Self-discovery', 'Flexible schedule', 'Meet new people'],
      journeyType: 'Soul Adventure'
    },
    {
      type: 'partner',
      description: 'Creating magical memories with my special someone',
      icon: <UserHeart className="h-8 w-8 text-pink-500" />,
      perks: ['Romantic moments', 'Shared experiences', 'Deeper connection', 'Couple goals'],
      journeyType: 'Love Story'
    },
    {
      type: 'friends',
      count: 3,
      description: 'Epic adventures with my favorite people',
      icon: <Users className="h-8 w-8 text-blue-500" />,
      perks: ['Shared costs', 'Group activities', 'Lasting memories', 'Adventure squad'],
      journeyType: 'Friendship Quest'
    },
    {
      type: 'family',
      count: 4,
      description: 'Building precious family moments together',
      icon: <Baby className="h-8 w-8 text-green-500" />,
      perks: ['Family bonding', 'Kid-friendly fun', 'Multi-generation joy', 'Legacy memories'],
      journeyType: 'Family Saga'
    }
  ];

  const dreamDestinations: DreamDestination[] = [
    {
      id: 'bali-indonesia',
      name: 'Bali',
      country: 'Indonesia',
      image: 'https://images.pexels.com/photos/261204/pexels-photo-261204.jpeg',
      price: 95,
      days: 7,
      excitement: 92,
      activities: ['Temple hopping', 'Rice terrace walks', 'Yoga retreats', 'Beach sunsets'],
      perfectFor: ['Solo soul searching', 'Romantic getaways', 'Spiritual journeys'],
      userNotes: '',
      added: new Date()
    },
    {
      id: 'tokyo-japan',
      name: 'Tokyo',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1698923824953-a0bf7462e79d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjB0cmF2ZWwlMjBkZXN0aW5hdGlvbnN8ZW58MHx8fHwxNzU4MzAxMjQ2fDA&ixlib=rb-4.1.0&q=85',
      price: 180,
      days: 5,
      excitement: 95,
      activities: ['Sushi experiences', 'Temple visits', 'Robot cafes', 'Shibuya crossing'],
      perfectFor: ['Cultural exploration', 'Food adventures', 'Technology lovers'],
      userNotes: '',
      added: new Date()
    },
    {
      id: 'santorini-greece',
      name: 'Santorini',
      country: 'Greece',
      image: 'https://images.unsplash.com/photo-1552873547-b88e7b2760e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjB0cmF2ZWwlMjBkZXN0aW5hdGlvbnN8ZW58MHx8fHwxNzU4MzAxMjQ2fDA&ixlib=rb-4.1.0&q=85',
      price: 220,
      days: 6,
      excitement: 98,
      activities: ['Sunset watching', 'Wine tasting', 'Cliff walking', 'Blue dome photography'],
      perfectFor: ['Romantic escapes', 'Photography lovers', 'Sunset chasers'],
      userNotes: '',
      added: new Date()
    },
    {
      id: 'iceland-reykjavik',
      name: 'Iceland',
      country: 'Iceland',
      image: 'https://images.unsplash.com/photo-1694084086064-9cdd1ef07d71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxzdHVubmluZyUyMGxhbmRzY2FwZXN8ZW58MHx8fHwxNzU4MzAxMjUxfDA&ixlib=rb-4.1.0&q=85',
      price: 280,
      days: 8,
      excitement: 94,
      activities: ['Northern lights', 'Glacier hiking', 'Hot springs', 'Puffin watching'],
      perfectFor: ['Adventure seekers', 'Nature lovers', 'Photography enthusiasts'],
      userNotes: '',
      added: new Date()
    }
  ];

  const initializeJourney = (companion: TravelCompanion) => {
    const milestones: JourneyMilestone[] = [
      {
        id: '1',
        title: 'Dream Builder',
        description: 'Add your first destination to your journey',
        completed: false,
        reward: 'Explorer Badge',
        points: 100
      },
      {
        id: '2',
        title: 'Journey Planner',
        description: 'Create a complete 7-day itinerary',
        completed: false,
        reward: 'Planner Trophy',
        points: 250
      },
      {
        id: '3',
        title: 'Budget Master',
        description: 'Set and track your travel budget',
        completed: false,
        reward: 'Financial Wizard Badge',
        points: 150
      },
      {
        id: '4',
        title: 'Social Sharer',
        description: 'Share your journey with friends',
        completed: false,
        reward: 'Influencer Crown',
        points: 200
      }
    ];

    const newJourney: PersonalJourney = {
      id: `journey_${Date.now()}`,
      title: journeyName || `My ${companion.journeyType}`,
      companion,
      destinations: [],
      totalDays: 0,
      totalBudget: 0,
      progress: 0,
      excitement: excitementLevel,
      achievements: [],
      milestones,
      shareableStory: `Starting my ${companion.journeyType.toLowerCase()} - ${companion.description}`
    };

    setCurrentJourney(newJourney);
    setSelectedCompanion(companion);
  };

  const addDestinationToJourney = (destination: DreamDestination) => {
    if (!currentJourney) return;

    const updatedJourney = {
      ...currentJourney,
      destinations: [...currentJourney.destinations, { ...destination, userNotes: '' }],
      totalDays: currentJourney.totalDays + destination.days,
      totalBudget: currentJourney.totalBudget + (destination.price * destination.days),
      progress: Math.min(currentJourney.progress + 25, 100)
    };

    // Complete first milestone
    if (updatedJourney.destinations.length === 1) {
      updatedJourney.milestones[0].completed = true;
      updatedJourney.achievements.push('Dream Builder');
    }

    setCurrentJourney(updatedJourney);
    
    // Show excitement animation
    setExcitementLevel(Math.min(excitementLevel + 5, 100));
  };

  const shareJourney = () => {
    if (!currentJourney) return;
    
    const shareText = `🌟 I'm planning my ${currentJourney.title}! ${currentJourney.destinations.length} amazing destinations, ${currentJourney.totalDays} days of adventure. Join me on this journey! 🗺️✈️`;
    
    if (navigator.share) {
      navigator.share({
        title: currentJourney.title,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Journey details copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Personal Header */}
      <div className="relative border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                  <Heart className="h-8 w-8 text-white" />
                </div>
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
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
            {[
              { value: 'my-journey', label: 'My Journey', icon: Map },
              { value: 'dream-destinations', label: 'Dream Destinations', icon: Heart },
              { value: 'achievements', label: 'Achievements', icon: Trophy },
              { value: 'social-hub', label: 'Social Hub', icon: Users },
              { value: 'journey-planner', label: 'Plan Together', icon: Calendar }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-300 rounded-xl"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* My Journey Tab */}
          <TabsContent value="my-journey" className="space-y-8 mt-8">
            {!currentJourney ? (
              <div className="space-y-8">
                {/* Journey Name Input */}
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

                {/* Companion Selection */}
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
                        <p className="text-gray-300 text-sm mb-6 line-clamp-2">{companion.description}</p>
                        
                        <div className="space-y-2 mb-6">
                          {companion.perks.slice(0, 2).map((perk, index) => (
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
                {/* Journey Overview */}
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

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">Journey Progress</span>
                        <span className="text-purple-300">{currentJourney.progress}% Complete</span>
                      </div>
                      <Progress value={currentJourney.progress} className="h-3" />
                    </div>

                    {/* Journey Stats */}
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

                {/* Milestones */}
                <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Target className="h-5 w-5 text-yellow-400" />
                      <span>Journey Milestones</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentJourney.milestones.map((milestone) => (
                        <div 
                          key={milestone.id}
                          className={`p-4 rounded-xl border ${milestone.completed ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-900/20 border-gray-500/30'}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-white">{milestone.title}</h4>
                            {milestone.completed ? (
                              <Trophy className="h-5 w-5 text-yellow-400" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mb-3">{milestone.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {milestone.reward}
                            </Badge>
                            <span className="text-yellow-400 font-bold">{milestone.points} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Current Destinations */}
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
                              <div className="flex flex-wrap gap-1">
                                {destination.activities.slice(0, 2).map((activity, actIndex) => (
                                  <Badge key={actIndex} variant="outline" className="text-xs bg-white/5 border-white/20 text-white">
                                    {activity}
                                  </Badge>
                                ))}
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
            </div>

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
                        {destination.perfectFor.slice(0, 2).map((perfect, index) => (
                          <Badge key={index} variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
                            {perfect}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        onClick={() => addDestinationToJourney(destination)}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        disabled={!currentJourney}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Add to My Journey
                      </Button>
                      
                      {!currentJourney && (
                        <p className="text-center text-xs text-gray-400">Start a journey first!</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-8 mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Your Travel Achievements</h2>
              <p className="text-purple-200">Unlock badges, earn points, and level up your journey</p>
            </div>

            {/* Achievement Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/30 backdrop-blur-xl text-center">
                <CardContent className="p-6">
                  <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                  <div className="text-3xl font-bold text-yellow-400">7</div>
                  <div className="text-yellow-200 text-sm">Badges Earned</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30 backdrop-blur-xl text-center">
                <CardContent className="p-6">
                  <Star className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                  <div className="text-3xl font-bold text-purple-400">2,450</div>
                  <div className="text-purple-200 text-sm">Total Points</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-blue-500/30 backdrop-blur-xl text-center">
                <CardContent className="p-6">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                  <div className="text-3xl font-bold text-blue-400">Level 12</div>
                  <div className="text-blue-200 text-sm">Dream Explorer</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-green-900/50 to-teal-900/50 border-green-500/30 backdrop-blur-xl text-center">
                <CardContent className="p-6">
                  <Medal className="h-12 w-12 mx-auto mb-4 text-green-400" />
                  <div className="text-3xl font-bold text-green-400">#15</div>
                  <div className="text-green-200 text-sm">Global Rank</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Achievements */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <span>Recent Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'Dream Collector', description: 'Added 5 destinations to wishlist', points: 250, date: '2 days ago', icon: Heart },
                    { title: 'Social Butterfly', description: 'Shared journey with 10 friends', points: 300, date: '1 week ago', icon: Share2 },
                    { title: 'Budget Master', description: 'Created first travel budget', points: 150, date: '2 weeks ago', icon: DollarSign }
                  ].map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl">
                      <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                        <achievement.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{achievement.title}</h4>
                        <p className="text-gray-300 text-sm">{achievement.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-bold">+{achievement.points}</div>
                        <div className="text-gray-400 text-xs">{achievement.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Hub Tab */}
          <TabsContent value="social-hub" className="space-y-8 mt-8">
            <SocialGamificationHub />
          </TabsContent>

          {/* Journey Planner Tab */}
          <TabsContent value="journey-planner" className="space-y-8 mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Plan Together</h2>
              <p className="text-purple-200">Collaborate with friends, family, or your partner to create the perfect journey</p>
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
                  onClick={() => alert('Collaborative planning feature coming soon!')}
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