import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Maku
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your intelligent travel platform with AI-powered planning and blockchain rewards.
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
