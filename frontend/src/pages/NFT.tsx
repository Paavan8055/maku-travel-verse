import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterCtas from "@/components/FooterCtas";
import TravelNFTDashboard from "@/components/nft/TravelNFTDashboard";
import TravelRewardsNFT from "@/components/nft/TravelRewardsNFT";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Sparkles, Wallet, Star, Globe, Trophy, Crown } from "lucide-react";

export default function NFT() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      <Navbar />

      {/* Enhanced Hero with Travel Integration */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-green-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Maku Travel NFTs
              <Crown className="inline-block w-12 h-12 ml-4 text-yellow-300" />
            </h1>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Transform your travel experiences into unique digital collectibles. 
              Earn rewards, unlock exclusive benefits, and build your travel legacy.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Globe className="w-8 h-8 mx-auto mb-3 text-blue-300" />
                <h3 className="font-semibold text-lg">6 Providers</h3>
                <p className="text-sm text-purple-100">Integrated travel partners</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-3 text-yellow-300" />
                <h3 className="font-semibold text-lg">9,999 NFTs</h3>
                <p className="text-sm text-purple-100">Total collection cap</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-green-300" />
                <h3 className="font-semibold text-lg">AI Powered</h3>
                <p className="text-sm text-purple-100">Intelligent rarity system</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 mx-auto mb-3 text-red-300" />
                <h3 className="font-semibold text-lg">Cronos Chain</h3>
                <p className="text-sm text-purple-100">Low gas fees</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg">
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet & Start Collecting
            </Button>
            <p className="text-sm text-purple-200 mt-3">
              Connect your wallet to view your collection and mint new travel NFTs
            </p>
          </div>
        </div>
      </section>

      {/* Main NFT Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="dashboard">NFT Dashboard</TabsTrigger>
            <TabsTrigger value="rewards">Travel Rewards</TabsTrigger>
            <TabsTrigger value="legacy">Phase Info</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <TravelNFTDashboard />
          </TabsContent>

          <TabsContent value="rewards">
            <TravelRewardsNFT variant="full" />
          </TabsContent>

          <TabsContent value="legacy">
            {/* Original Phase Information */}
            <div className="space-y-8">
              {/* Utilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">NFT Holder Utilities</CardTitle>
                  <CardDescription>Practical, platform-native benefits with real value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { icon: Sparkles, title: "Priority Access", desc: "Early access to new features, pilots and limited drops." },
                      { icon: Wallet, title: "Platform Credits", desc: "Fee-credit vouchers for bookings (values set conservatively)." },
                      { icon: Shield, title: "Transparent Provenance", desc: "IPFS metadata with reveal window and provenance hash." },
                      { icon: Star, title: "Community Multipliers", desc: "Leaderboard/WL priority multipliers during hype seasons." },
                    ].map(({ icon: Icon, title, desc }) => (
                      <Card key={title} className="h-full hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <Icon className="h-8 w-8 text-purple-600 mb-4" />
                          <h3 className="font-semibold text-lg mb-2">{title}</h3>
                          <p className="text-sm text-gray-600">{desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Phases */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Collection Phases</CardTitle>
                  <CardDescription>Structured release across three phases with increasing rarity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {[
                      { phase: "Phase-1", cap: "3,333", status: "Live (Enhanced with Travel Integration)", color: "from-green-500 to-emerald-600" },
                      { phase: "Phase-2", cap: "3,333", status: "Scheduled (Provider Milestones)", color: "from-blue-500 to-cyan-600" },
                      { phase: "Phase-3", cap: "3,333", status: "Scheduled (Community Achievements)", color: "from-purple-500 to-pink-600" },
                    ].map((p) => (
                      <Card key={p.phase} className="relative overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-10`}></div>
                        <CardContent className="relative p-6">
                          <p className="text-xs uppercase tracking-wide text-gray-600 font-medium">{p.phase}</p>
                          <h3 className="font-bold text-2xl mt-2">{p.cap}</h3>
                          <p className="text-sm text-gray-600 mt-2">{p.status}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <Crown className="w-12 h-12 text-yellow-600" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-yellow-700 font-medium">Universal 1/1</p>
                          <h3 className="font-bold text-xl text-gray-900 mt-1">Legendary "Universal" Maku NFT</h3>
                          <p className="text-sm text-gray-700 mt-2">
                            Awarded to one lucky Maku traveller by transparent raffle (snapshot & proof published).
                            Includes lifetime platform benefits and exclusive travel experiences.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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