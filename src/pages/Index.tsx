
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import MarketplacePills from "@/components/MarketplacePills";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import ChatWidget from "@/features/makuBot/components/ChatWidget";
import AgenticWidget from "@/features/agenticBot/components/AgenticWidget";
import { SocialProofIndicators } from "@/components/ota/SocialProofIndicators";
import { PriceIntelligence } from "@/components/ota/PriceIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Activity, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <MarketplacePills />
      
      {/* Travel Tech Intelligence Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-travel-gold" />
            <Badge className="bg-gradient-to-r from-travel-gold to-travel-sunset text-white">
              Powered by AI
            </Badge>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Smart Travel Technology
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time price intelligence, social proof, and AI-powered recommendations for smarter travel decisions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="travel-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-travel-coral" />
                Live Travel Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SocialProofIndicators 
                itemType="hotel" 
                itemId="demo-hotel-1"
                itemData={{ name: "Park Hyatt Sydney", location: "Sydney, Australia" }}
              />
            </CardContent>
          </Card>
          
          <Card className="travel-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-travel-ocean" />
                Price Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PriceIntelligence 
                itemType="hotel"
                itemId="demo-hotel-1"
                currentPrice={299}
                route="sydney-hotels"
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <SearchSection />
      <MarketplaceSection />
      <FeaturedListings />
      <Footer />
      <ChatWidget userVertical="Solo" />
      <AgenticWidget />
    </div>
  );
};

export default Index;
