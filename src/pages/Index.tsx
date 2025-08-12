
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import MarketplacePills from "@/components/MarketplacePills";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import ChatWidget from "@/features/makuBot/components/ChatWidget";
import AgenticWidget from "@/features/agenticBot/components/AgenticWidget";

const Index = () => {
  return (
    <div className="min-h-screen app-bright">
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
  );
};

export default Index;
