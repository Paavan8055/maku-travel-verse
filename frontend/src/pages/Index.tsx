import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import MarketplacePills from "@/components/MarketplacePills";
import LiveBookingFeed from "@/components/LiveBookingFeed";
import TrustSection from "@/components/TrustSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import AuthenticFeaturedHotels from "@/components/AuthenticFeaturedHotels";
import AuthenticFeaturedFlights from "@/components/AuthenticFeaturedFlights";
import AuthenticFeaturedActivities from "@/components/AuthenticFeaturedActivities";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";
import { SessionRecoveryBanner } from "@/components/SessionRecoveryBanner";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { PartnerShowcase } from "@/components/partners/PartnerShowcase";

// Lazy load below-the-fold components for better performance
const FlashDealsSection = lazy(() => import("@/components/FlashDealsSection"));
const TrendingDestinationsSection = lazy(() => import("@/components/TrendingDestinationsSection"));
const MarketplaceSection = lazy(() => import("@/components/MarketplaceSection"));
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
          
          {/* Live Booking Activity Feed - OTA Standard Feature */}
          <LiveBookingFeed />
          
          {/* Flash Deals - Time-Sensitive Offers */}
          <Suspense fallback={<div className="h-96 bg-muted/50 animate-pulse" />}>
            <FlashDealsSection />
          </Suspense>
          
          {/* Trending Destinations - Popular Choices */}
          <Suspense fallback={<div className="h-96 bg-muted/50 animate-pulse" />}>
            <TrendingDestinationsSection />
          </Suspense>
          
          {/* Trust & Social Proof */}
          <TrustSection />
          
          {/* Why Choose Us - Feature Highlights */}
          <WhyChooseUsSection />
          
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
                <PartnerShowcase variant="compact" />
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
