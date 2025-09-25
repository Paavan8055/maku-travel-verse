import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Simplified header for testing */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-green-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Maku
              </span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/smart-dreams" className="text-gray-700 hover:text-orange-600 font-medium">Smart Dreams</a>
              <a href="/nft" className="text-gray-700 hover:text-orange-600 font-medium">Rewards</a>
              <a href="/airdrop" className="text-gray-700 hover:text-orange-600 font-medium">Airdrop</a>
              <a href="/partners" className="text-gray-700 hover:text-orange-600 font-medium">Partners</a>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="pt-8">
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Maku
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your intelligent travel platform with AI-powered planning and blockchain rewards.
            </p>
            <p className="text-lg text-gray-600">
              Clean header with just "Maku" branding - no space-consuming badges
            </p>
          </div>
        </section>
        
        <section className="py-16 bg-gradient-to-br from-orange-50 to-green-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Trusted Travel Partners
            </h2>
            <p className="text-lg text-center text-gray-600">
              Powered by 6 industry-leading providers including Expedia, Amadeus, Viator, Duffle, RateHawk, and Sabre
            </p>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
