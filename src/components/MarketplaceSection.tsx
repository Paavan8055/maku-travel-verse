import { Users, User, Dog, Sparkles, ArrowRight, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageOptimizer } from "@/components/media/ImageOptimizer";

const MarketplaceSection = () => {
  const marketplaces = [
    {
      id: "family",
      name: "Family Adventures",
      icon: Users,
      color: "bg-gradient-to-br from-travel-ocean to-blue-600",
      description: "Curated family-friendly hotels with kids' clubs, activity bundles, and adjoining rooms (30% of bookings)",
      features: ["Family rooms", "Kids clubs", "Gold Coast 4.5★", "Bali 4.6★"],
      destinations: "2,400+ reviews",
      deals: "Up to 40% off",
      image: "https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=400&h=200&fit=crop&fm=webp&q=80"
    },
    {
      id: "solo",
      name: "Solo Journeys",
      icon: User,
      color: "bg-gradient-to-br from-travel-adventure to-purple-600",
      description: "Single-room deals, co-working spaces, and community meet-ups for independent travellers (25% of bookings)",
      features: ["Solo-friendly", "Bangkok hostels", "Melbourne boutique", "Singapore business"],
      destinations: "1,800+ reviews",
      deals: "Special solo rates",
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=200&fit=crop&fm=webp&q=80"
    },
    {
      id: "pet",
      name: "Pet-Friendly Travel",
      icon: Dog,
      color: "bg-gradient-to-br from-travel-forest to-green-600",
      description: "10,000+ pet-friendly stays personally vetted by our team, plus dog parks and pet services (15% of bookings)",
      features: ["Pet-friendly hotels", "Byron Bay resorts", "Adelaide vineyards", "Perth beachfront"],
      destinations: "1,200+ verified",
      deals: "Pets stay free",
      image: "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&h=200&fit=crop&fm=webp&q=80"
    },
    {
      id: "spiritual",
      name: "Spiritual Retreats",
      icon: Sparkles,
      color: "bg-gradient-to-br from-travel-gold to-amber-600",
      description: "Yoga retreats, meditation centers, and temple tours across India, Thailand, and Bali (10% of bookings)",
      features: ["Rishikesh ashrams", "Ubud wellness", "Chiang Mai temples", "Sacred sites"],
      destinations: "800+ retreats",
      deals: "Wellness packages",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&fm=webp&q=80"
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Playfair_Display']">
            Four Unique <span className="hero-text">Travel Experiences</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Choose the experience that fits you best—tailored by our Agentic AI engine that learns your preferences and matches you with perfect destinations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {marketplaces.map((marketplace, index) => (
            <Card 
              key={marketplace.id} 
              className="travel-card overflow-hidden group cursor-pointer animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-48 overflow-hidden">
                <ImageOptimizer
                  src={marketplace.image}
                  alt={marketplace.name}
                  width={400}
                  height={192}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  quality={80}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Icon and Deal Badge */}
                <div className="absolute top-4 left-4">
                  <div className={`${marketplace.color} p-3 rounded-xl`}>
                    <marketplace.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <div className="absolute top-4 right-4">
                  <div className="bg-travel-coral text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {marketplace.deals}
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center text-white/90 text-sm mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{marketplace.destinations} destinations</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-3 font-['Playfair_Display']">
                  {marketplace.name}
                </h3>
                
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {marketplace.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {marketplace.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm">
                      <Star className="h-3 w-3 text-travel-gold mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full btn-primary group">
                  Explore {marketplace.name}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Travel Fund Manager CTA */}
        <div className="mt-16">
          <Card className="travel-card bg-gradient-hero text-white overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-3xl md:text-4xl font-bold mb-4 font-['Playfair_Display']">
                  Travel Fund Manager
                </h3>
                <p className="text-xl text-white/90 mb-8 leading-relaxed">
                  Collaborative savings platform with over AUD 1.2 million deposited by Australian families since January 2025. 
                  Save together, travel together with milestone rewards and progress tracking.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button variant="secondary" className="btn-secondary">
                    Start Saving Today
                  </Button>
                  
                  <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
                    Learn More
                  </Button>
                </div>

                <div className="flex items-center justify-center mt-8 space-x-8 text-white/80">
                  <div className="text-center">
                    <div className="text-2xl font-bold">AUD 750</div>
                    <div className="text-sm">Average fund size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">25%</div>
                    <div className="text-sm">Monthly growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">3,200</div>
                    <div className="text-sm">Active groups</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceSection;