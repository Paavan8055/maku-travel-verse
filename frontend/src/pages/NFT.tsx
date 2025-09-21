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

      {/* Main NFT Dashboard - NOW USING ACTUAL COMPONENTS */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <TravelNFTDashboard />
      </section>

      <FooterCtas />
      <Footer />
    </div>
  );
}