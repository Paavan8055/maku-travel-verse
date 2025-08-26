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
import { EmergencyFixPanel } from "@/components/EmergencyFixPanel";
import { SystemHardeningPanel } from "@/components/SystemHardeningPanel";
import { SecureAdminDashboard } from "@/components/SecureAdminDashboard";
import { PriceAlertManager } from "@/components/PriceAlertManager";
import { TestingFrameworkDashboard } from "@/components/TestingFrameworkDashboard";
const Index = () => {
  return (
    <ErrorBoundary>
      <PerformanceWrapper componentName="HomePage">
        <div className="min-h-screen bg-background">
          <TestModeIndicator />
          <SessionRecoveryBanner />
          <Navbar />
          
          {/* Emergency Fix Panel - Critical for Production Launch */}
          <div className="bg-destructive/5 border-y border-destructive/20 py-6">
            <div className="max-w-4xl mx-auto px-6">
              <EmergencyFixPanel />
              <SystemHardeningPanel />
            </div>
          </div>

          {/* Phase 3: Enterprise Polish & UI Completion */}
          <div className="bg-gradient-to-r from-primary/5 to-blue-600/5 border-y border-primary/20 py-6">
            <div className="max-w-6xl mx-auto px-6 space-y-6">
              <h2 className="text-2xl font-bold text-center mb-6">Enterprise Grade Features</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <SecureAdminDashboard />
                  <TestingFrameworkDashboard />
                </div>
                <div className="space-y-6">
                  <PriceAlertManager />
                </div>
              </div>
            </div>
          </div>
          
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
