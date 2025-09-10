import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Monitor, Smartphone, Tablet, Globe, Zap } from 'lucide-react';

const Demo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Live Demo Center - Try Maku.travel | Maku.travel</title>
        <meta name="description" content="Experience Maku.travel's AI-powered travel platform with interactive demos. Try our features before you book." />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <Play className="h-20 w-20 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Live Demo Center
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the future of travel booking. Try our AI-powered features with interactive demos.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Play className="h-4 w-4 mr-2" />
              Start Demo
            </Button>
          </div>
        </section>

        {/* Demo Categories */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Interactive Demos</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "AI Assistant Demo",
                  description: "Chat with our AI assistant and see how it helps plan your perfect trip.",
                  duration: "3 min"
                },
                {
                  icon: Globe,
                  title: "Search Experience",
                  description: "Try our intelligent search that finds exactly what you're looking for.",
                  duration: "5 min"
                },
                {
                  icon: Monitor,
                  title: "Booking Flow",
                  description: "Experience our streamlined booking process from search to confirmation.",
                  duration: "7 min"
                },
                {
                  icon: Smartphone,
                  title: "Mobile Experience",
                  description: "See how Maku.travel works perfectly on your mobile device.",
                  duration: "4 min"
                },
                {
                  icon: Tablet,
                  title: "Multi-Device Sync",
                  description: "Start on one device and continue on another seamlessly.",
                  duration: "6 min"
                },
                {
                  icon: Play,
                  title: "Full Platform Tour",
                  description: "Complete walkthrough of all Maku.travel features and capabilities.",
                  duration: "15 min"
                }
              ].map((demo, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <demo.icon className="h-12 w-12 mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">{demo.title}</h3>
                    <p className="text-muted-foreground mb-4">{demo.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{demo.duration}</span>
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Try Demo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Demo */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Demo</h2>
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <div className="text-center">
                  <Play className="h-24 w-24 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-semibold mb-2">AI-Powered Trip Planning</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Watch our AI assistant plan a complete European vacation in under 2 minutes.
                  </p>
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    <Play className="h-4 w-4 mr-2" />
                    Play Featured Demo
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Schedule Demo */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Want a Personalized Demo?</h2>
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <Monitor className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Schedule a Live Demo</h3>
                <p className="text-muted-foreground mb-6">
                  Book a personalized demo session with our team to explore features specific to your travel needs.
                </p>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Schedule Demo Call
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Demo;