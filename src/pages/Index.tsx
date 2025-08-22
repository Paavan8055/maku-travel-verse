import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import MarketplacePills from "@/components/MarketplacePills";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import PaymentDebugger from "@/components/debugging/PaymentDebugger";
import ChatWidget from "@/features/makuBot/components/ChatWidget";
import AgenticWidget from "@/features/agenticBot/components/AgenticWidget";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";
import TestModeIndicator from "@/components/TestModeIndicator";
import { Button } from "@/components/ui/button";
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
      
          {/* Debug Section - Only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="max-w-4xl mx-auto px-6 py-12">
              <PaymentDebugger />
              <div className="mt-8 text-center">
                <Button 
                  onClick={() => window.location.href = '/hotel-checkout-test'}
                  variant="outline"
                  className="mb-4"
                >
                  🧪 Test Hotel Checkout Flow
                </Button>
              </div>
            </div>
          )}
      
      <Footer />
        <ChatWidget userVertical="Solo" />
        <AgenticWidget />
      </div>
    </PerformanceWrapper>
  );
};
export default Index;
