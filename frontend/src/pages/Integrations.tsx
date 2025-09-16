import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plug, Zap, Settings, CheckCircle, Globe, Code } from 'lucide-react';

const Integrations = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Integration Hub - Connect Your Systems | Maku.travel</title>
        <meta name="description" content="Integrate Maku.travel with your existing systems. Pre-built connectors, webhooks, and custom integration solutions." />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <Plug className="h-20 w-20 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Integration Hub
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect Maku.travel with your existing systems. Pre-built integrations and custom solutions for seamless connectivity.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Plug className="h-4 w-4 mr-2" />
              Browse Integrations
            </Button>
          </div>
        </section>

        {/* Popular Integrations */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Popular Integrations</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Salesforce",
                  category: "CRM",
                  description: "Sync customer data and bookings with your Salesforce CRM.",
                  logo: "🏢",
                  status: "Available"
                },
                {
                  name: "Zapier",
                  category: "Automation",
                  description: "Connect to 5000+ apps with our Zapier integration.",
                  logo: "⚡",
                  status: "Available"
                },
                {
                  name: "Slack",
                  category: "Communication",
                  description: "Get booking notifications directly in your Slack channels.",
                  logo: "💬",
                  status: "Available"
                },
                {
                  name: "Shopify",
                  category: "E-commerce",
                  description: "Add travel booking capabilities to your Shopify store.",
                  logo: "🛒",
                  status: "Available"
                },
                {
                  name: "WordPress",
                  category: "CMS",
                  description: "WordPress plugin for travel agencies and bloggers.",
                  logo: "📝",
                  status: "Beta"
                },
                {
                  name: "HubSpot",
                  category: "Marketing",
                  description: "Track and nurture leads with HubSpot integration.",
                  logo: "📊",
                  status: "Coming Soon"
                }
              ].map((integration, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{integration.logo}</div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{integration.category}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{integration.description}</p>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        integration.status === 'Available' ? 'bg-green-100 text-green-800' :
                        integration.status === 'Beta' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {integration.status}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={integration.status === 'Coming Soon'}
                      >
                        {integration.status === 'Available' ? 'Install' : 
                         integration.status === 'Beta' ? 'Try Beta' : 'Notify Me'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Integration Types */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Integration Types</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Real-time APIs",
                  description: "Direct API connections for real-time data exchange"
                },
                {
                  icon: Settings,
                  title: "Webhooks",
                  description: "Event-driven notifications to your systems"
                },
                {
                  icon: Code,
                  title: "SDKs",
                  description: "Native libraries for popular programming languages"
                },
                {
                  icon: Globe,
                  title: "No-Code",
                  description: "Visual integrations without any coding required"
                }
              ].map((type, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <type.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">{type.title}</h3>
                    <p className="text-muted-foreground text-sm">{type.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Custom Integrations */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Need a Custom Integration?</h2>
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Enterprise Integration Services</h3>
                <p className="text-muted-foreground mb-6">
                  Our team can build custom integrations tailored to your specific business needs and existing technology stack.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="text-left">
                    <h4 className="font-semibold mb-2">What we provide:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Custom API development</li>
                      <li>• Data migration assistance</li>
                      <li>• Ongoing technical support</li>
                    </ul>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold mb-2">Timeline:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Simple integrations: 1-2 weeks</li>
                      <li>• Complex systems: 4-8 weeks</li>
                      <li>• Enterprise solutions: Custom</li>
                    </ul>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Contact Integration Team
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

export default Integrations;