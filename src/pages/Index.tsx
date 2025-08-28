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
  return <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <MarketplacePills />
      
      {/* Travel Tech Intelligence Section */}
      
      
      <SearchSection />
      <MarketplaceSection />
      <FeaturedListings />
      <Footer />
      <ChatWidget userVertical="Solo" />
      <AgenticWidget />
    </div>;
};
export default Index;