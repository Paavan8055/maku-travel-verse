import { useState, useEffect } from "react";
import { Building2, Users, TrendingUp, Shield, Globe, Heart, CheckCircle, ArrowRight, Zap, Activity, BarChart3, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { TravelTechMetrics } from "@/components/dashboard/TravelTechMetrics";
import { RealTimeFeeds } from "@/components/dashboard/RealTimeFeeds";
import { StartupMetrics } from "@/components/startup/StartupMetrics";
import { PartnerAnalytics } from "@/components/startup/PartnerAnalytics";
import { InnovationRoadmap } from "@/components/startup/InnovationRoadmap";

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
  const [partnerMetrics, setPartnerMetrics] = useState({
    totalPartners: 2847,
    monthlyGrowth: 23,
    totalBookings: 45673,
    revenue: 2.4,
    satisfaction: 96
  });

  useEffect(() => {
    // Simulate real-time partner metrics updates
    const interval = setInterval(() => {
      setPartnerMetrics(prev => ({
        ...prev,
        totalBookings: prev.totalBookings + Math.floor(Math.random() * 5),
        revenue: prev.revenue + (Math.random() - 0.5) * 0.1
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const partnerTypes = [
    {
      icon: Building2,
      title: "Hotels & Accommodations",
      description: "Join us as we build direct partnerships with properties",
      benefits: ["Lower commission fees", "Direct guest relationships", "Early partner benefits"],
      color: "bg-travel-ocean"
    },
    {
      icon: Globe,
      title: "Activity Providers",
      description: "Showcase unique experiences on our growing platform",
      benefits: ["Direct bookings", "Better margins", "Early adopter advantage"],
      color: "bg-travel-sky"
    },
    {
      icon: Users,
      title: "Travel Content Creators",
      description: "Earn commissions by sharing authentic travel experiences",
      benefits: ["Referral earnings", "Content monetization", "Community building"],
      color: "bg-travel-coral"
    },
    {
      icon: TrendingUp,
      title: "Technology Partners",
      description: "Help us build the future of travel technology",
      benefits: ["API access", "Revenue sharing", "Shape development"],
      color: "bg-travel-forest"
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Early Partner Advantages",
      description: "Join us early and shape the platform while getting preferential terms"
    },
    {
      icon: Users,
      title: "Direct Relationships",
      description: "Build connections with customers without traditional OTA intermediaries"
    },
    {
      icon: Zap,
      title: "Modern Technology",
      description: "Access cutting-edge travel tech built from the ground up"
    },
    {
      icon: Heart,
      title: "Community Growth",
      description: "Benefit from our traveler referral network and content creators"
    }
  ];

  const existingPartners = [
    { name: "Amadeus", logo: "🔗", category: "API Partner" },
    { name: "Hotelbeds", logo: "🏨", category: "API Partner" },
    { name: "Travelport", logo: "💬", category: "In Discussion" }
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
        {/* Modern Tech Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-travel-gold" />
            <Badge className="bg-gradient-to-r from-travel-gold to-travel-sunset text-white">
              Powered by AI
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Join the <span className="hero-text">Journey</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
            We're building the next generation of travel technology from the ground up. 
            Partner with us early and help shape the future while growing together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-travel-ocean to-travel-forest hover:shadow-floating">
              <Zap className="mr-2 h-4 w-4" />
              Become a Partner
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto" aria-label="Open Partner Portal">
              <Link to="/partner-portal">
                <Activity className="mr-2 h-4 w-4" />
                Partner Portal Login
              </Link>
            </Button>
          </div>
          
          {/* Live Partner Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-travel-ocean/10 to-travel-forest/10">
              <p className="text-2xl font-bold text-travel-ocean">{partnerMetrics.totalPartners.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Active Partners</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-travel-gold/10 to-travel-sunset/10">
              <p className="text-2xl font-bold text-travel-gold">+{partnerMetrics.monthlyGrowth}%</p>
              <p className="text-sm text-muted-foreground">Monthly Growth</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-travel-coral/10 to-travel-pink/10">
              <p className="text-2xl font-bold text-travel-coral">{partnerMetrics.totalBookings.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-travel-forest/10 to-travel-ocean/10">
              <p className="text-2xl font-bold text-travel-forest">${partnerMetrics.revenue.toFixed(1)}M</p>
              <p className="text-sm text-muted-foreground">Partner Revenue</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-travel-sky/10 to-travel-ocean/10">
              <p className="text-2xl font-bold text-travel-sky">{partnerMetrics.satisfaction}%</p>
              <p className="text-sm text-muted-foreground">Satisfaction</p>
            </div>
          </div>
        </div>

        {/* Modern Dashboard Tabs */}
        <Tabs defaultValue="overview" className="mb-16">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Roadmap
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-time
            </TabsTrigger>
            <TabsTrigger value="apply" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Apply
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <StartupMetrics className="mb-8" />
          </TabsContent>

          <TabsContent value="analytics">
            <PartnerAnalytics className="mb-8" />
          </TabsContent>

          <TabsContent value="roadmap">
            <InnovationRoadmap className="mb-8" />
          </TabsContent>

          <TabsContent value="realtime">
            <RealTimeFeeds className="mb-8" />
          </TabsContent>

          <TabsContent value="apply">
            <div className="max-w-4xl mx-auto">

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
          <h2 className="text-3xl font-bold text-center mb-8">Current Technology Partners</h2>
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

              <Card className="travel-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl flex items-center gap-2 justify-center">
                    <Zap className="h-6 w-6 text-travel-gold" />
                    Smart Partnership Application
                  </CardTitle>
                  <p className="text-muted-foreground">
                    AI-powered application processing - get approved in 24 hours with our intelligent review system.
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

                <Button type="submit" className="w-full bg-gradient-to-r from-travel-ocean to-travel-forest hover:shadow-floating hover:scale-105 transition-all">
                  <Zap className="mr-2 h-4 w-4" />
                  Submit Smart Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modern Tech Contact Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4 flex items-center gap-2 justify-center">
            <Heart className="h-6 w-6 text-travel-coral" />
            Questions About Partnership?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our AI-powered partnership team is here to help you get started. Get instant answers or schedule a personalized consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="hover:bg-travel-ocean/5 hover:border-travel-ocean">
              <Activity className="mr-2 h-4 w-4" />
              Schedule AI Consultation
            </Button>
            <Button variant="outline" className="hover:bg-travel-gold/5 hover:border-travel-gold">
              <BarChart3 className="mr-2 h-4 w-4" />
              Download Smart Guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersPage;
