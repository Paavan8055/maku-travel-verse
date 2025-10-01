import React from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EnhancedProviderShowcase from "@/components/providers/EnhancedProviderShowcase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EnhancedProvidersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Enhanced Provider Integration
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Experience our expanded ecosystem with Expedia, Nuitée, and GetYourGuide
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <span>🛫 Expedia Flights</span>
            <span>🏨 Expedia + Nuitée Hotels</span>
            <span>🎭 GetYourGuide Activities</span>
          </div>
        </div>

        {/* Enhanced Provider Showcase */}
        <EnhancedProviderShowcase />

        {/* Integration Overview */}
        <div className="mt-12 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>What's New in Our Provider Ecosystem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Enhanced Flight Search</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✈️ <strong>Expedia Flights:</strong> Access to 700+ airlines with real-time pricing</li>
                    <li>🎯 <strong>Advanced Options:</strong> Seat selection, baggage choices, fare flexibility</li>
                    <li>🔄 <strong>Provider Rotation:</strong> Intelligent failover for maximum availability</li>
                    <li>📊 <strong>Performance Monitoring:</strong> Real-time health tracking and optimization</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-purple-600">Premium Hotel Selection</h3>
                  <ul className="space-y-2 text-sm">
                    <li>🏨 <strong>Expedia Hotels:</strong> 700,000+ properties worldwide</li>
                    <li>💎 <strong>Nuitée Boutique:</strong> Curated luxury and boutique accommodations</li>
                    <li>🔔 <strong>Enhanced Services:</strong> Concierge support and flexible booking</li>
                    <li>⚡ <strong>Instant Booking:</strong> Real-time availability and confirmation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity & Experience Revolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">GetYourGuide Activities</h4>
                  <ul className="space-y-1 text-sm">
                    <li>🎭 200,000+ experiences</li>
                    <li>📱 Mobile tickets</li>
                    <li>👥 Expert local guides</li>
                    <li>✅ Instant confirmation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Enhanced Features</h4>
                  <ul className="space-y-1 text-sm">
                    <li>🎯 Smart recommendations</li>
                    <li>📍 Location-based discovery</li>
                    <li>⭐ Verified reviews</li>
                    <li>💰 Best price guarantee</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">Integration Benefits</h4>
                  <ul className="space-y-1 text-sm">
                    <li>🔄 Multi-provider comparison</li>
                    <li>⚡ Parallel search processing</li>
                    <li>🛡️ Automatic failover</li>
                    <li>📊 Performance optimization</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Provider Orchestration</h4>
                  <ul className="space-y-2 text-sm">
                    <li>🔄 <strong>Intelligent Rotation:</strong> Round-robin with health-based selection</li>
                    <li>📊 <strong>Performance Tracking:</strong> Response time and error rate monitoring</li>
                    <li>🔧 <strong>Auto-Failover:</strong> Seamless provider switching on failures</li>
                    <li>⚙️ <strong>Configuration Management:</strong> Centralized via Supabase</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Multi-Backend AI</h4>
                  <ul className="space-y-2 text-sm">
                    <li>🤖 <strong>Provider Selection:</strong> Emergent, OpenAI, Hugging Face</li>
                    <li>💰 <strong>Cost Optimization:</strong> Intelligent free/paid routing</li>
                    <li>🔄 <strong>Fallback System:</strong> Rule-based responses when AI unavailable</li>
                    <li>📈 <strong>Usage Analytics:</strong> Token usage and cost tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EnhancedProvidersPage;