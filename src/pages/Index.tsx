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
import { ProviderRotationTestPanel } from "@/components/debug/ProviderRotationTestPanel";
import { BookingTestPanel } from "@/components/debug/BookingTestPanel";
import { ProductionStatusIndicator } from "@/components/production/ProductionStatusIndicator";
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
          <SearchSection />
          <MarketplaceSection />
          <FeaturedListings />
          {/* Debug Section - Only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
              <ProductionDiagnostics />
              <PaymentDebugger />
              <ProviderRotationTestPanel />
              <BookingTestPanel 
                onTestHotelBooking={() => window.location.href = '/search/hotels?destination=Sydney&checkIn=' + 
                  new Date(Date.now() + 86400000).toISOString().split('T')[0] + 
                  '&checkOut=' + new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] + 
                  '&adults=2&rooms=1&test=true'}
                onTestFlightBooking={() => window.location.href = '/search/flights?origin=SYD&destination=MEL&departure=' +
                  new Date(Date.now() + 86400000).toISOString().split('T')[0] + 
                  '&adults=1&test=true'}
                onTestActivityBooking={() => window.location.href = '/search/activities?destination=Sydney&date=' +
                  new Date(Date.now() + 86400000).toISOString().split('T')[0] + 
                  '&participants=2&test=true'}
              />
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
