
import { useState } from "react";
import { HelpCircle, MessageCircle, Mail, Phone, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const faqItems = [
    {
      question: "How do I make a booking?",
      answer: "You can make a booking by searching for your desired destination, selecting your preferred option, and following the checkout process. We accept all major credit cards and secure payment methods."
    },
    {
      question: "Can I cancel or modify my booking?",
      answer: "Yes, you can cancel or modify most bookings. The specific terms depend on the property or service provider. Check your booking confirmation email for details or contact our support team."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are processed securely through Stripe."
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach our support team via live chat (24/7), email at support@maku.travel, or phone at +1-800-MAKU-HELP. We typically respond within 2 hours."
    },
    {
      question: "Is my personal information secure?",
      answer: "Absolutely. We use industry-standard encryption and security measures to protect your personal and payment information. We never share your data with third parties without your consent."
    },
    {
      question: "How do I create an account?",
      answer: "Click the 'Sign In' button in the top navigation, then select 'Create Account'. You can also sign up using your Google or Facebook account for faster registration."
    },
    {
      question: "What if I need help during my trip?",
      answer: "Our 24/7 customer support is available throughout your trip. You can contact us via the mobile app, phone, or email for any assistance you need."
    },
    {
      question: "How do I earn and redeem loyalty points?",
      answer: "Join our loyalty program to earn points on every booking. Points can be redeemed for discounts on future bookings. Premium members get additional benefits and faster point accumulation."
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", contactForm);
    // Handle form submission
  };

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <HelpCircle className="h-16 w-16 text-travel-ocean mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Find answers to common questions or get in touch with our support team
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for help..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="faq" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredFAQ.map((item, index) => (
                    <Collapsible key={index}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between text-left p-4 h-auto hover:bg-muted/50"
                        >
                          <span className="font-medium">{item.question}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <p className="text-muted-foreground">{item.answer}</p>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
                
                {filteredFAQ.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                    <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                      Clear search
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name *</label>
                      <Input
                        placeholder="Your full name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email *</label>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject *</label>
                      <Input
                        placeholder="What can we help you with?"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Message *</label>
                      <Textarea
                        placeholder="Please describe your issue or question..."
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-travel-ocean hover:bg-travel-ocean/90">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-travel-ocean" />
                      Live Chat Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Get instant help from our support team
                    </p>
                    <Button className="w-full bg-travel-ocean hover:bg-travel-ocean/90">
                      Start Live Chat
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-travel-forest" />
                      Email Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">support@maku.travel</p>
                    <p className="text-sm text-muted-foreground">
                      We typically respond within 2 hours
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-travel-coral" />
                      Phone Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">+1-800-MAKU-HELP</p>
                    <p className="text-sm text-muted-foreground">
                      Available 24/7 for urgent matters
                    </p>
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
