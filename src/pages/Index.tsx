
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import MarketplacePills from "@/components/MarketplacePills";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import ChatWidget from "@/features/makuBot/components/ChatWidget";
import AgenticInlinePanel from "@/features/agenticBot/components/AgenticInlinePanel";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <MarketplacePills />
      <SearchSection />
      <MarketplaceSection />
      <FeaturedListings />

      {/* Inline Agentic Bot section */}
      <div className="my-16">
        <AgenticInlinePanel userVertical="Solo" />
      </div>

      <Footer />
      <ChatWidget userVertical="Solo" />
    </div>
  );
};

export default Index;
