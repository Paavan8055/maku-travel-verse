import { useState, useEffect } from "react";
import { Rocket, Zap, Globe, Heart, Star, Calendar, Users, Brain, Sparkles, MapPin, Plane, Building2, Shield, TrendingUp, CheckCircle, Clock, ArrowRight, Target, Compass, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  quarter: string;
  year: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'planned' | 'future';
  category: 'platform' | 'community' | 'ai' | 'mobile' | 'partnerships' | 'blockchain';
  impact: string;
  features: string[];
}

const roadmapData: RoadmapItem[] = [
  {
    id: '1',
    title: 'Journey Begins - Platform Foundation',
    description: 'Launch our MVP with core booking functionality. The starting point of our ambitious travel revolution.',
    quarter: 'June',
    year: '2025',
    progress: 100,
    status: 'completed',
    category: 'platform',
    impact: 'Foundation for all future innovations',
    features: ['Hotel Search', 'Flight Booking', 'User Authentication', 'Payment Processing']
  },
  {
    id: '2',
    title: 'Four-Way Marketplace Launch',
    description: 'Revolutionary vertical travel experiences for Family, Solo, Pet-friendly, and Spiritual journeys.',
    quarter: 'July',
    year: '2025',
    progress: 85,
    status: 'in-progress',
    category: 'community',
    impact: 'Personalized travel experiences',
    features: ['Vertical Filtering', 'Curated Content', 'Smart Recommendations', 'Community Hub']
  },
  {
    id: '3',
    title: 'Crypto Payment Integration',
    description: 'Accept Bitcoin, Ethereum, and MAKU tokens for seamless blockchain-powered transactions.',
    quarter: 'August',
    year: '2025',
    progress: 70,
    status: 'in-progress',
    category: 'blockchain',
    impact: 'Decentralized travel payments',
    features: ['Multi-crypto Support', 'MAKU Token', 'Instant Settlements', 'Low Fees']
  },
  {
    id: '4',
    title: 'Travel Fund Manager AI',
    description: 'AI-powered savings tool with DeFi integration to help travelers save and grow funds.',
    quarter: 'September',
    year: '2025',
    progress: 60,
    status: 'in-progress',
    category: 'ai',
    impact: 'Financial empowerment through DeFi',
    features: ['Smart Savings', 'Yield Farming', 'Staking Rewards', 'Price Predictions']
  },
  {
    id: '5',
    title: 'Maku AI Assistant',
    description: 'Our white Labrador mascot AI provides personalized recommendations with blockchain verification.',
    quarter: 'October',
    year: '2025',
    progress: 50,
    status: 'planned',
    category: 'ai',
    impact: 'Enhanced user experience with trust',
    features: ['Natural Language', 'Blockchain Verification', 'Real-time Support', 'Smart Contracts']
  },
  {
    id: '6',
    title: 'Hotel Bidding Platform',
    description: 'Revolutionary bidding system where hotels compete for bookings using smart contracts.',
    quarter: 'November',
    year: '2025',
    progress: 40,
    status: 'planned',
    category: 'blockchain',
    impact: 'Competitive pricing through bidding',
    features: ['Smart Contract Bidding', 'Real-time Auctions', 'Automated Settlements', 'Transparency']
  },
  {
    id: '7',
    title: 'Blockchain Travel Rewards',
    description: 'Decentralized loyalty program with NFT badges and token rewards for verified experiences.',
    quarter: 'December',
    year: '2025',
    progress: 30,
    status: 'planned',
    category: 'blockchain',
    impact: 'True ownership of travel rewards',
    features: ['NFT Badges', 'Token Rewards', 'Cross-platform Points', 'Verified Reviews']
  },
  {
    id: '8',
    title: 'Mobile App Launch',
    description: 'Native iOS and Android apps with crypto wallet integration and offline capabilities.',
    quarter: 'January',
    year: '2026',
    progress: 25,
    status: 'planned',
    category: 'mobile',
    impact: 'Mobile-first blockchain travel',
    features: ['Crypto Wallet', 'Offline Maps', 'NFC Payments', 'AR Features']
  },
  {
    id: '9',
    title: 'Partner Ecosystem Expansion',
    description: 'Onboard 1000+ verified partners with blockchain reputation and automated revenue sharing.',
    quarter: 'February',
    year: '2026',
    progress: 20,
    status: 'planned',
    category: 'partnerships',
    impact: 'Trusted partner network',
    features: ['Partner Portal', 'Smart Contracts', 'Reputation System', 'Automated Payouts']
  },
  {
    id: '10',
    title: 'NFT Travel Experiences',
    description: 'Unique blockchain-verified travel experiences as collectible NFTs with real-world utility.',
    quarter: 'March',
    year: '2026',
    progress: 15,
    status: 'future',
    category: 'blockchain',
    impact: 'Collectible travel memories',
    features: ['Experience NFTs', 'Resale Market', 'Utility Perks', 'Community Access']
  },
  {
    id: '11',
    title: 'DeFi Travel Savings',
    description: 'Advanced DeFi protocols for travel savings with yield farming and liquidity mining.',
    quarter: 'April',
    year: '2026',
    progress: 10,
    status: 'future',
    category: 'blockchain',
    impact: 'Travel finance revolution',
    features: ['Liquidity Mining', 'Yield Optimization', 'Travel Bonds', 'Insurance Protocols']
  },
  {
    id: '12',
    title: 'Global Expansion',
    description: 'Scale to 50+ countries with localized blockchain infrastructure and regulatory compliance.',
    quarter: 'May',
    year: '2026',
    progress: 5,
    status: 'future',
    category: 'platform',
    impact: 'Global blockchain travel network',
    features: ['Multi-currency', 'Compliance', 'Local Partnerships', 'Regional Tokens']
  }
];

