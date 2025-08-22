import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import MarketplacePills from "@/components/MarketplacePills";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import ChatWidget from "@/features/makuBot/components/ChatWidget";
import AgenticWidget from "@/features/agenticBot/components/AgenticWidget";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";
import TestModeIndicator from "@/components/TestModeIndicator";
const Index = () => {
  return (
    <PerformanceWrapper componentName="HomePage">
      <div className="min-h-screen bg-background">
        <TestModeIndicator />
        <Navbar />
        <HeroSection />
        <MarketplacePills />

        <SearchSection />
        <MarketplaceSection />
        <FeaturedListings />
        <Footer />
        <ChatWidget userVertical="Solo" />
        <AgenticWidget />
      </div>
    </PerformanceWrapper>
  );
};
export default Index;
