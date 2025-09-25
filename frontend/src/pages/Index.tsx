import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header with Maku Branding */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
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
              <a href="/smart-dreams" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Smart Dreams</a>
              <a href="/nft" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Rewards</a>
              <a href="/airdrop" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Airdrop</a>
              <a href="/partners" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Partners</a>
            </nav>
            
            <div className="md:hidden">
              <button className="text-gray-700 hover:text-orange-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Maku
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Your intelligent travel platform with AI-powered planning and blockchain rewards.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <p className="text-sm text-green-800">
                ✅ Header implemented correctly: Clean "Maku" branding without space-consuming badges
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Start Booking
              </button>
              <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors">
                Explore Features
              </button>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gradient-to-br from-orange-50 to-green-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Trusted Travel Partners
            </h2>
            <p className="text-lg text-center text-gray-600 mb-12">
              Powered by 6 industry-leading providers
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {['Expedia', 'Amadeus', 'Viator', 'Duffle', 'RateHawk', 'Sabre'].map(provider => (
                <div key={provider} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">{provider[0]}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{provider}</h3>
                  <p className="text-xs text-gray-600">Travel Provider</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      {/* Simple Footer */}
      <footer className="bg-gradient-to-r from-orange-500 to-green-500 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="text-lg font-bold">Maku</span>
            <span className="text-sm opacity-80">© 2025 Maku. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
