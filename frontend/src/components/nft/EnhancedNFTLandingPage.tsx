import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Star, 
  Crown,
  Sparkles,
  TrendingUp,
  Users,
  Globe,
  Gift,
  Zap,
  Heart,
  Camera,
  Award,
  Coins,
  Target,
  Calendar
} from 'lucide-react';

interface UserStats {
  total_bookings: number;
  total_value: number;
  nft_count: number;
  current_tier: string;
  tier_progress: number;
  next_tier: string;
  points_to_next: number;
}

interface RecentReward {
  user: string;
  nft_name: string;
  provider: string;
  reward_amount: number;
  time_ago: string;
}

const EnhancedNFTLandingPage: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentRewards, setRecentRewards] = useState<RecentReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate loading user stats and community data
      setTimeout(() => {
        setUserStats({
          total_bookings: 8,
          total_value: 4200,
          nft_count: 3,
          current_tier: 'Explorer',
          tier_progress: 73,
          next_tier: 'Adventurer',
          points_to_next: 127
        });

        setRecentRewards([
          {
            user: 'TravelLover92',
            nft_name: 'Santorini Sunset Master',
            provider: 'expedia',
            reward_amount: 200,
            time_ago: '2 hours ago'
          },
          {
            user: 'AdventureSeeker',
            nft_name: 'Tokyo Cultural Explorer',
            provider: 'amadeus',
            reward_amount: 150,
            time_ago: '5 hours ago'
          },
          {
            user: 'LuxuryTraveler',
            nft_name: 'Maldives Paradise Collection',
            provider: 'viator',
            reward_amount: 300,
            time_ago: '1 day ago'
          }
        ]);

        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'legend': return Crown;
      case 'adventurer': return Trophy;
      case 'explorer': return Star;
      default: return Target;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'legend': return 'from-yellow-400 to-orange-500';
      case 'adventurer': return 'from-purple-400 to-pink-500';
      case 'explorer': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading your travel rewards...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Hero Section - Inspired by Travala but enhanced */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-green-600 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              Rewards that take you
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                further
              </span>
            </h1>
            
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              The travel loyalty revolution for explorers who architect their own adventures.
              Earn up to <span className="font-bold text-yellow-300">25% in NFT rewards</span> across 6 global providers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg">
                <Gift className="w-5 h-5 mr-2" />
                Start Earning - FREE
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                <Trophy className="w-5 h-5 mr-2" />
                View My Collection
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">6</div>
                <div className="text-sm text-purple-100">Travel Providers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300">10,247</div>
                <div className="text-sm text-purple-100">Active Explorers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300">Up to 25%</div>
                <div className="text-sm text-purple-100">NFT Rewards</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-300">4</div>
                <div className="text-sm text-purple-100">Reward Tiers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Progress Section */}
      {userStats && (
        <section className="py-16">
          <div className="container mx-auto px-6">
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${getTierColor(userStats.current_tier)} rounded-xl flex items-center justify-center shadow-lg`}>
                      {React.createElement(getTierIcon(userStats.current_tier), { className: "w-8 h-8 text-white" })}
                    </div>
                    <div>
                      <CardTitle className="text-3xl text-gray-900">Welcome back, Explorer!</CardTitle>
                      <CardDescription className="text-lg">
                        {userStats.current_tier} Tier • {userStats.nft_count} NFTs Collected • ${userStats.total_value.toLocaleString()} Travel Value
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Active Member
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Progress to Next Tier */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Progress to {userStats.next_tier}</h3>
                    <Progress value={userStats.tier_progress} className="h-4" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{userStats.tier_progress}% Complete</span>
                      <span>{userStats.points_to_next} points needed</span>
                    </div>
                    <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                      <Target className="w-4 h-4 mr-2" />
                      View Next Goals
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Impact</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Bookings</span>
                        <span className="font-medium text-blue-600">{userStats.total_bookings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">NFTs Earned</span>
                        <span className="font-medium text-purple-600">{userStats.nft_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Travel Value</span>
                        <span className="font-medium text-green-600">${userStats.total_value.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Camera className="w-4 h-4 mr-2" />
                        View My Collection
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Zap className="w-4 h-4 mr-2" />
                        Active Quests
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Gift className="w-4 h-4 mr-2" />
                        Claim Rewards
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How Maku Travel Rewards Work</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, transparent, and rewarding. Start earning from your very first booking.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Book Your Journey</h3>
                <p className="text-gray-600">
                  Book with any of our 6 integrated providers: Expedia, Amadeus, Viator, Duffle, RateHawk, or Sabre
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Earn NFT Rewards</h3>
                <p className="text-gray-600">
                  Automatically receive unique travel NFTs based on your experiences, with rewards tailored to your journey
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Unlock Benefits</h3>
                <p className="text-gray-600">
                  Use platform credits, access exclusive deals, and advance through tiers for even greater rewards
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition - Inspired by Travala's savings calculator */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Save up to 25% with <span className="text-purple-600">Maku NFT Rewards</span>
              </h2>
              <p className="text-lg text-gray-600">
                Here's how you can maximize savings on a $1,000 Bali vacation
              </p>
            </div>

            <Card className="shadow-2xl">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Booking Breakdown */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Bali Adventure Package</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between text-lg">
                        <span>Base Package Price</span>
                        <span className="font-semibold">$1,000.00</span>
                      </div>
                      
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-2 text-blue-600" />
                            Explorer Tier Discount (5%)
                          </span>
                          <span className="text-green-600">-$50.00</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center">
                            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                            Provider Bonus (Expedia 15%)
                          </span>
                          <span className="text-green-600">-$75.00</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center">
                            <Trophy className="w-4 h-4 mr-2 text-orange-600" />
                            NFT Holder Bonus (5%)
                          </span>
                          <span className="text-green-600">-$50.00</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between text-xl font-bold">
                          <span>You Pay</span>
                          <span className="text-blue-600">$825.00</span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-green-600 mt-2">
                          <span>+ Platform Credits Earned</span>
                          <span>+$100.00</span>
                        </div>
                        
                        <div className="flex justify-between text-lg font-bold text-green-700 mt-2">
                          <span>Effective Cost</span>
                          <span>$725.00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Benefits Showcase */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Your Rewards Package</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Camera className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="font-medium text-gray-900">Bali Paradise NFT</p>
                          <p className="text-sm text-gray-600">Rare collection piece</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Coins className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">100 Platform Credits</p>
                          <p className="text-sm text-gray-600">Use for future bookings</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Star className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">Tier Progress</p>
                          <p className="text-sm text-gray-600">+200 points toward Adventurer</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Gift className="w-8 h-8 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900">Airdrop Eligibility</p>
                          <p className="text-sm text-gray-600">Qualified for next distribution</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Activity Feed */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Live Reward Activity</h2>
              <p className="text-lg text-gray-600">
                See what rewards other travelers are earning right now
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentRewards.map((reward, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            <span className="text-blue-600">{reward.user}</span> earned {reward.nft_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Booked via {reward.provider} • +{reward.reward_amount} credits
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          +{reward.reward_amount} credits
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{reward.time_ago}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-6">
                  <Button variant="outline">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Provider Showcase */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Earn Across 6 Global Providers</h2>
            <p className="text-lg text-gray-600">
              Unlike single-platform rewards, earn NFTs and credits from every booking, everywhere
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Expedia', bonus: '15%', color: 'from-blue-500 to-purple-500', icon: Globe },
              { name: 'Amadeus', bonus: '10%', color: 'from-green-500 to-blue-500', icon: Star },
              { name: 'Viator', bonus: '12%', color: 'from-purple-500 to-pink-500', icon: Camera },
              { name: 'Duffle', bonus: '10%', color: 'from-orange-500 to-red-500', icon: Zap },
              { name: 'RateHawk', bonus: '10%', color: 'from-teal-500 to-green-500', icon: Award },
              { name: 'Sabre', bonus: '10%', color: 'from-indigo-500 to-purple-500', icon: Target }
            ].map((provider) => {
              const IconComponent = provider.icon;
              return (
                <Card key={provider.name} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${provider.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{provider.name}</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      +{provider.bonus} bonus
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 via-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to start earning?</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who are earning crypto rewards with every adventure
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 px-12 py-4 text-lg">
              <Gift className="w-5 h-5 mr-2" />
              Start Your First Quest
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-12 py-4 text-lg">
              <Users className="w-5 h-5 mr-2" />
              Join the Community
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnhancedNFTLandingPage;