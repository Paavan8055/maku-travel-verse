
import { useState } from "react";
import { Rocket, Zap, Globe, Heart, Star, Calendar, Users, Brain, Sparkles, MapPin, Plane, Building2, Shield, TrendingUp, CheckCircle, Clock, ArrowRight, Target, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  quarter: string;
  year: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'planned' | 'future';
  category: 'platform' | 'community' | 'ai' | 'mobile' | 'partnerships';
  impact: string;
  features: string[];
}

const roadmapData: RoadmapItem[] = [
  {
    id: '1',
    title: 'Core Travel Platform Launch',
    description: 'Launch our foundational booking platform with hotel and flight search powered by Amadeus and Hotelbeds APIs.',
    quarter: 'Q4',
    year: '2024',
    progress: 85,
    status: 'in-progress',
    category: 'platform',
    impact: 'Foundation for all future features',
    features: ['Hotel Search', 'Flight Booking', 'User Authentication', 'Payment Processing']
  },
  {
    id: '2',
    title: 'Four-Way Marketplace Verticals',
    description: 'Introduce specialized travel experiences for Family, Solo, Pet-friendly, and Spiritual journeys.',
    quarter: 'Q1',
    year: '2025',
    progress: 60,
    status: 'in-progress',
    category: 'community',
    impact: 'Personalized travel experiences',
    features: ['Vertical Filtering', 'Curated Content', 'Specialized Recommendations', 'Community Features']
  },
  {
    id: '3',
    title: 'Travel Fund Manager',
    description: 'AI-powered savings tool to help travelers budget and save for their dream trips.',
    quarter: 'Q2',
    year: '2025',
    progress: 30,
    status: 'planned',
    category: 'ai',
    impact: 'Financial empowerment for travelers',
    features: ['Smart Savings Goals', 'Price Alerts', 'Group Funding', 'Investment Options']
  },
  {
    id: '4',
    title: 'Maku AI Assistant',
    description: 'Launch our white Labrador mascot AI that provides personalized travel recommendations and support.',
    quarter: 'Q2',
    year: '2025',
    progress: 40,
    status: 'planned',
    category: 'ai',
    impact: 'Enhanced user experience',
    features: ['Natural Language Queries', 'Personalized Suggestions', 'Real-time Support', 'Trip Planning']
  },
  {
    id: '5',
    title: 'Partner Ecosystem Expansion',
    description: 'Onboard 1000+ hotels, activity providers, and local experiences across key destinations.',
    quarter: 'Q3',
    year: '2025',
    progress: 20,
    status: 'planned',
    category: 'partnerships',
    impact: 'Expanded inventory and local experiences',
    features: ['Partner Portal', 'Revenue Sharing', 'Quality Assurance', 'Performance Analytics']
  },
  {
    id: '6',
    title: 'Mobile App Launch',
    description: 'Native iOS and Android apps with offline capabilities and mobile-first features.',
    quarter: 'Q3',
    year: '2025',
    progress: 15,
    status: 'planned',
    category: 'mobile',
    impact: 'Mobile-first travel experiences',
    features: ['Offline Maps', 'Mobile Check-in', 'Push Notifications', 'Camera Integration']
  },
  {
    id: '7',
    title: 'Global Expansion',
    description: 'Expand to 50+ countries with localized content, currency, and payment methods.',
    quarter: 'Q4',
    year: '2025',
    progress: 5,
    status: 'future',
    category: 'platform',
    impact: 'Global reach and accessibility',
    features: ['Multi-currency', 'Localization', 'Regional Partnerships', 'Compliance']
  },
  {
    id: '8',
    title: 'Sustainability Tracking',
    description: 'Carbon footprint tracking and sustainable travel options integrated into all bookings.',
    quarter: 'Q1',
    year: '2026',
    progress: 0,
    status: 'future',
    category: 'platform',
    impact: 'Responsible travel leadership',
    features: ['Carbon Calculator', 'Eco-certified Options', 'Offset Programs', 'Green Rewards']
  }
];

const categoryConfig = {
  platform: { icon: Rocket, color: 'from-travel-ocean to-travel-sky', label: 'Platform' },
  community: { icon: Users, color: 'from-travel-coral to-travel-sunset', label: 'Community' },
  ai: { icon: Brain, color: 'from-travel-gold to-travel-sunset', label: 'AI & Tech' },
  mobile: { icon: Globe, color: 'from-travel-forest to-travel-ocean', label: 'Mobile' },
  partnerships: { icon: Building2, color: 'from-travel-sky to-travel-coral', label: 'Partnerships' }
};

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
  'in-progress': { icon: Zap, color: 'text-travel-gold', bg: 'bg-travel-gold/10', label: 'In Progress' },
  planned: { icon: Target, color: 'text-travel-ocean', bg: 'bg-travel-ocean/10', label: 'Planned' },
  future: { icon: Compass, color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'Future' }
};

const RoadmapPage = () => {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredRoadmap = roadmapData.filter(item => {
    const yearMatch = selectedYear === "all" || item.year === selectedYear;
    const categoryMatch = selectedCategory === "all" || item.category === selectedCategory;
    return yearMatch && categoryMatch;
  });

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-travel-gold";
    if (progress >= 20) return "bg-travel-ocean";
    return "bg-muted";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-gradient-to-r from-travel-gold to-travel-sunset">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <Badge className="bg-gradient-to-r from-travel-ocean to-travel-forest text-white text-lg px-4 py-2">
              Building the Future
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Our <span className="hero-text bg-gradient-to-r from-travel-gold via-travel-coral to-travel-sunset bg-clip-text text-transparent">Journey</span> Ahead
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
            Discover how we're revolutionizing travel technology. From AI-powered recommendations to 
            sustainable travel solutions, explore our roadmap to creating the world's most personalized 
            travel platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-travel-ocean to-travel-forest hover:shadow-floating">
              <Users className="mr-2 h-5 w-5" />
              Join Our Journey
            </Button>
            <Button size="lg" variant="outline" className="hover:bg-travel-gold/5 hover:border-travel-gold">
              <Calendar className="mr-2 h-5 w-5" />
              Subscribe to Updates
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Tabs value={selectedYear} onValueChange={setSelectedYear} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-4 md:w-auto">
              <TabsTrigger value="all">All Years</TabsTrigger>
              <TabsTrigger value="2024">2024</TabsTrigger>
              <TabsTrigger value="2025">2025</TabsTrigger>
              <TabsTrigger value="2026">2026</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 md:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                  <config.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Roadmap Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-travel-gold via-travel-coral to-travel-ocean hidden md:block"></div>
          
          <div className="space-y-8">
            {filteredRoadmap.map((item, index) => {
              const category = categoryConfig[item.category];
              const status = statusConfig[item.status];
              
              return (
                <div key={item.id} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-white border-4 border-travel-gold shadow-lg hidden md:block z-10"></div>
                  
                  <Card className="md:ml-16 hover:shadow-floating transition-all duration-300 group">
                    <CardHeader>
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color}`}>
                            <category.icon className="h-6 w-6 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                {item.title}
                              </CardTitle>
                              <Badge className={`${status.bg} ${status.color} border-0`}>
                                <status.icon className="mr-1 h-3 w-3" />
                                {status.label}
                              </Badge>
                            </div>
                            
                            <p className="text-muted-foreground mb-3">{item.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="mr-1 h-3 w-3" />
                                {item.quarter} {item.year}
                              </Badge>
                              <Badge className={`text-xs bg-gradient-to-r ${category.color} text-white`}>
                                {category.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-muted-foreground">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>

                        {/* Impact */}
                        <div className="p-3 rounded-lg bg-gradient-to-r from-travel-gold/5 to-travel-sunset/5 border border-travel-gold/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="h-4 w-4 text-travel-gold" />
                            <span className="text-sm font-medium text-travel-gold">Impact</span>
                          </div>
                          <p className="text-sm">{item.impact}</p>
                        </div>

                        {/* Features */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {item.features.map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="mt-16 bg-gradient-to-r from-travel-ocean/10 via-travel-sky/10 to-travel-coral/10 border-travel-ocean/20">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Heart className="h-8 w-8 text-travel-coral" />
              <Sparkles className="h-8 w-8 text-travel-gold" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Shape Our Journey Together</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Your feedback drives our innovation. Join our community of travelers and partners 
              to help us build the future of travel technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-travel-coral to-travel-sunset hover:shadow-floating">
                <Users className="mr-2 h-5 w-5" />
                Join Our Community
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="hover:bg-travel-ocean/5 hover:border-travel-ocean">
                <Rocket className="mr-2 h-5 w-5" />
                Become a Partner
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoadmapPage;
