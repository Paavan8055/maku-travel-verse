
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Download, ExternalLink } from "lucide-react";

const Press = () => {
  const pressReleases = [
    {
      id: 1,
      title: "Maku.travel Announces Soft Launch Date and Four-Way Travel Marketplace Vision",
      date: "2025-07-15",
      category: "Company News",
      excerpt: "Australian travel tech startup announces September 9, 2025 soft launch of unique marketplace focused on Family, Solo, Pet-friendly, and Spiritual travel experiences.",
      featured: true
    },
    {
      id: 2,
      title: "Australian Travel Tech Startup Maku.travel Completes MVP Development",
      date: "2025-06-20",
      category: "Product Development",
      excerpt: "Sydney-based startup successfully completes core platform development, introducing innovative approach to specialized travel verticals with plans for blockchain integration."
    },
    {
      id: 3,
      title: "Maku.travel Founder Announces Vision for Blockchain-Powered Travel Platform",
      date: "2025-05-10",
      category: "Innovation",
      excerpt: "Startup reveals ambitious roadmap including crypto payments, AI-powered travel fund manager, and revolutionary hotel bidding platform using smart contracts."
    },
    {
      id: 4,
      title: "Sydney Startup Maku.travel Begins Beta Testing for Specialized Travel Marketplace",
      date: "2025-04-08",
      category: "Product Testing",
      excerpt: "Early beta users provide positive feedback on unique four-way marketplace approach, validating demand for specialized travel experiences in Australian market."
    }
  ];

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
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-travel-ocean to-travel-sunset py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Press & Media
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              Latest news, announcements, and media resources from Maku.travel
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Press Releases */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-8">Latest Press Releases</h2>
            
            <div className="space-y-6">
              {pressReleases.map((release) => (
                <Card key={release.id} className={`${release.featured ? 'border-travel-ocean shadow-lg' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={release.featured ? "default" : "secondary"}>
                            {release.category}
                          </Badge>
                          {release.featured && (
                            <Badge className="bg-travel-sunset text-white">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl md:text-2xl mb-2">
                          {release.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(release.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{release.excerpt}</p>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Read Full Release
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Media Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Media Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Press Inquiries</h4>
                  <p className="text-muted-foreground">press@maku.travel</p>
                </div>
                <div>
                  <h4 className="font-semibold">Partnership Inquiries</h4>
                  <p className="text-muted-foreground">partnerships@maku.travel</p>
                </div>
                <div>
                  <h4 className="font-semibold">General Media</h4>
                  <p className="text-muted-foreground">media@maku.travel</p>
                </div>
              </CardContent>
            </Card>

            {/* Media Kit */}
            <Card>
              <CardHeader>
                <CardTitle>Media Kit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mediaKit.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.type} • {item.size}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Facts */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Founded</h4>
                  <p className="text-muted-foreground">2024 (Development Phase)</p>
                </div>
                <div>
                  <h4 className="font-semibold">Soft Launch</h4>
                  <p className="text-muted-foreground">September 9, 2025</p>
                </div>
                <div>
                  <h4 className="font-semibold">Headquarters</h4>
                  <p className="text-muted-foreground">Sydney, Australia</p>
                </div>
                <div>
                  <h4 className="font-semibold">Market Focus</h4>
                  <p className="text-muted-foreground">Australia (2025), India expansion (2026)</p>
                </div>
                <div>
                  <h4 className="font-semibold">Specialization</h4>
                  <p className="text-muted-foreground">Four-way travel marketplace (Family, Solo, Pet, Spiritual)</p>
                </div>
                <div>
                  <h4 className="font-semibold">Stage</h4>
                  <p className="text-muted-foreground">Pre-seed startup in beta testing</p>
                </div>
                <div>
                  <h4 className="font-semibold">Innovation Focus</h4>
                  <p className="text-muted-foreground">Blockchain payments, AI assistant, DeFi travel savings</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Press;
