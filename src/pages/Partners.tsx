import { useState } from "react";
import { Building2, Users, TrendingUp, Shield, Globe, Heart, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";

const PartnersPage = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    businessType: "",
    description: "",
    website: ""
  });

  const partnerTypes = [
    {
      icon: Building2,
      title: "Hotels & Resorts",
      description: "Join our extensive network of accommodation partners",
      benefits: ["Global distribution", "Dynamic pricing", "Real-time inventory"],
      color: "bg-travel-ocean"
    },
    {
      icon: Globe,
      title: "Tour Operators",
      description: "Showcase your unique experiences to millions of travelers",
      benefits: ["Booking management", "Multi-language support", "Marketing tools"],
      color: "bg-travel-sky"
    },
    {
      icon: Users,
      title: "Activity Providers",
      description: "Connect with adventure seekers and experience hunters",
      benefits: ["Instant bookings", "Customer reviews", "Analytics dashboard"],
      color: "bg-travel-coral"
    },
    {
      icon: TrendingUp,
      title: "Transportation",
      description: "Offer flights, car rentals, and ground transportation",
      benefits: ["Route optimization", "Fleet management", "Revenue tracking"],
      color: "bg-travel-forest"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access to millions of travelers from 180+ countries"
    },
    {
      icon: TrendingUp,
      title: "Increase Revenue",
      description: "Boost your bookings with our marketing and distribution channels"
    },
    {
      icon: Heart,
      title: "Dedicated Support",
      description: "24/7 partner support team to help you succeed"
    }
  ];

  const existingPartners = [
    { name: "Marriott Hotels", logo: "🏨", category: "Hospitality" },
    { name: "Emirates Airlines", logo: "✈️", category: "Airlines" },
    { name: "Viator Tours", logo: "🎯", category: "Experiences" },
    { name: "Hertz Car Rental", logo: "🚗", category: "Transportation" },
    { name: "GetYourGuide", logo: "🗺️", category: "Activities" },
    { name: "Airbnb", logo: "🏡", category: "Accommodation" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Partner application submitted:", formData);
    // Handle form submission
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Partner with Maku.travel
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Join our global network of travel partners and grow your business with innovative 
            technology, extensive reach, and dedicated support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-travel-ocean hover:bg-travel-ocean/90">
              Become a Partner
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto" aria-label="Open Partner Portal">
              <Link to="/partner-portal">Partner Portal Login</Link>
            </Button>
          </div>
        </div>

        {/* Partner Types */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Partnership Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${type.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <type.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{type.description}</p>
                  <ul className="space-y-2">
                    {type.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Partner with Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-travel-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-travel-gold" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Existing Partners */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Trusted by Leading Brands</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {existingPartners.map((partner, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-4xl mb-2">{partner.logo}</div>
                  <h4 className="font-medium text-sm mb-1">{partner.name}</h4>
                  <Badge variant="outline" className="text-xs">{partner.category}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Start Your Partnership Journey</CardTitle>
              <p className="text-muted-foreground">
                Fill out this form and our partnership team will get back to you within 24 hours.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company Name *</label>
                    <Input 
                      placeholder="Your company name"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Contact Person *</label>
                    <Input 
                      placeholder="Your full name"
                      value={formData.contactName}
                      onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email Address *</label>
                    <Input 
                      type="email"
                      placeholder="your.email@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone Number</label>
                    <Input 
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Business Type *</label>
                    <Select value={formData.businessType} onValueChange={(value) => setFormData({...formData, businessType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">Hotel/Resort</SelectItem>
                        <SelectItem value="tour-operator">Tour Operator</SelectItem>
                        <SelectItem value="activity-provider">Activity Provider</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="travel-agency">Travel Agency</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Website</label>
                    <Input 
                      placeholder="https://yourwebsite.com"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Business Description *</label>
                  <Textarea 
                    placeholder="Tell us about your business, services, and what makes you unique..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-travel-ocean hover:bg-travel-ocean/90">
                  Submit Partnership Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Questions About Partnership?</h2>
          <p className="text-muted-foreground mb-6">
            Our partnership team is here to help you get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline">
              Schedule a Call
            </Button>
            <Button variant="outline">
              Download Partnership Guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersPage;
