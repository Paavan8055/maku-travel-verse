import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import MarketplacePills from "@/components/MarketplacePills";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";
import { SessionRecoveryBanner } from "@/components/SessionRecoveryBanner";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

// Lazy load below-the-fold components for better performance
const MarketplaceSection = lazy(() => import("@/components/MarketplaceSection"));
const FeaturedListings = lazy(() => import("@/components/FeaturedListings"));
const FooterCtas = lazy(() => import("@/components/FooterCtas"));
const Footer = lazy(() => import("@/components/Footer"));
const ChatWidget = lazy(() => import("@/features/makuBot/components/ChatWidget"));
const AgenticWidget = lazy(() => import("@/features/agenticBot/components/AgenticWidget"));

const Index = () => {
  return (
    <ErrorBoundary>
      <PerformanceWrapper componentName="HomePage" enableMonitoring={false}>
        <div className="min-h-screen bg-background">
          <SessionRecoveryBanner />
          <Navbar />
          <HeroSection />
          <MarketplacePills />
          <SearchSection />
          
          {/* Lazy load below-the-fold content */}
          <Suspense fallback={<div className="h-96 bg-muted/50 animate-pulse" />}>
            <MarketplaceSection />
          </Suspense>
          
          <Suspense fallback={<div className="h-96 bg-muted/50 animate-pulse" />}>
            <FeaturedListings />
          </Suspense>
      
          <Suspense fallback={<div className="h-32 bg-muted/50 animate-pulse" />}>
            <FooterCtas />
          </Suspense>
          
          <Suspense fallback={<div className="h-32 bg-muted/50 animate-pulse" />}>
            <Footer />
          </Suspense>
          
          <Suspense fallback={null}>
            <AgenticWidget />
          </Suspense>
        </div>
      </PerformanceWrapper>
    </ErrorBoundary>
  );
};
export default Index;
