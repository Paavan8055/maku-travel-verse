import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Hotel, 
  Plane, 
  Car, 
  MapPin, 
  Star, 
  Shield, 
  Clock, 
  Globe,
  Zap,
  Award,
  Users,
  TrendingUp
} from 'lucide-react';

interface ExpediaShowcaseProps {
  variant?: 'full' | 'compact';
}

const ExpediaShowcase: React.FC<ExpediaShowcaseProps> = ({ variant = 'full' }) => {
  const [activeService, setActiveService] = useState('hotels');

  const serviceStats = {
    hotels: {
      icon: Hotel,
      name: 'Hotels & Accommodations',
      inventory: '700,000+ Properties',
      coverage: '250,000+ Destinations',
      features: ['EPS Rapid API', 'Real-time availability', 'Instant confirmation', 'Rate guarantees'],
      color: 'bg-blue-500'
    },
    flights: {
      icon: Plane,
      name: 'Flight Booking',
      inventory: 'Global Airline Network',
      coverage: 'Worldwide Routes',
      features: ['One-way flights', 'Round-trip booking', 'Multi-city itineraries', 'Seat selection'],
      color: 'bg-green-500'
    },
    cars: {
      icon: Car,
      name: 'Car Rentals',
      inventory: '110+ Car Rental Brands',
      coverage: '190+ Countries',
      features: ['Economy to luxury', 'One-way rentals', 'Airport pickups', 'Insurance options'],
      color: 'bg-purple-500'
    },
    activities: {
      icon: MapPin,
      name: 'Activities & Experiences',
      inventory: '170,000+ Experiences',
      coverage: 'Global Destinations',
      features: ['Tours & activities', 'Skip-the-line tickets', 'Local experiences', 'Adventure activities'],
      color: 'bg-orange-500'
    }
  };

  if (variant === 'compact') {
    return (
      <Card className="w-full bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Expedia Group</CardTitle>
                <CardDescription className="text-sm text-gray-600">Comprehensive Travel Platform</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <Award className="w-3 h-3 mr-1" />
              96.2 Score
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {Object.entries(serviceStats).map(([key, service]) => {
              const IconComponent = service.icon;
              return (
                <div key={key} className="flex items-center space-x-2 p-2 rounded-lg bg-white/60 border border-gray-200">
                  <div className={`w-8 h-8 ${service.color} rounded-md flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{service.name}</p>
                    <p className="text-xs text-gray-600 truncate">{service.inventory}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>24/7 Support</span>
            </div>
          </div>
          <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Explore Services
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
              Expedia Group Integration
            </h1>
            <p className="text-lg text-gray-600">Complete Travel Ecosystem at Your Fingertips</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-6">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
            <Award className="w-4 h-4 mr-2" />
            Performance Score: 96.2
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
            <Zap className="w-4 h-4 mr-2" />
            Real-time Booking
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1">
            <Shield className="w-4 h-4 mr-2" />
            Enterprise Grade
          </Badge>
        </div>
      </div>

      {/* Services Tabs */}
      <Tabs value={activeService} onValueChange={setActiveService} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          {Object.entries(serviceStats).map(([key, service]) => {
            const IconComponent = service.icon;
            return (
              <TabsTrigger 
                key={key} 
                value={key} 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">{service.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(serviceStats).map(([key, service]) => {
          const IconComponent = service.icon;
          return (
            <TabsContent key={key} value={key}>
              <Card className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-blue-100">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${service.color} rounded-lg flex items-center justify-center shadow-md`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900">{service.name}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {service.inventory} • {service.coverage}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Features List */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Key Features</h3>
                      <div className="space-y-3">
                        {service.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats & Info */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Service Stats</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/60 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">Availability</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">99.9%</p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">Partners</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">Global</p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-900">Response</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">&lt; 2s</p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-gray-900">Rating</span>
                          </div>
                          <p className="text-2xl font-bold text-orange-600">4.8/5</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center space-x-4 mt-8">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
                    >
                      Test {service.name}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      View Documentation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Integration Benefits */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-900">Why Expedia Group Integration?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Global Reach</h3>
              <p className="text-gray-600">Access to millions of travel options worldwide with comprehensive coverage across all major destinations.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Real-time Performance</h3>
              <p className="text-gray-600">Lightning-fast searches and instant bookings with real-time availability and competitive pricing.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Enterprise Security</h3>
              <p className="text-gray-600">Bank-level security with encrypted transactions and comprehensive fraud protection for all bookings.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpediaShowcase;