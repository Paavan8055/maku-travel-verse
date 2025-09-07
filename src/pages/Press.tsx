import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Calendar, ArrowRight, Download, ExternalLink, Copy, Mail, 
  Share2, Clock, Users, Globe, Rocket, Star, TrendingUp,
  Image, Play, FileText, Award, MapPin, Heart
} from "lucide-react";
import { useState, useEffect } from "react";

const Press = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [copiedEmail, setCopiedEmail] = useState("");

  const pressReleases = [
    {
      id: 1,
      title: "Soft Beta Launch Date & Travel Eco-system Vision",
      date: "2025-07-15",
      category: "Company News",
      excerpt: "Australian travel tech startup announces September 9, 2025 soft beta launch of revolutionary travel ecosystem connecting specialized marketplaces, AI-powered planning, and sustainable travel solutions.",
      featured: true,
      readTime: "4 min read",
      fullText: "Melbourne, Australia - Maku.travel, an innovative Australian travel technology startup, today announced its official soft beta launch date of September 9, 2025, alongside the unveiling of its comprehensive travel ecosystem vision. The platform introduces a revolutionary approach that goes beyond traditional booking platforms, creating an interconnected travel ecosystem that includes four specialized marketplaces (Family adventures, Solo explorations, Pet-friendly journeys, and Spiritual travel experiences), AI-powered travel planning, sustainable tourism initiatives, and blockchain-integrated payment solutions. This ecosystem approach addresses the growing demand for personalized, responsible travel solutions in the Australian market while setting the foundation for global expansion. The soft beta launch will initially serve Australian travelers, with plans to gather real-world feedback and refine the platform's unique ecosystem approach before full public launch in Q1 2026. The company's vision extends beyond simple booking functionality to create a comprehensive travel companion that supports every aspect of the modern traveler's journey, from inspiration and planning to booking and post-travel sharing."
    },
    {
      id: 2,
      title: "Australian Travel Tech Startup Maku.travel Completes MVP Development",
      date: "2025-06-20",
      category: "Product Development",
      excerpt: "Sydney-based startup successfully completes core platform development, introducing innovative approach to specialized travel verticals with plans for blockchain integration.",
      readTime: "4 min read",
      fullText: "Sydney, Australia - Maku.travel has successfully completed development of its Minimum Viable Product (MVP), marking a significant milestone in the startup's journey to revolutionize the Australian travel industry. The platform introduces an innovative four-vertical approach that specifically addresses the unique needs of different traveler types..."
    },
    {
      id: 3,
      title: "Maku.travel Founder Announces Vision for Blockchain-Powered Travel Platform",
      date: "2025-05-10",
      category: "Innovation",
      excerpt: "Startup reveals ambitious roadmap including crypto payments, AI-powered travel fund manager, and revolutionary travel bidding platform using smart contracts.",
      readTime: "5 min read",
      fullText: "Sydney, Australia - The founder of Maku.travel today unveiled an ambitious vision for integrating blockchain technology into the travel industry, positioning the platform as a pioneer in Web3 travel solutions. The roadmap includes cryptocurrency payment options, an AI-powered travel fund manager, and a revolutionary travel bidding system powered by smart contracts..."
    },
    {
      id: 4,
      title: "Maku.travel Invites Australian Users to Beta Test Specialized Travel Marketplace",
      date: "2025-09-15",
      category: "Product Testing",
      excerpt: "Following successful soft launch, Maku.travel opens beta program for Australian travelers to experience and help refine the four-way marketplace approach.",
      readTime: "2 min read",
      fullText: "Sydney, Australia - Following its successful soft launch on September 9, Maku.travel is now inviting Australian travelers to participate in an exclusive beta testing program. This initiative aims to gather real-world feedback and refine the platform's unique four-way marketplace approach before the full public launch..."
    }
  ];

  const milestones = [
    { title: "Concept & Research", progress: 100, date: "Q4 2024" },
    { title: "MVP Development", progress: 100, date: "Q1-Q2 2025" },
    { title: "Soft Launch", progress: 90, date: "Sep 9, 2025" },
    { title: "Beta Testing", progress: 75, date: "Sep 15, 2025" },
    { title: "Public Launch", progress: 25, date: "Q1 2026" },
    { title: "India Expansion", progress: 10, date: "Q2 2026" }
  ];

  const mediaGallery = [
    { type: "image", src: "/lovable-uploads/49f86b14-baf6-497a-bd6a-24f68060b8ea.png", alt: "Maku.travel Platform Preview", caption: "Platform Interface Design" },
    { type: "image", src: "/api/placeholder/400/300", alt: "Team Photo", caption: "Maku.travel Team" },
    { type: "image", src: "/api/placeholder/400/300", alt: "Office Space", caption: "Sydney Headquarters" },
    { type: "video", src: "/api/placeholder/400/300", alt: "Product Demo", caption: "Platform Demo Video" }
  ];

  // Countdown to soft launch
  useEffect(() => {
    const targetDate = new Date("2025-09-09").getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance > 0) {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        });
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredReleases = activeTab === "all" 
    ? pressReleases 
    : pressReleases.filter(release => release.category.toLowerCase().replace(" ", "-") === activeTab);

  const copyToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(""), 2000);
  };

  const mediaKit = [
    {
      name: "Company Logo Pack",
      type: "ZIP",
      size: "2.4 MB",
      description: "High-res logos in various formats"
    },
    {
      name: "Executive Photos",
      type: "ZIP", 
      size: "5.1 MB",
      description: "Professional headshots of leadership team"
    },
    {
      name: "Product Screenshots",
      type: "ZIP",
      size: "8.2 MB", 
      description: "Marketing-ready app screenshots"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Enhanced Hero Section */}
      <section className="relative bg-gradient-to-br from-travel-ocean via-travel-forest to-travel-sunset py-20 overflow-hidden">
        {/* Floating Animation Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-16 h-16 bg-white rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-white rounded-full animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-5xl mx-auto text-center text-white">
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Press & Media Hub
              </h1>
              <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
                Latest news, breakthrough announcements, and media resources from Australia's most innovative travel marketplace
              </p>
            </div>
            
            {/* Countdown to Soft Launch */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 animate-scale-in">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
                <Rocket className="h-5 w-5" />
                Countdown to Soft Launch
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">{countdown.days}</div>
                  <div className="text-sm opacity-80">Days</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{countdown.hours}</div>
                  <div className="text-sm opacity-80">Hours</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{countdown.minutes}</div>
                  <div className="text-sm opacity-80">Minutes</div>
                </div>
              </div>
            </div>
            
            {/* Social Proof */}
            <div className="flex flex-wrap justify-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                500+ Beta Signups
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Australia Launch Ready
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Innovation in Travel Tech
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Media Gallery Carousel */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Media Gallery</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              High-quality images, videos, and resources for media coverage
            </p>
          </div>
          
          <Carousel className="max-w-5xl mx-auto">
            <CarouselContent>
              {mediaGallery.map((item, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="hover-scale group cursor-pointer">
                    <CardContent className="p-0 relative">
                      <div className="aspect-video bg-gradient-to-br from-travel-ocean/20 to-travel-sunset/20 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                        {item.type === "video" ? (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        ) : (
                          <Image className="h-16 w-16 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold">{item.caption}</h4>
                        <p className="text-sm text-muted-foreground">High resolution {item.type}</p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interactive Press Releases Timeline */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Press Releases</h2>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Share2 className="h-4 w-4 mr-2" />
                Share Page
              </Button>
            </div>
            
            {/* Category Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="company-news">Company</TabsTrigger>
                <TabsTrigger value="product-development">Product</TabsTrigger>
                <TabsTrigger value="innovation">Innovation</TabsTrigger>
                <TabsTrigger value="product-testing">Testing</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-6">
                {filteredReleases.map((release, index) => (
                  <Card 
                    key={release.id} 
                    className={`${release.featured ? 'border-travel-ocean shadow-lg bg-gradient-to-r from-travel-ocean/5 to-transparent' : ''} hover-scale group transition-all duration-300 animate-fade-in`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant={release.featured ? "default" : "secondary"}>
                              {release.category}
                            </Badge>
                            {release.featured && (
                              <Badge className="bg-travel-sunset text-white">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {release.readTime}
                            </div>
                          </div>
                          <CardTitle className="text-xl md:text-2xl mb-2 group-hover:text-travel-ocean transition-colors">
                            {release.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-muted-foreground text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(release.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 leading-relaxed">{release.excerpt}</p>
                      <div className="flex items-center gap-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 sm:flex-initial">
                              Read Full Release
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">{release.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground border-b pb-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(release.date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                <Badge variant="secondary">{release.category}</Badge>
                              </div>
                              <div className="prose max-w-none">
                                <p className="text-muted-foreground leading-relaxed">
                                  {release.fullText}
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Share release</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-8">
            {/* Interactive Media Contact */}
            <Card className="bg-gradient-to-br from-travel-ocean/5 to-travel-forest/5 border-travel-ocean/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Media Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Press Inquiries", email: "press@maku.travel", icon: FileText },
                  { title: "Partnership Inquiries", email: "partnerships@maku.travel", icon: Users },
                  { title: "General Media", email: "media@maku.travel", icon: Mail }
                ].map((contact, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-background transition-colors">
                      <div className="flex items-center gap-3">
                        <contact.icon className="h-4 w-4 text-travel-ocean" />
                        <div>
                          <h4 className="font-semibold text-sm">{contact.title}</h4>
                          <p className="text-muted-foreground text-sm">{contact.email}</p>
                        </div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => copyToClipboard(contact.email)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedEmail === contact.email ? (
                                <span className="text-green-600 text-xs">Copied!</span>
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy email</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
                
                {/* Press Inquiry Form */}
                <div className="mt-6 p-4 bg-background/50 rounded-lg border-dashed border-2 border-travel-ocean/20">
                  <h4 className="font-semibold mb-2 text-center">Quick Press Inquiry</h4>
                  <Button className="w-full bg-travel-ocean hover:bg-travel-ocean/90">
                    Send Press Kit Request
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Media Kit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Media Kit Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mediaKit.map((item, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-travel-ocean/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge variant="outline" className="text-xs">{item.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.size}</p>
                      </div>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Preview</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button size="sm" variant="outline" className="hover:bg-travel-ocean hover:text-white">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Company Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Development Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{milestone.title}</span>
                      <span className="text-muted-foreground">{milestone.date}</span>
                    </div>
                    <Progress value={milestone.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground text-right">
                      {milestone.progress}% Complete
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Enhanced Quick Facts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Company Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: MapPin, title: "Founded", value: "2024 (Development Phase)" },
                  { icon: Rocket, title: "Soft Launch", value: "September 9, 2025" },
                  { icon: MapPin, title: "Headquarters", value: "Sydney, Australia" },
                  { icon: Globe, title: "Market Focus", value: "Australia (2025), India expansion (2026)" },
                  { icon: Heart, title: "Specialization", value: "Four-way travel marketplace (Family, Solo, Pet, Spiritual)" },
                  { icon: TrendingUp, title: "Stage", value: "Startup in post-launch beta phase" },
                  { icon: Star, title: "Innovation Focus", value: "Blockchain payments, AI assistant, DeFi travel savings" }
                ].map((fact, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <fact.icon className="h-4 w-4 text-travel-ocean mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">{fact.title}</h4>
                      <p className="text-muted-foreground text-sm">{fact.value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Newsletter Signup */}
            <Card className="bg-gradient-to-br from-travel-sunset/10 to-travel-ocean/10 border-travel-sunset/20">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Stay Updated</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Get the latest press releases and company updates
                </p>
                <Button className="w-full bg-travel-sunset hover:bg-travel-sunset/90">
                  Subscribe to Press Updates
                  <Mail className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-r from-travel-ocean to-travel-forest py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Follow Our Journey?</h2>
            <p className="text-lg opacity-90 mb-8">
              Join hundreds of media professionals and travel enthusiasts tracking Maku.travel's innovation in specialized travel experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-travel-ocean hover:bg-white/90">
                Request Media Kit
                <Download className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-travel-ocean">
                Schedule Interview
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Press;