const categoryConfig = {
  platform: { icon: Rocket, color: 'from-travel-ocean to-travel-sky', label: 'Platform' },
  community: { icon: Users, color: 'from-travel-coral to-travel-sunset', label: 'Community' },
  ai: { icon: Brain, color: 'from-travel-gold to-travel-sunset', label: 'AI & Tech' },
  mobile: { icon: Globe, color: 'from-travel-forest to-travel-ocean', label: 'Mobile' },
  partnerships: { icon: Building2, color: 'from-travel-sky to-travel-coral', label: 'Partnerships' },
  blockchain: { icon: Shield, color: 'from-purple-500 to-indigo-600', label: 'Blockchain' }
};

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
  'in-progress': { icon: Zap, color: 'text-travel-gold', bg: 'bg-travel-gold/10', label: 'In Progress' },
  planned: { icon: Target, color: 'text-travel-ocean', bg: 'bg-travel-ocean/10', label: 'Planned' },
  future: { icon: Compass, color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'Future' }
};

const RoadmapPage = () => {
  const { user, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const filteredRoadmap = roadmapData.filter(item => {
    const yearMatch = selectedYear === "all" || item.year === selectedYear;
    const categoryMatch = selectedCategory === "all" || item.category === selectedCategory;
    return yearMatch && categoryMatch;
  });

  // Auto-advance through timeline
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % filteredRoadmap.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, filteredRoadmap.length]);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-travel-gold";
    if (progress >= 20) return "bg-travel-ocean";
    return "bg-muted";
  };

  const handleJoinEarlyAccess = () => {
    if (user) {
      // User is already logged in, redirect to dashboard
      navigate('/dashboard');
    } else {
      // Show signup dialog
      setShowSignupDialog(true);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);

    try {
      const { error } = await signUp(
        signupData.email,
        signupData.password,
        {
          first_name: signupData.firstName,
          last_name: signupData.lastName
        }
      );

      if (error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome to Maku.travel!",
          description: "Your account has been created. Redirecting to dashboard..."
        });
        setShowSignupDialog(false);
        // Redirect to dashboard after successful signup
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-4 rounded-full bg-gradient-to-r from-travel-gold via-travel-coral to-travel-sunset animate-pulse-soft">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <Badge className="bg-gradient-to-r from-travel-ocean to-travel-forest text-white text-xl px-6 py-3 animate-float">
              Journey Begins June 2025
            </Badge>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-8 animate-fade-in">
            Interactive <span className="hero-text bg-gradient-to-r from-travel-gold via-travel-coral to-travel-sunset bg-clip-text text-transparent">Roadmap</span>
          </h1>
          
          <p className="text-2xl text-muted-foreground max-w-5xl mx-auto mb-12 leading-relaxed">
            From startup to global blockchain travel platform. Watch our ambitious journey unfold as we 
            revolutionize travel with AI, crypto payments, NFT experiences, and revolutionary bidding systems.
          </p>

          {/* Interactive Timeline Control */}
          <div className="flex items-center justify-center gap-6 mb-12">
            <Button 
              onClick={() => setIsPlaying(!isPlaying)}
              size="lg" 
              className="bg-gradient-to-r from-travel-coral to-travel-sunset hover:shadow-floating animate-scale-in"
            >
              {isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
              {isPlaying ? 'Pause Journey' : 'Play Journey'}
            </Button>
            <div className="text-sm text-muted-foreground bg-card px-4 py-2 rounded-full border">
              Step {currentStep + 1} of {filteredRoadmap.length}
            </div>
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
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 md:w-auto">
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

        {/* Interactive Roadmap Timeline */}
        <div className="relative">
          {/* Animated Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-travel-gold via-travel-coral to-travel-ocean hidden md:block rounded-full shadow-glow"></div>
          
          <div className="space-y-12">
            {filteredRoadmap.map((item, index) => {
              const category = categoryConfig[item.category];
              const status = statusConfig[item.status];
              const isActive = index === currentStep;
              const isCompleted = index < currentStep || item.status === 'completed';
              
              return (
                <div 
                  key={item.id} 
                  className={`relative transition-all duration-1000 ${isActive ? 'scale-105' : 'scale-100'}`}
                  onClick={() => setCurrentStep(index)}
                >
                  {/* Animated Timeline Dot */}
                  <div className={`absolute left-5 top-8 w-6 h-6 rounded-full border-4 shadow-lg hidden md:block z-10 cursor-pointer transition-all duration-500 ${
                    isActive 
                      ? 'bg-travel-gold border-travel-gold shadow-travel-gold/50 animate-pulse-soft scale-125' 
                      : isCompleted
                        ? 'bg-green-500 border-green-500 shadow-green-500/30'
                        : 'bg-white border-travel-ocean shadow-travel-ocean/20'
                  }`}>
                    {isActive && <div className="absolute inset-0 rounded-full bg-travel-gold animate-ping opacity-75"></div>}
                  </div>
                  
                  <Card className={`md:ml-20 transition-all duration-700 cursor-pointer group ${
                    isActive 
                      ? 'shadow-floating border-travel-gold bg-gradient-to-r from-travel-gold/5 to-travel-sunset/5' 
                      : 'hover:shadow-floating hover:border-travel-coral/50'
                  }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-start gap-6 flex-1">
                          <div className={`p-4 rounded-2xl bg-gradient-to-r ${category.color} transition-transform duration-300 ${
                            isActive ? 'animate-float' : 'group-hover:scale-110'
                          }`}>
                            <category.icon className="h-8 w-8 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <CardTitle className={`text-2xl transition-colors duration-300 ${
                                isActive ? 'text-travel-gold' : 'group-hover:text-primary'
                              }`}>
                                {item.title}
                              </CardTitle>
                              <Badge className={`${status.bg} ${status.color} border-0 px-3 py-1`}>
                                <status.icon className="mr-1 h-4 w-4" />
                                {status.label}
                              </Badge>
                            </div>
                            
                            <p className="text-muted-foreground mb-4 text-lg leading-relaxed">{item.description}</p>
                            
                            <div className="flex flex-wrap gap-3 mb-6">
                              <Badge variant="outline" className="text-sm px-3 py-1">
                                <Calendar className="mr-2 h-4 w-4" />
                                {item.quarter} {item.year}
                              </Badge>
                              <Badge className={`text-sm bg-gradient-to-r ${category.color} text-white px-3 py-1`}>
                                {category.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-6">
                        {/* Animated Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-base font-medium">Development Progress</span>
                            <span className="text-base text-muted-foreground font-mono">{item.progress}%</span>
                          </div>
                          <div className="relative">
                            <Progress value={item.progress} className="h-3" />
                            {isActive && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slideIn"></div>
                            )}
                          </div>
                        </div>

                        {/* Impact Highlight */}
                        <div className={`p-4 rounded-xl border transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-to-r from-travel-gold/10 to-travel-sunset/10 border-travel-gold/30' 
                            : 'bg-gradient-to-r from-travel-gold/5 to-travel-sunset/5 border-travel-gold/20'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Star className={`h-5 w-5 transition-colors duration-300 ${
                              isActive ? 'text-travel-gold animate-pulse-soft' : 'text-travel-gold'
                            }`} />
                            <span className="text-base font-medium text-travel-gold">Business Impact</span>
                          </div>
                          <p className="text-base">{item.impact}</p>
                        </div>

                        {/* Key Features */}
                        <div>
                          <h4 className="text-base font-medium mb-3">Key Features & Innovations</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {item.features.map((feature, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className={`text-sm p-2 justify-start transition-all duration-300 ${
                                  isActive ? 'hover:bg-travel-gold/10 hover:border-travel-gold' : ''
                                }`}
                              >
                                <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
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

          {/* Journey Progress Indicator */}
          <div className="mt-12 bg-card p-6 rounded-2xl border border-travel-gold/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Journey Progress</h3>
              <Badge className="bg-gradient-to-r from-travel-coral to-travel-sunset text-white">
                {Math.round(((currentStep + 1) / filteredRoadmap.length) * 100)}% Complete
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-travel-gold">{filteredRoadmap.filter(item => item.status === 'completed').length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-travel-coral">{filteredRoadmap.filter(item => item.status === 'in-progress').length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-travel-ocean">{filteredRoadmap.filter(item => item.status === 'planned').length}</div>
                <div className="text-sm text-muted-foreground">Planned</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-travel-forest">{filteredRoadmap.filter(item => item.status === 'future').length}</div>
                <div className="text-sm text-muted-foreground">Future</div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <Card className="mt-20 bg-gradient-to-r from-travel-ocean/10 via-travel-sky/10 to-travel-coral/10 border-travel-gold/30 shadow-floating">
          <CardContent className="p-12 text-center">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="p-3 rounded-full bg-gradient-to-r from-travel-coral to-travel-sunset animate-pulse-soft">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-travel-gold to-travel-sunset animate-float">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-travel-ocean to-travel-forest animate-pulse-soft">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-travel-gold via-travel-coral to-travel-sunset bg-clip-text text-transparent">
              Join the Blockchain Travel Revolution
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Be part of the future where travel meets blockchain technology. Early supporters get exclusive access to MAKU tokens, 
              NFT experiences, and revolutionary bidding features that will transform how the world travels.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-travel-coral to-travel-sunset hover:shadow-floating text-lg px-8 py-4"
                onClick={handleJoinEarlyAccess}
              >
                <Users className="mr-3 h-6 w-6" />
                Join Early Access
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button size="lg" variant="outline" className="hover:bg-travel-ocean/5 hover:border-travel-ocean text-lg px-8 py-4">
                <Shield className="mr-3 h-6 w-6" />
                Become a Blockchain Partner
              </Button>
            </div>
            <div className="mt-8 text-sm text-muted-foreground">
              🚀 Early supporters get bonus MAKU tokens • 🎯 Exclusive NFT experiences • ⚡ Priority bidding access
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signup Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-travel-gold via-travel-coral to-travel-sunset bg-clip-text text-transparent">
              Join Early Access
            </DialogTitle>
            <DialogDescription>
              Create your account to get exclusive access to MAKU tokens and blockchain travel features.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={signupData.firstName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={signupData.lastName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-travel-coral to-travel-sunset hover:opacity-90"
              disabled={signupLoading}
            >
              {signupLoading ? "Creating Account..." : "Join Early Access"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoadmapPage;
