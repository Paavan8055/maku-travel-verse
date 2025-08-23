import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import MarketplacePills from "@/components/MarketplacePills";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import PaymentDebugger from "@/components/debugging/PaymentDebugger";
import { ProductionDiagnostics } from '@/components/diagnostics/ProductionDiagnostics';
import ChatWidget from "@/features/makuBot/components/ChatWidget";
import AgenticWidget from "@/features/agenticBot/components/AgenticWidget";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";
import TestModeIndicator from "@/components/TestModeIndicator";
import { SessionRecoveryBanner } from "@/components/SessionRecoveryBanner";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Button } from "@/components/ui/button";
const Index = () => {
  return (
    <ErrorBoundary>
      <PerformanceWrapper componentName="HomePage">
        <div className="min-h-screen bg-background">
          <TestModeIndicator />
          <SessionRecoveryBanner />
          <Navbar />
          <HeroSection />
          <MarketplacePills />

        {/* Production Diagnostics - Critical for debugging current issues */}
        <div className="container mx-auto px-4 py-8">
          <ProductionDiagnostics />
        </div>

        <SearchSection />
      <MarketplaceSection />
      <FeaturedListings />
          {/* Debug Section - Only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="max-w-4xl mx-auto px-6 py-12">
              <PaymentDebugger />
              <div className="mt-8 text-center space-y-2">
                <div className="text-lg font-semibold mb-4">🧪 Test All Booking Flows</div>
                <div className="grid grid-cols-3 gap-4">
                  <Button 
                    onClick={() => window.location.href = '/hotels?destination=sydney&checkIn=2025-08-24&checkOut=2025-08-25&guests=2'}
                    variant="outline"
                  >
                    🏨 Test Hotels
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/flights?origin=LAX&destination=SYD&departureDate=2025-08-24&passengers=2'}
                    variant="outline"
                  >
                    ✈️ Test Flights
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/activities?destination=sydney&date=2025-08-24&participants=2'}
                    variant="outline"
                  >
                    🎯 Test Activities
                  </Button>
                </div>
                <Button 
                  onClick={() => window.location.href = '/hotel-checkout-test'}
                  variant="default"
                  className="mt-4"
                >
                  💳 Complete Hotel Payment Test
                </Button>
              </div>
            </div>
          )}
      
      <Footer />
        <ChatWidget userVertical="Solo" />
        <AgenticWidget />
        </div>
      </PerformanceWrapper>
    </ErrorBoundary>
  );
};
export default Index;
