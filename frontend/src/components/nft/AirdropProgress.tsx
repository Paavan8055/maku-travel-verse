import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  Users, 
  Star,
  Trophy,
  Target,
  Zap,
  Gift,
  Award,
  Crown,
  Sparkles
} from 'lucide-react';

interface QuestItem {
  id: string;
  title: string;
  description: string;
  points: number;
  progress: number;
  completed: boolean;
  category: 'travel' | 'social' | 'provider' | 'milestone';
  provider?: string;
  deadline?: string;
}

interface TierInfo {
  name: string;
  min_points: number;
  max_points: number;
  benefits: string[];
  icon: any;
  color: string;
}

const AirdropProgress: React.FC = () => {
  const [userPoints, setUserPoints] = useState(485);
  const [currentTier, setCurrentTier] = useState('Explorer');
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const tiers: TierInfo[] = [
    {
      name: 'Wanderer',
      min_points: 0,
      max_points: 199,
      benefits: ['Basic airdrop eligibility', '5% platform credits'],
      icon: Target,
      color: 'from-gray-400 to-gray-500'
    },
    {
      name: 'Explorer',
      min_points: 200,
      max_points: 499,
      benefits: ['Enhanced airdrop weight', '10% platform credits', 'Priority support'],
      icon: Star,
      color: 'from-blue-400 to-cyan-500'
    },
    {
      name: 'Adventurer',
      min_points: 500,
      max_points: 999,
      benefits: ['High airdrop multiplier', '15% platform credits', 'Exclusive offers', 'Early access'],
      icon: Trophy,
      color: 'from-purple-400 to-pink-500'
    },
    {
      name: 'Legend',
      min_points: 1000,
      max_points: 9999,
      benefits: ['Maximum airdrop allocation', '25% platform credits', 'VIP treatment', 'NFT guarantees'],
      icon: Crown,
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  useEffect(() => {
    fetchAirdropData();
  }, []);

  const fetchAirdropData = async () => {
    try {
      // Simulate fetching user quest data
      setTimeout(() => {
        setQuests([
          {
            id: 'expedia_booking',
            title: 'Complete Expedia Group Booking',
            description: 'Use our new Expedia integration to book hotels, flights, or activities',
            points: 150,
            progress: 0,
            completed: false,
            category: 'provider',
            provider: 'expedia',
            deadline: '2024-12-31'
          },
          {
            id: 'smart_dreams_collector',
            title: 'Smart Dreams Collection Master',
            description: 'Add 15 destinations to your Smart Dreams wishlist',
            points: 100,
            progress: 73,
            completed: false,
            category: 'travel'
          },
          {
            id: 'multi_provider_user',
            title: 'Multi-Provider Power User',
            description: 'Complete bookings with 3 different providers (Amadeus, Viator, Duffle)',
            points: 200,
            progress: 66,
            completed: false,
            category: 'provider'
          },
          {
            id: 'social_ambassador',
            title: 'Travel Social Ambassador',
            description: 'Share 10 travel experiences and earn 50 social interactions',
            points: 120,
            progress: 40,
            completed: false,
            category: 'social'
          },
          {
            id: 'ai_intelligence_master',
            title: 'AI Intelligence Master',
            description: 'Use all AI features: Travel DNA, Recommendations, Journey Optimizer',
            points: 80,
            progress: 90,
            completed: false,
            category: 'milestone'
          },
          {
            id: 'streak_master',
            title: '30-Day Activity Streak',
            description: 'Maintain 30 consecutive days of platform activity',
            points: 300,
            progress: 23,
            completed: false,
            category: 'milestone'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching airdrop data:', error);
      setLoading(false);
    }
  };

  const getCurrentTierInfo = () => {
    return tiers.find(tier => 
      userPoints >= tier.min_points && userPoints <= tier.max_points
    ) || tiers[0];
  };

  const getNextTierInfo = () => {
    const currentIndex = tiers.findIndex(tier => 
      userPoints >= tier.min_points && userPoints <= tier.max_points
    );
    return tiers[currentIndex + 1] || null;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'travel': return Calendar;
      case 'social': return Users;
      case 'provider': return Zap;
      case 'milestone': return Trophy;
      default: return Gift;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'travel': return 'from-green-500 to-emerald-600';
      case 'social': return 'from-pink-500 to-rose-600';
      case 'provider': return 'from-blue-500 to-cyan-600';
      case 'milestone': return 'from-purple-500 to-violet-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const currentTierInfo = getCurrentTierInfo();
  const nextTierInfo = getNextTierInfo();
  const CurrentTierIcon = currentTierInfo.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading airdrop progress...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier Progress Card */}
      <Card className={`bg-gradient-to-br ${currentTierInfo.color}/10 border-2`} style={{ borderColor: currentTierInfo.color.split(' ')[1] }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${currentTierInfo.color} rounded-lg flex items-center justify-center shadow-lg`}>
                <CurrentTierIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">{currentTierInfo.name} Tier</CardTitle>
                <CardDescription>{userPoints} Total Points</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <TrendingUp className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {nextTierInfo && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress to {nextTierInfo.name}</span>
                <span>{Math.round(((userPoints - currentTierInfo.min_points) / (nextTierInfo.min_points - currentTierInfo.min_points)) * 100)}%</span>
              </div>
              <Progress 
                value={((userPoints - currentTierInfo.min_points) / (nextTierInfo.min_points - currentTierInfo.min_points)) * 100} 
                className="h-3"
              />
              <p className="text-xs text-gray-600 mt-1">
                {nextTierInfo.min_points - userPoints} points to reach {nextTierInfo.name}
              </p>
            </div>
          )}
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Current Tier Benefits:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentTierInfo.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Quests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Active Quests</span>
          </CardTitle>
          <CardDescription>Complete quests to earn points and climb the airdrop tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quests.filter(q => !q.completed).map((quest) => {
              const CategoryIcon = getCategoryIcon(quest.category);
              const categoryColor = getCategoryColor(quest.category);
              
              return (
                <div key={quest.id} className="border border-gray-200 rounded-lg p-4 hover:bg-white transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${categoryColor} rounded-lg flex items-center justify-center`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{quest.title}</h4>
                        <p className="text-sm text-gray-600">{quest.description}</p>
                        {quest.provider && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {quest.provider.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        +{quest.points} pts
                      </Badge>
                      {quest.deadline && (
                        <p className="text-xs text-gray-500 mt-1">Due: {quest.deadline}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{quest.progress}%</span>
                    </div>
                    <Progress value={quest.progress} className="h-2" />
                  </div>
                  
                  <Button 
                    size="sm" 
                    className={`bg-gradient-to-r ${categoryColor} hover:opacity-90`}
                    disabled={quest.progress === 100}
                  >
                    {quest.progress === 100 ? 'Ready to Claim' : 'Continue Quest'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tier Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5" />
            <span>Airdrop Tiers</span>
          </CardTitle>
          <CardDescription>Advance through tiers to increase your airdrop allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier, index) => {
              const TierIcon = tier.icon;
              const isCurrentTier = tier.name === currentTierInfo.name;
              const isCompleted = userPoints > tier.max_points;
              
              return (
                <div 
                  key={tier.name}
                  className={`relative p-4 border-2 rounded-lg transition-all duration-300 ${
                    isCurrentTier 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : isCompleted 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 bg-white hover:bg-white'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-full flex items-center justify-center mx-auto mb-3 ${isCurrentTier ? 'ring-4 ring-blue-200' : ''}`}>
                      <TierIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{tier.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {tier.min_points} - {tier.max_points === 9999 ? '∞' : tier.max_points} pts
                    </p>
                    
                    {isCurrentTier && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 mb-3">
                        Current Tier
                      </Badge>
                    )}
                    
                    {isCompleted && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 mb-3">
                        Completed
                      </Badge>
                    )}

                    <div className="space-y-1">
                      {tier.benefits.map((benefit, i) => (
                        <p key={i} className="text-xs text-gray-600">{benefit}</p>
                      ))}
                    </div>
                  </div>
                  
                  {isCurrentTier && nextTierInfo && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {nextTierInfo.min_points - userPoints} pts to next
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Airdrops */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Upcoming Airdrops</span>
          </CardTitle>
          <CardDescription>Scheduled token distributions based on your tier and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border border-dashed border-green-300 rounded-lg p-4 text-center">
                <Sparkles className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Summer 2024 Airdrop</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Main airdrop event for active users and NFT holders
                </p>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  July 2024
                </Badge>
                <div className="mt-3 text-xs text-gray-600">
                  Estimated allocation: {Math.round(userPoints * 2.5)} tokens
                </div>
              </div>
              
              <div className="border border-dashed border-blue-300 rounded-lg p-4 text-center">
                <Gift className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Provider Partnership Bonus</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Special rewards for using multiple travel providers
                </p>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  Ongoing
                </Badge>
                <div className="mt-3 text-xs text-gray-600">
                  Current multiplier: {Math.max(1.0, quests.filter(q => q.category === 'provider' && q.progress > 50).length * 0.2 + 1.0).toFixed(1)}x
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Boost Your Allocation</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-700">Complete high-value quests</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">+50% allocation</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700">Maintain activity streaks</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">+25% allocation</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-700">Refer active users</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">+100 pts per referral</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AirdropProgress;