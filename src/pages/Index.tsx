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
import { SessionRecoveryBanner } from "@/components/SessionRecoveryBanner";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { PriceAlertManager } from "@/components/PriceAlertManager";
const Index = () => {
  return (
    <ErrorBoundary>
      <PerformanceWrapper componentName="HomePage">
        <div className="min-h-screen bg-background">
          <SessionRecoveryBanner />
          <Navbar />
          
          {/* Price Alerts for authenticated users */}
          <div className="bg-gradient-to-r from-primary/5 to-blue-600/5 border-y border-primary/20 py-6">
            <div className="max-w-6xl mx-auto px-6">
              <PriceAlertManager />
            </div>
          </div>
          
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
    </ErrorBoundary>
  );
};
export default Index;
