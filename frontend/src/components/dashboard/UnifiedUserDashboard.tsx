import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Star, 
  Globe,
  Brain,
  Coins,
  Calendar,
  Users,
  TrendingUp,
  Zap,
  Gift,
  Target,
  MapPin,
  Award,
  Crown,
  Heart,
  Sparkles
} from 'lucide-react';

interface UnifiedDashboardData {
  userStats: {
    totalBookings: number;
    totalValue: number;
    currentTier: string;
    tierProgress: number;
    nftCount: number;
    airdropPoints: number;
    smartDreamsDestinations: number;
    aiInteractions: number;
  };
  crossModuleInsights: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  activeOpportunities: Array<{
    module: string;
    opportunity: string;
    potential: string;
    action: string;
  }>;
}

const UnifiedUserDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<UnifiedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('overview');

  useEffect(() => {
    loadUnifiedDashboardData();
  }, []);

  const loadUnifiedDashboardData = async () => {
    try {
      // Simulate loading unified data from all modules
      setTimeout(() => {
        setDashboardData({
          userStats: {
            totalBookings: 12,
            totalValue: 8400,
            currentTier: 'Explorer',
            tierProgress: 73,
            nftCount: 5,
            airdropPoints: 485,
            smartDreamsDestinations: 8,
            aiInteractions: 47
          },
          crossModuleInsights: [
            {
              type: 'opportunity',
              title: 'Multi-Provider Bonus Available',
              description: 'Book with 2 more providers to unlock Adventurer tier and 100% reward bonus',
              action: 'View Provider Quests',
              priority: 'high'
            },
            {
              type: 'optimization',
              title: 'Smart Dreams AI Enhancement',
              description: 'Your recent bookings unlock 3 new AI-recommended destinations',
              action: 'Explore AI Recommendations',
              priority: 'medium'
            },
            {
              type: 'reward',
              title: 'NFT Collection Growth',
              description: 'Complete luxury booking to unlock rare NFT tier with 25% bonus rewards',
              action: 'Browse Luxury Options',
              priority: 'medium'
            }
          ],
          activeOpportunities: [
            {
              module: 'Smart Dreams',
              opportunity: 'Tokyo Cultural Journey Quest',
              potential: '+200 points + Rare NFT',
              action: 'Start Journey Planning'
            },
            {
              module: 'Expedia Integration',
              opportunity: 'First Expedia Booking Bonus',
              potential: '+150 points + Pioneer NFT',
              action: 'Search Expedia Deals'
            },
            {
              module: 'Airdrop Progress',
              opportunity: 'Adventurer Tier Advancement',
              potential: '2x airdrop multiplier',
              action: 'Complete Active Quests'
            }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const getModuleIcon = (module: string) => {
    const iconMap = {
      'Smart Dreams': Brain,
      'NFT Rewards': Trophy,
      'Airdrop Progress': Coins,
      'Travel Booking': Calendar,
      'AI Intelligence': Sparkles,
      'Expedia Integration': Globe
    };
    return iconMap[module] || Target;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-orange-500';
      case 'medium': return 'from-blue-500 to-purple-500';
      case 'low': return 'from-gray-500 to-slate-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your unified dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Unavailable</h3>
            <p className="text-gray-600 mb-4">Unable to load dashboard data</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, Explorer! 🌟
          </h1>
          <p className="text-lg text-gray-600">
            Your unified travel, rewards, and AI intelligence dashboard
          </p>
        </div>

        {/* Unified Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardData.userStats.totalBookings}</div>
              <div className="text-xs text-gray-600">Total Bookings</div>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardData.userStats.nftCount}</div>
              <div className="text-xs text-gray-600">NFTs Owned</div>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <Coins className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardData.userStats.airdropPoints}</div>
              <div className="text-xs text-gray-600">Airdrop Points</div>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <Star className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardData.userStats.currentTier}</div>
              <div className="text-xs text-gray-600">Current Tier</div>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <Brain className="w-6 h-6 text-pink-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardData.userStats.smartDreamsDestinations}</div>
              <div className="text-xs text-gray-600">Dream Places</div>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <Sparkles className="w-6 h-6 text-cyan-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardData.userStats.aiInteractions}</div>
              <div className="text-xs text-gray-600">AI Interactions</div>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">${(dashboardData.userStats.totalValue / 1000).toFixed(1)}K</div>
              <div className="text-xs text-gray-600">Travel Value</div>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <Target className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{dashboardData.userStats.tierProgress}%</div>
              <div className="text-xs text-gray-600">Next Tier</div>
            </CardContent>
          </Card>
        </div>

        {/* Cross-Module Insights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <span>Unified Platform Insights</span>
            </CardTitle>
            <CardDescription>
              AI-powered recommendations across all your travel activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.crossModuleInsights.map((insight, index) => {
                const priorityColor = getPriorityColor(insight.priority);
                return (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 bg-gradient-to-r ${priorityColor} rounded-full`}></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                      {insight.action}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Module Integration Tabs */}
        <Tabs value={activeModule} onValueChange={setActiveModule}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="travel">Travel & Booking</TabsTrigger>
            <TabsTrigger value="rewards">Rewards & NFTs</TabsTrigger>
            <TabsTrigger value="ai">AI Intelligence</TabsTrigger>
            <TabsTrigger value="social">Social & Quests</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Journey Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span>Your Travel Journey</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900">Travel Bookings</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {dashboardData.userStats.totalBookings} completed
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Smart Dreams</span>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {dashboardData.userStats.smartDreamsDestinations} destinations
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Trophy className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-900">NFT Collection</span>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {dashboardData.userStats.nftCount} unique NFTs
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Coins className="w-5 h-5 text-orange-600" />
                        <span className="font-medium text-gray-900">Airdrop Progress</span>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {dashboardData.userStats.airdropPoints} points
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tier Advancement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <span>Tier Advancement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{dashboardData.userStats.currentTier}</h3>
                    <p className="text-gray-600">Current Tier</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress to Adventurer</span>
                      <span className="font-medium">{dashboardData.userStats.tierProgress}%</span>
                    </div>
                    <Progress value={dashboardData.userStats.tierProgress} className="h-3" />
                    <p className="text-xs text-gray-600 text-center">
                      {500 - dashboardData.userStats.airdropPoints} points needed for next tier
                    </p>
                  </div>
                  
                  <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600">
                    <Trophy className="w-4 h-4 mr-2" />
                    View Advancement Path
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Active Opportunities Tab */}
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span>Active Opportunities</span>
                </CardTitle>
                <CardDescription>
                  Maximize your rewards across all platform modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {dashboardData.activeOpportunities.map((opportunity, index) => {
                    const ModuleIcon = getModuleIcon(opportunity.module);
                    return (
                      <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-orange-200">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-500 rounded-lg flex items-center justify-center">
                              <ModuleIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{opportunity.module}</h4>
                              <p className="text-xs text-gray-600">Active opportunity</p>
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-lg text-gray-900 mb-2">{opportunity.opportunity}</h3>
                          <p className="text-sm text-green-600 font-medium mb-4">{opportunity.potential}</p>
                          
                          <Button size="sm" className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:opacity-90">
                            {opportunity.action}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Module Navigation */}
          <TabsContent value="travel">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow border-blue-200">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Book Your Next Trip</h3>
                  <p className="text-sm text-gray-600 mb-4">Search across 6 integrated providers</p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Start Booking
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow border-green-200">
                <CardContent className="p-6 text-center">
                  <Brain className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Smart Dreams</h3>
                  <p className="text-sm text-gray-600 mb-4">AI-powered travel planning</p>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Explore Dreams
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow border-purple-200">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg text-gray-900 mb-2">AI Intelligence</h3>
                  <p className="text-sm text-gray-600 mb-4">Personalized insights</p>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    View Insights
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rewards Integration Tab */}
          <TabsContent value="rewards">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-purple-600" />
                    <span>NFT Collection Integration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {dashboardData.userStats.nftCount}
                      </div>
                      <p className="text-gray-600">Travel Experience NFTs</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">$347</div>
                        <div className="text-xs text-gray-600">Credits Earned</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">15%</div>
                        <div className="text-xs text-gray-600">Avg Bonus</div>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                      <Trophy className="w-4 h-4 mr-2" />
                      View My Collection
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-green-600" />
                    <span>Airdrop Integration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {dashboardData.userStats.airdropPoints}
                      </div>
                      <p className="text-gray-600">Total Airdrop Points</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">1.5x</div>
                        <div className="text-xs text-gray-600">Tier Multiplier</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">1,212</div>
                        <div className="text-xs text-gray-600">Est. Allocation</div>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                      <Coins className="w-4 h-4 mr-2" />
                      Track Progress
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions Bar */}
        <Card className="mt-8 bg-gradient-to-r from-orange-500 to-green-500 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Ready for your next adventure?</h3>
                <p className="text-orange-100">
                  Book now to earn NFT rewards and advance your tier status
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
                  <Calendar className="w-5 h-5 mr-2" />
                  Start Booking
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Brain className="w-5 h-5 mr-2" />
                  AI Planning
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnifiedUserDashboard;