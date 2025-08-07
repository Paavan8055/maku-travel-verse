
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import ChatWidget from "@/features/makuBot/components/ChatWidget";
import AgenticWidget from "@/features/agenticBot/components/AgenticWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <SearchSection />
      <MarketplaceSection />
      <FeaturedListings />
      <Footer />
      <ChatWidget userVertical="Solo" />
      <AgenticWidget />
    </div>
  );
};

export default Index;
