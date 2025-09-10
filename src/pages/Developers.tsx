import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, BookOpen, Plug, Github, Key, Zap } from 'lucide-react';

const Developers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Developer Portal - Build with Maku.travel APIs | Maku.travel</title>
        <meta name="description" content="Integrate Maku.travel's powerful APIs into your applications. Access documentation, SDKs, and developer resources." />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <Code className="h-20 w-20 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Developer Portal
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Build amazing travel experiences with our comprehensive APIs. Access hotels, flights, activities, and AI-powered features.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <BookOpen className="h-4 w-4 mr-2" />
                View Documentation
              </Button>
              <Button size="lg" variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Get API Key
              </Button>
            </div>
          </div>
        </section>

        {/* API Features */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">API Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Plug,
                  title: "Travel Search API",
                  description: "Search hotels, flights, and activities with real-time availability and pricing."
                },
                {
                  icon: Zap,
                  title: "AI Recommendations",
                  description: "Leverage our AI engine to provide personalized travel recommendations."
                },
                {
                  icon: BookOpen,
                  title: "Booking Management",
                  description: "Create, modify, and cancel bookings programmatically with full control."
                },
                {
                  icon: Code,
                  title: "Webhooks",
                  description: "Receive real-time notifications for booking updates and system events."
                },
                {
                  icon: Github,
                  title: "SDKs & Libraries",
                  description: "Official SDKs for JavaScript, Python, PHP, and other popular languages."
                },
                {
                  icon: Key,
                  title: "Authentication",
                  description: "Secure API access with OAuth 2.0 and API key authentication methods."
                }
              ].map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Quick Start Example</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Hotel Search API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`// Search for hotels in Sydney
const response = await fetch('https://api.maku.travel/v1/hotels/search', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    destination: 'Sydney, Australia',
    checkin: '2025-06-01',
    checkout: '2025-06-05',
    guests: 2,
    rooms: 1
  })
});

const hotels = await response.json();
console.log(hotels.results);`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Resources */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Developer Resources</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "API Documentation",
                  description: "Complete API reference with examples",
                  link: "/api-docs"
                },
                {
                  title: "Integration Guide",
                  description: "Step-by-step integration tutorials",
                  link: "/integrations"
                },
                {
                  title: "SDKs & Tools",
                  description: "Official libraries and development tools",
                  link: "/developers/sdks"
                },
                {
                  title: "Support Forum",
                  description: "Get help from our developer community",
                  link: "/developers/forum"
                }
              ].map((resource, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{resource.description}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Developers;