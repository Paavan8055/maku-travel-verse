import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Hotel, TrendingUp, Wallet, Calendar, Users, DollarSign } from 'lucide-react';

export default function OffseasonPartnersPage() {
  const [formData, setFormData] = useState({
    hotelName: '',
    contactEmail: '',
    contactName: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Partner inquiry:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const benefits = [
    {
      icon: <TrendingUp className="w-8 h-8 text-orange-500" />,
      title: "Fill Empty Rooms",
      description: "Convert off-season inventory into revenue with smart demand matching"
    },
    {
      icon: <Users className="w-8 h-8 text-orange-500" />,
      title: "Reach New Travelers",
      description: "Access MAKU's community of flexible, budget-conscious travelers"
    },
    {
      icon: <DollarSign className="w-8 h-8 text-orange-500" />,
      title: "Control Your Discounts",
      description: "Set your own discount ranges (38-65%) and blackout dates"
    },
    {
      icon: <Calendar className="w-8 h-8 text-orange-500" />,
      title: "Flexible Campaigns",
      description: "Create multiple campaigns for different seasons and audiences"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Define Your Off-Season",
      description: "Set date ranges, room allocations, and discount levels for your low-occupancy periods"
    },
    {
      step: "2",
      title: "Match with Travelers",
      description: "Our AI matches your inventory with travelers' dream destinations and budgets"
    },
    {
      step: "3",
      title: "Automatic Booking",
      description: "Qualified travelers receive personalized offers with 48-hour booking windows"
    },
    {
      step: "4",
      title: "Track Performance",
      description: "Monitor your campaigns with real-time dashboards and daily ledgers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-6">
            <Hotel className="w-4 h-4" />
            <span className="text-sm font-semibold">Partner Program</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Turn Your Off-Season Into
            <span className="text-orange-500"> Peak Revenue</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Join MAKU's Zero Empty Beds initiative. Fill your inventory during low-demand periods 
            with our AI-powered traveler matching system. No upfront costs, no commitments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8"
              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Become a Partner
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How It Works
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
              <div className="text-3xl font-bold text-orange-500 mb-2">40%</div>
              <div className="text-gray-600">Average Occupancy Increase</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
              <div className="text-3xl font-bold text-orange-500 mb-2">$892K</div>
              <div className="text-gray-600">Revenue Generated (Beta)</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
              <div className="text-3xl font-bold text-orange-500 mb-2">89</div>
              <div className="text-gray-600">Active Partner Campaigns</div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Partner with MAKU?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-orange-100 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-4">{benefit.icon}</div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Four simple steps to start filling your off-season inventory
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">{item.title}</h3>
                <p className="text-gray-600 text-center">{item.description}</p>
                
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-orange-300 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact-form" className="bg-gradient-to-br from-orange-50 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-orange-100 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Ready to Get Started?</CardTitle>
                <CardDescription className="text-lg">
                  Fill out the form below and our partnership team will contact you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
                    <p className="text-gray-600">We've received your inquiry and will be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name *</label>
                      <Input
                        required
                        placeholder="Grand Beach Resort"
                        value={formData.hotelName}
                        onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                      <Input
                        required
                        placeholder="John Smith"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                        <Input
                          required
                          type="email"
                          placeholder="john@hotel.com"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                      <textarea
                        className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Tell us about your property and off-season needs..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      size="lg"
                    >
                      Submit Partnership Inquiry
                    </Button>
                    
                    <p className="text-xs text-gray-500 text-center">
                      By submitting, you agree to be contacted by MAKU regarding partnership opportunities
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <blockquote className="text-xl md:text-2xl text-gray-700 italic mb-6">
                  "MAKU helped us fill 45 rooms during our slowest month. The platform is intuitive, 
                  and the AI matching actually works. We're seeing travelers we'd never reach otherwise."
                </blockquote>
                <div className="font-semibold text-gray-900">Maria Rodriguez</div>
                <div className="text-gray-600">Revenue Manager, Coastal Paradise Resort</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
