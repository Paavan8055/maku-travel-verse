import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import MarketplacePills from "@/components/MarketplacePills";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";
import { SessionRecoveryBanner } from "@/components/SessionRecoveryBanner";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import StableTravelBot from "@/components/bot/StableTravelBot";
import { PartnerShowcase } from "@/components/partners/PartnerShowcase";

// Lazy load below-the-fold components for better performance
const MarketplaceSection = lazy(() => import("@/components/MarketplaceSection"));
const FeaturedListings = lazy(() => import("@/components/FeaturedListings"));
const FooterCtas = lazy(() => import("@/components/FooterCtas"));
const Footer = lazy(() => import("@/components/Footer"));

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
          <Suspense fallback={<div className="text-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div></div>}>
            <div className="relative">
              {/* Bot temporarily removed to fix loading issue */}
            </div>
          </Suspense>
          
          {/* Lazy load below-the-fold content */}
          <Suspense fallback={<div className="h-96 bg-muted/50 animate-pulse" />}>
            <MarketplaceSection />
          </Suspense>
          
          <Suspense fallback={<div className="h-96 bg-muted/50 animate-pulse" />}>
            <FeaturedListings />
          </Suspense>

          {/* Partner Showcase */}
          <Suspense fallback={<div className="h-64 bg-muted/50 animate-pulse" />}>
            <div className="py-16 bg-gradient-to-br from-orange-50 via-white to-green-50">
              <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                  Trusted Travel Partners
                </h2>
                <p className="text-lg text-center text-gray-600 mb-8">
                  Powered by industry-leading providers
                </p>
                {/* Partner showcase temporarily removed to fix loading */}
              </div>
            </div>
          </Suspense>
      
          <Suspense fallback={<div className="h-32 bg-muted/50 animate-pulse" />}>
            <FooterCtas />
          </Suspense>
          
          <Suspense fallback={<div className="h-32 bg-muted/50 animate-pulse" />}>
            <Footer />
          </Suspense>
        </div>
      </PerformanceWrapper>
    </ErrorBoundary>
  );
};
export default Index;
