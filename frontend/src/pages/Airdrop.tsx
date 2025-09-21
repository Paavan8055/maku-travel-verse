import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterCtas from "@/components/FooterCtas";
import AirdropProgress from "@/components/nft/AirdropProgress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Share2, Calendar, Coins, Star, Globe, Zap } from "lucide-react";

export default function Airdrop() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <Navbar />

      {/* Enhanced Hero */}
      <section className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <Coins className="inline-block w-12 h-12 mr-4 text-yellow-300" />
              Maku Airdrop System
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Earn points through travel activities, complete quests with our 6 integrated providers, 
              and advance through tiers to maximize your airdrop allocation.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Globe className="w-8 h-8 mx-auto mb-3 text-blue-300" />
                <h3 className="font-semibold text-lg">6 Providers</h3>
                <p className="text-sm text-green-100">Expedia, Amadeus, Viator & more</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-3 text-yellow-300" />
                <h3 className="font-semibold text-lg">4 Tiers</h3>
                <p className="text-sm text-green-100">Wanderer to Legend progression</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 mx-auto mb-3 text-green-300" />
                <h3 className="font-semibold text-lg">AI Integrated</h3>
                <p className="text-sm text-green-100">Smart quest recommendations</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 mx-auto mb-3 text-purple-300" />
                <h3 className="font-semibold text-lg">Summer 2024</h3>
                <p className="text-sm text-green-100">Main airdrop event</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 px-8 py-4 text-lg mr-4">
              <Users className="w-5 h-5 mr-2" />
              Start Earning Points
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
              View Leaderboard
            </Button>
          </div>
        </div>
      </section>

      {/* Main Airdrop Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="progress">My Progress</TabsTrigger>
            <TabsTrigger value="quests">Active Quests</TabsTrigger>
            <TabsTrigger value="info">Airdrop Info</TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            <AirdropProgress />
          </TabsContent>

          <TabsContent value="quests">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center space-x-2">
                  <Trophy className="w-6 h-6" />
                  <span>Provider Integration Quests</span>
                </CardTitle>
                <CardDescription>
                  Complete travel bookings and activities to earn airdrop points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Expedia Group Pioneer",
                      description: "Be among the first to book using our new Expedia Group integration",
                      points: 150,
                      progress: 0,
                      provider: "expedia",
                      color: "from-blue-500 to-purple-500",
                      icon: Globe
                    },
                    {
                      title: "Multi-Provider Champion", 
                      description: "Complete bookings with 4+ different providers in the ecosystem",
                      points: 200,
                      progress: 50,
                      provider: "multi",
                      color: "from-green-500 to-blue-500",
                      icon: Star
                    },
                    {
                      title: "Smart Dreams Master",
                      description: "Use AI Intelligence features and build dream destination collection",
                      points: 100,
                      progress: 75,
                      provider: "ai",
                      color: "from-purple-500 to-pink-500",
                      icon: Zap
                    },
                    {
                      title: "Social Travel Ambassador",
                      description: "Share travel experiences and engage with the Maku community",
                      points: 120,
                      progress: 30,
                      provider: "social", 
                      color: "from-orange-500 to-yellow-500",
                      icon: Users
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
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`bg-gradient-to-r ${quest.color} h-2 rounded-full transition-all duration-300`}
                                  style={{ width: `${quest.progress}%` }}
                                ></div>
                              </div>
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

          <TabsContent value="info">
            {/* Original Airdrop Information */}
            <div className="space-y-8">
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center space-x-2">
                    <Calendar className="w-6 h-6" />
                    <span>Airdrop Schedule & Rules</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <Calendar className="h-6 w-6 text-blue-600" />
                        <h3 className="font-semibold mt-3">Roadmap-Locked</h3>
                        <p className="text-sm text-gray-600 mt-2">
                          No changes to the date. We build responsibly; hype without false promises.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <Users className="h-6 w-6 text-green-600" />
                        <h3 className="font-semibold mt-3">Priority Tiers</h3>
                        <p className="text-sm text-gray-600 mt-2">
                          Top contributors get WL priority and fee-credit perks, not token guarantees.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <Trophy className="h-6 w-6 text-purple-600" />
                        <h3 className="font-semibold mt-3">Leaderboards</h3>
                        <p className="text-sm text-gray-600 mt-2">
                          Weekly top wallets (anonymized) showcased. Fair caps prevent farming.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Enhanced Quest System</CardTitle>
                  <CardDescription>
                    Integrated with all travel providers and platform features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      {[
                        { title: "Connect Wallet & Profile", points: 25, category: "Setup" },
                        { title: "Complete Expedia Group Booking", points: 150, category: "New Integration" },
                        { title: "Multi-Provider Mastery", points: 200, category: "Advanced" },
                        { title: "Smart Dreams Collection", points: 100, category: "AI Features" },
                        { title: "Social Travel Sharing", points: 120, category: "Community" },
                        { title: "30-Day Activity Streak", points: 300, category: "Loyalty" },
                      ].map((quest, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{quest.title}</h4>
                            <Badge variant="outline">{quest.category}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Earn airdrop points</span>
                            <span className="font-medium text-green-600">+{quest.points} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <FooterCtas />
      <Footer />
    </div>
  );
}