import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Wallet, 
  Shield, 
  Sparkles, 
  MapPin, 
  Calendar,
  Users,
  Award,
  Zap,
  Globe,
  Gift,
  Camera,
  Heart,
  Coins,
  Crown
} from 'lucide-react';

interface TravelNFT {
  id: string;
  name: string;
  destination: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  metadata: {
    trip_date: string;
    provider: string;
    booking_value: number;
    experience_type: string;
  };
  rewards: {
    platform_credits: number;
    priority_access: boolean;
    exclusive_offers: boolean;
  };
}

interface AirdropProgress {
  total_points: number;
  current_tier: string;
  next_tier: string;
  completion_percentage: number;
  estimated_rewards: number;
}

const TravelNFTDashboard: React.FC = () => {
  const [userNFTs, setUserNFTs] = useState<TravelNFT[]>([]);
  const [airdropProgress, setAirdropProgress] = useState<AirdropProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('collection');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Simulate fetching user NFT collection and airdrop progress
      setTimeout(() => {
        setUserNFTs([
          {
            id: 'nft_001',
            name: 'Santorini Sunset Explorer',
            destination: 'Santorini, Greece',
            rarity: 'epic',
            image: '/api/placeholder/300/400',
            metadata: {
              trip_date: '2024-06-15',
              provider: 'expedia',
              booking_value: 1200,
              experience_type: 'luxury_stay'
            },
            rewards: {
              platform_credits: 150,
              priority_access: true,
              exclusive_offers: true
            }
          },
          {
            id: 'nft_002', 
            name: 'Tokyo Cultural Journey',
            destination: 'Tokyo, Japan',
            rarity: 'rare',
            image: '/api/placeholder/300/400',
            metadata: {
              trip_date: '2024-04-20',
              provider: 'amadeus',
              booking_value: 800,
              experience_type: 'cultural_experience'
            },
            rewards: {
              platform_credits: 100,
              priority_access: false,
              exclusive_offers: true
            }
          }
        ]);

        setAirdropProgress({
          total_points: 485,
          current_tier: 'Explorer',
          next_tier: 'Adventurer',
          completion_percentage: 73,
          estimated_rewards: 1200
        });

        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return Crown;
      case 'epic': return Trophy;
      case 'rare': return Star;
      default: return Award;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading your travel NFT collection...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Travel NFT & Rewards Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Collect unique travel experiences as NFTs, earn loyalty rewards, and unlock exclusive benefits
          </p>
        </div>

        {/* Airdrop Progress Card */}
        {airdropProgress && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-gray-900">Airdrop Progress</CardTitle>
                  <CardDescription>Current Tier: {airdropProgress.current_tier}</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <Coins className="w-4 h-4 mr-1" />
                  {airdropProgress.total_points} Points
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress to {airdropProgress.next_tier}</span>
                    <span>{airdropProgress.completion_percentage}%</span>
                  </div>
                  <Progress value={airdropProgress.completion_percentage} className="h-3" />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{airdropProgress.total_points}</div>
                    <div className="text-xs text-gray-600">Total Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{airdropProgress.estimated_rewards}</div>
                    <div className="text-xs text-gray-600">Est. Credits</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{airdropProgress.current_tier}</div>
                    <div className="text-xs text-gray-600">Current Tier</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="collection" className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>My Collection</span>
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Quest Hub</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Marketplace</span>
            </TabsTrigger>
          </TabsList>

          {/* NFT Collection Tab */}
          <TabsContent value="collection">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="w-5 h-5" />
                    <span>Travel Experience NFTs</span>
                  </CardTitle>
                  <CardDescription>
                    Your unique travel memories minted as NFTs with exclusive benefits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userNFTs.map((nft) => {
                      const RarityIcon = getRarityIcon(nft.rarity);
                      return (
                        <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                          <div className="relative">
                            <img 
                              src={nft.image} 
                              alt={nft.name}
                              className="w-full h-48 object-cover"
                            />
                            <div className={`absolute top-2 right-2 w-8 h-8 bg-gradient-to-br ${getRarityColor(nft.rarity)} rounded-full flex items-center justify-center`}>
                              <RarityIcon className="w-4 h-4 text-white" />
                            </div>
                            <Badge 
                              variant="secondary" 
                              className="absolute bottom-2 left-2 bg-black/70 text-white border-none"
                            >
                              {nft.rarity.toUpperCase()}
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">{nft.name}</h3>
                            <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                              <MapPin className="w-4 h-4" />
                              <span>{nft.destination}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Platform Credits</span>
                                <span className="font-medium text-green-600">+{nft.rewards.platform_credits}</span>
                              </div>
                              {nft.rewards.priority_access && (
                                <div className="flex items-center space-x-1 text-sm text-purple-600">
                                  <Zap className="w-3 h-3" />
                                  <span>Priority Access</span>
                                </div>
                              )}
                              {nft.rewards.exclusive_offers && (
                                <div className="flex items-center space-x-1 text-sm text-orange-600">
                                  <Star className="w-3 h-3" />
                                  <span>Exclusive Offers</span>
                                </div>
                              )}
                            </div>
                            <Button size="sm" variant="outline" className="w-full mt-4">
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {userNFTs.length === 0 && (
                    <div className="text-center py-12">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Travel NFTs Yet</h3>
                      <p className="text-gray-600 mb-4">Complete bookings and experiences to earn unique NFT memories</p>
                      <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Start Your First Journey
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quest Hub Tab */}
          <TabsContent value="quests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Active Quests</span>
                </CardTitle>
                <CardDescription>
                  Complete quests to earn airdrop points and exclusive rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      title: 'Book with Expedia Group',
                      description: 'Complete your first booking using our new Expedia integration',
                      points: 150,
                      progress: 0,
                      icon: Globe,
                      color: 'from-blue-500 to-purple-500',
                      provider: 'expedia'
                    },
                    {
                      title: 'Multi-Provider Explorer',
                      description: 'Compare prices across 3+ providers (Amadeus, Viator, Duffle)',
                      points: 100,
                      progress: 33,
                      icon: Star,
                      color: 'from-green-500 to-blue-500',
                      provider: 'multi'
                    },
                    {
                      title: 'Dream Collection Master',
                      description: 'Add 10 destinations to your Smart Dreams collection',
                      points: 75,
                      progress: 60,
                      icon: Heart,
                      color: 'from-pink-500 to-red-500',
                      provider: 'smart_dreams'
                    },
                    {
                      title: 'Social Travel Ambassador',
                      description: 'Share 5 travel experiences and earn social proof',
                      points: 200,
                      progress: 20,
                      icon: Users,
                      color: 'from-orange-500 to-yellow-500',
                      provider: 'social'
                    }
                  ].map((quest, index) => {
                    const IconComponent = quest.icon;
                    return (
                      <Card key={index} className="hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${quest.color} rounded-lg flex items-center justify-center`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                              +{quest.points} pts
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">{quest.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{quest.description}</p>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{quest.progress}%</span>
                              </div>
                              <Progress value={quest.progress} className="h-2" />
                            </div>
                            
                            <Button 
                              size="sm" 
                              className={`w-full bg-gradient-to-r ${quest.color} hover:opacity-90`}
                              disabled={quest.progress === 100}
                            >
                              {quest.progress === 100 ? 'Completed' : 'Continue Quest'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gift className="w-5 h-5" />
                    <span>Available Rewards</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        title: 'Platform Credits',
                        amount: 250,
                        description: 'Use for booking discounts',
                        icon: Coins,
                        action: 'Redeem'
                      },
                      {
                        title: 'Priority Support',
                        amount: 1,
                        description: '24/7 VIP customer service',
                        icon: Shield,
                        action: 'Activate'
                      },
                      {
                        title: 'Exclusive Experiences',
                        amount: 3,
                        description: 'Access to limited travel offerings',
                        icon: Sparkles,
                        action: 'Browse'
                      }
                    ].map((reward, index) => {
                      const IconComponent = reward.icon;
                      return (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-white">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{reward.title}</h4>
                              <p className="text-sm text-gray-600">{reward.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">{reward.amount}</div>
                            <Button size="sm" variant="outline">{reward.action}</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Upcoming Airdrops</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900">Seasonal Airdrop</h4>
                      <p className="text-sm text-gray-600">Summer 2024 Rewards</p>
                      <Badge variant="outline" className="mt-2">Estimated: July 2024</Badge>
                    </div>
                    
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900">Partnership Bonus</h4>
                      <p className="text-sm text-gray-600">Multi-provider completion rewards</p>
                      <Badge variant="outline" className="mt-2">Ongoing</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>NFT Travel Marketplace</span>
                </CardTitle>
                <CardDescription>
                  Discover and trade unique travel experience NFTs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Marketplace Coming Soon</h3>
                  <p className="text-gray-600 mb-6">
                    Trade rare travel NFTs, discover exclusive experiences, and connect with fellow travelers
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <h4 className="font-medium">Rare Experiences</h4>
                      <p className="text-sm text-gray-600">Trade limited edition travel NFTs</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <h4 className="font-medium">Community</h4>
                      <p className="text-sm text-gray-600">Connect with collectors worldwide</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <h4 className="font-medium">Verified</h4>
                      <p className="text-sm text-gray-600">All NFTs verified and authentic</p>
                    </div>
                  </div>
                  <Button className="mt-6" variant="outline">
                    Join Waitlist
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

export default TravelNFTDashboard;