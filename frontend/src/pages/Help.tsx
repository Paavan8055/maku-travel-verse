
import { useState } from "react";
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  Search, 
  ChevronRight, 
  MapPin, 
  Plane, 
  Heart, 
  Shield, 
  Clock, 
  Users,
  Compass,
  Star,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const quickActions = [
    { icon: Plane, title: "Book a Trip", desc: "Start planning your next adventure", color: "travel-ocean" },
    { icon: MapPin, title: "Track Booking", desc: "Check your reservation status", color: "travel-forest" },
    { icon: Heart, title: "Emergency Help", desc: "24/7 travel assistance", color: "travel-coral" },
    { icon: Users, title: "Group Travel", desc: "Plan trips for families & friends", color: "travel-amber" }
  ];

  const faqCategories = [
    {
      category: "✈️ Booking & Reservations",
      items: [
        {
          question: "How do I book the perfect trip for my family?",
          answer: "Our Family marketplace helps you find kid-friendly hotels, activities, and restaurants. Use our advanced filters to find properties with pools, family rooms, and entertainment options. Book with confidence knowing all recommendations are family-tested!"
        },
        {
          question: "Can I modify my adventure booking?",
          answer: "Yes! Most bookings can be modified up to 24 hours before your trip. Simply visit your Dashboard, find your booking, and click 'Modify'. Changes may incur fees depending on the supplier's policy."
        },
        {
          question: "What happens if my flight gets cancelled?",
          answer: "Don't worry! Our 24/7 Travel Guardian team will automatically rebook you on the next available flight at no extra cost. You'll receive instant notifications and alternative options within minutes."
        }
      ]
    },
    {
      category: "🌍 Travel Experiences",
      items: [
        {
          question: "How do I find pet-friendly accommodations?",
          answer: "Use our Pet marketplace to discover hotels, vacation rentals, and activities that welcome your furry friends. All listings include pet policies, fees, and nearby pet services like veterinarians and parks."
        },
        {
          question: "What makes Spiritual travel different?",
          answer: "Our Spiritual marketplace curates transformative experiences - from meditation retreats in Bali to yoga sessions in the Himalayas. Each experience includes mindfulness ratings and authentic local connections."
        },
        {
          question: "How does Solo travel safety work?",
          answer: "Solo travelers get access to our Safety Network - verified accommodations, 24/7 check-in reminders, emergency contacts, and a community of fellow solo adventurers. Your safety is our priority!"
        }
      ]
    },
    {
      category: "💳 Payments & Loyalty",
      items: [
        {
          question: "How do Travel Fund Rewards work?",
          answer: "Earn Maku Points on every booking! Family trips earn 2x points, group bookings earn 3x points. Redeem for future travel, upgrades, or exclusive experiences. Premium members get bonus point multipliers!"
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards, PayPal, Apple Pay, Google Pay, and crypto payments. All transactions are secured with bank-level encryption through our trusted payment partners."
        }
      ]
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", contactForm);
    // Handle form submission
  };

  const filteredFAQ = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-travel-sky/5">
      <Navbar />
      
      {/* Hero Section with Travel Theme */}
      <div className="relative overflow-hidden bg-gradient-to-r from-travel-ocean via-travel-sky to-travel-forest">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-grid-white/10 opacity-30" />
        
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="animate-fade-in">
            <Globe className="h-20 w-20 text-white mx-auto mb-6 animate-pulse" />
            <h1 className="hero-text text-5xl md:text-7xl font-bold text-white mb-6">
              Your Travel Guardian
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
              Whether you're planning a family adventure, solo expedition, pet-friendly getaway, or spiritual journey - we're here to guide every step of your travel story
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
              <Input
                placeholder="Search your travel questions..."
                className="pl-12 pr-4 py-4 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/70 focus:bg-white/20 transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
            Need Quick Help?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="travel-card hover-scale cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-full bg-${action.color}/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className={`h-8 w-8 text-${action.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs defaultValue="faq" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-gradient-to-r from-travel-sky/10 to-travel-ocean/10 rounded-2xl">
            <TabsTrigger value="faq" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-travel-sky data-[state=active]:to-travel-ocean data-[state=active]:text-white">
              <Compass className="h-5 w-5" />
              Travel FAQ
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-travel-coral data-[state=active]:to-travel-amber data-[state=active]:text-white">
              <MessageCircle className="h-5 w-5" />
              Travel Guardian
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-8">
            {filteredFAQ.length > 0 ? (
              filteredFAQ.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="travel-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {category.category}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.items.map((item, index) => (
                        <Collapsible key={index} className="group">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-left p-6 h-auto hover:bg-gradient-to-r hover:from-travel-sky/5 hover:to-travel-ocean/5 rounded-xl transition-all duration-300"
                            >
                              <span className="font-semibold text-lg pr-4">{item.question}</span>
                              <ChevronRight className="h-5 w-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-6 pb-6">
                            <div className="mt-4 p-4 bg-gradient-to-r from-travel-sky/5 to-travel-ocean/5 rounded-lg">
                              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : searchQuery ? (
              <Card className="text-center py-16">
                <CardContent>
                  <Compass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No travel guides found</h3>
                  <p className="text-muted-foreground mb-6">Couldn't find answers for "{searchQuery}"</p>
                  <Button variant="outline" onClick={() => setSearchQuery("")} className="btn-primary">
                    <Search className="h-4 w-4 mr-2" />
                    Clear search & explore all guides
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="contact">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced Contact Form */}
              <Card className="travel-card">
                <CardHeader className="bg-gradient-to-r from-travel-coral/10 to-travel-amber/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <MessageCircle className="h-6 w-6 text-travel-coral" />
                    Tell us about your travel needs
                  </CardTitle>
                  <p className="text-muted-foreground">Our Travel Guardians are standing by to help with any question or concern</p>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div>
                      <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Traveler Name *
                      </label>
                      <Input
                        placeholder="Enter your full name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="search-input"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="search-input"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                        <Compass className="h-4 w-4" />
                        How can we help with your journey? *
                      </label>
                      <Input
                        placeholder="e.g., Family trip to Tokyo, Pet-friendly hotels in Bali..."
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="search-input"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Tell us more about your travel story *
                      </label>
                      <Textarea
                        placeholder="Share your travel dreams, concerns, or questions. The more details you provide, the better we can assist you..."
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="search-input"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full btn-primary h-12 text-lg">
                      <Plane className="h-5 w-5 mr-2" />
                      Send to Travel Guardian
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Enhanced Contact Options */}
              <div className="space-y-6">
                {/* Emergency Travel SOS */}
                <Card className="travel-card border-travel-coral/20 bg-gradient-to-br from-travel-coral/5 to-travel-amber/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-travel-coral">
                      <Shield className="h-6 w-6" />
                      Travel SOS Emergency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Stuck abroad? Flight cancelled? Need immediate assistance? Our emergency travel team is standing by 24/7.
                    </p>
                    <Button className="w-full bg-gradient-to-r from-travel-coral to-travel-amber hover:opacity-90 text-white font-semibold">
                      <Phone className="h-4 w-4 mr-2" />
                      Emergency Hotline: +1-800-MAKU-SOS
                    </Button>
                  </CardContent>
                </Card>

                {/* Live Travel Chat */}
                <Card className="travel-card border-travel-ocean/20 bg-gradient-to-br from-travel-ocean/5 to-travel-sky/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-travel-ocean">
                      <MessageCircle className="h-6 w-6" />
                      Travel Guardian Chat
                      <Badge className="bg-green-500 text-white">ONLINE</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Chat with our travel experts who know every corner of the globe. Get personalized recommendations instantly!
                    </p>
                    <Button className="w-full bg-gradient-to-r from-travel-ocean to-travel-sky hover:opacity-90 text-white font-semibold">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Travel Chat
                    </Button>
                  </CardContent>
                </Card>

                {/* Travel Community */}
                <Card className="travel-card border-travel-forest/20 bg-gradient-to-br from-travel-forest/5 to-travel-amber/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-travel-forest">
                      <Users className="h-6 w-6" />
                      Travel Community
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Join thousands of travelers sharing tips, experiences, and recommendations. Get advice from people who've been there!
                    </p>
                    <Button variant="outline" className="w-full border-travel-forest text-travel-forest hover:bg-travel-forest hover:text-white">
                      <Users className="h-4 w-4 mr-2" />
                      Join Community
                    </Button>
                  </CardContent>
                </Card>

                {/* Contact Details */}
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Globe className="h-6 w-6 text-travel-amber" />
                      Maku Travel HQ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-travel-forest" />
                      <div>
                        <p className="font-medium">guardian@maku.travel</p>
                        <p className="text-sm text-muted-foreground">Response within 1 hour</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-travel-ocean" />
                      <div>
                        <p className="font-medium">24/7 Global Support</p>
                        <p className="text-sm text-muted-foreground">Never travel alone again</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-travel-amber" />
                      <div>
                        <p className="font-medium">5-Star Travel Service</p>
                        <p className="text-sm text-muted-foreground">Rated by 100k+ travelers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HelpPage;
