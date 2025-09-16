import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Code, Search, CreditCard, Globe, Shield } from 'lucide-react';

const APIDocs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>API Documentation - Complete Reference | Maku.travel</title>
        <meta name="description" content="Complete API documentation for Maku.travel. Detailed reference guides, examples, and integration tutorials." />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="h-20 w-20 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              API Documentation
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Complete reference documentation for integrating Maku.travel APIs into your applications.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Code className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </div>
        </section>

        {/* API Sections */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">API Reference</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Search,
                  title: "Search APIs",
                  description: "Hotels, flights, and activities search endpoints with real-time data.",
                  endpoints: ["GET /v1/hotels/search", "GET /v1/flights/search", "GET /v1/activities/search"]
                },
                {
                  icon: CreditCard,
                  title: "Booking APIs",
                  description: "Create, manage, and cancel bookings programmatically.",
                  endpoints: ["POST /v1/bookings", "GET /v1/bookings/{id}", "PUT /v1/bookings/{id}"]
                },
                {
                  icon: Globe,
                  title: "Location APIs",
                  description: "Geographic data, destinations, and location-based services.",
                  endpoints: ["GET /v1/locations", "GET /v1/destinations", "GET /v1/geocode"]
                },
                {
                  icon: Shield,
                  title: "Authentication",
                  description: "Secure API access with OAuth 2.0 and API key management.",
                  endpoints: ["POST /v1/auth/token", "GET /v1/auth/verify", "POST /v1/auth/refresh"]
                },
                {
                  icon: Code,
                  title: "Webhooks",
                  description: "Real-time notifications for booking updates and events.",
                  endpoints: ["POST /v1/webhooks", "GET /v1/webhooks", "DELETE /v1/webhooks/{id}"]
                },
                {
                  icon: BookOpen,
                  title: "User Management",
                  description: "User profiles, preferences, and account management.",
                  endpoints: ["GET /v1/users/profile", "PUT /v1/users/profile", "GET /v1/users/bookings"]
                }
              ].map((section, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <section.icon className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{section.description}</p>
                    <div className="space-y-2">
                      {section.endpoints.map((endpoint, idx) => (
                        <code key={idx} className="block text-sm bg-muted p-2 rounded">
                          {endpoint}
                        </code>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Start Guide */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Quick Start Guide</h2>
            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Get Your API Key",
                  description: "Sign up for a developer account and generate your API key from the dashboard.",
                  code: `curl -X POST https://api.maku.travel/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email": "dev@example.com", "password": "password"}'`
                },
                {
                  step: "2",
                  title: "Make Your First Request",
                  description: "Test the API with a simple hotel search request.",
                  code: `curl -X GET "https://api.maku.travel/v1/hotels/search?destination=Sydney&checkin=2025-06-01&checkout=2025-06-05" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
                },
                {
                  step: "3",
                  title: "Handle the Response",
                  description: "Process the JSON response and integrate the data into your application.",
                  code: `{
  "results": [
    {
      "id": "hotel_123",
      "name": "Sydney Harbor Hotel",
      "price": 250,
      "currency": "AUD",
      "rating": 4.5
    }
  ]
}`
                }
              ].map((step, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground mb-4">{step.description}</p>
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    </div>
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

export default APIDocs;