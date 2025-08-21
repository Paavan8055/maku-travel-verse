
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
      title: "Maku.travel Launches Revolutionary Four-Way Travel Marketplace",
      date: "2025-01-15",
      category: "Product Launch",
      excerpt: "Introducing specialized marketplaces for Family, Solo, Pet, and Spiritual travel experiences with AI-powered personalization.",
      featured: true
    },
    {
      id: 2,
      title: "Maku.travel Secures Series A Funding to Expand Global Reach",
      date: "2024-12-10",
      category: "Funding",
      excerpt: "Leading travel tech investors back Maku's vision for personalized travel experiences across four specialized verticals."
    },
    {
      id: 3,
      title: "Partnership with Global Hotel Chains Announced",
      date: "2024-11-22",
      category: "Partnerships",
      excerpt: "Strategic partnerships with major hotel chains to offer exclusive rates and experiences for pet-friendly and spiritual travel."
    },
    {
      id: 4,
      title: "Maku.travel Wins 'Best Travel Innovation' Award",
      date: "2024-10-08",
      category: "Awards",
      excerpt: "Recognized for innovative approach to specialized travel marketplace and AI-powered travel recommendations."
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
                  <p className="text-muted-foreground">2024</p>
                </div>
                <div>
                  <h4 className="font-semibold">Headquarters</h4>
                  <p className="text-muted-foreground">Sydney, Australia</p>
                </div>
                <div>
                  <h4 className="font-semibold">Specialization</h4>
                  <p className="text-muted-foreground">Four-way travel marketplace (Family, Solo, Pet, Spiritual)</p>
                </div>
                <div>
                  <h4 className="font-semibold">Technology</h4>
                  <p className="text-muted-foreground">AI-powered travel recommendations</p>
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
