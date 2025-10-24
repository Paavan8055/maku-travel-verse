/**
 * Complete Smart Dreams Platform - Dream Marketplace
 * Revolutionary: Users curate dreams → Providers compete with offers
 * Integrations: Laxmi Wallet, Plan Together, Gifting, Rewards, Off-Season Engine
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Heart, Users, Gift, Wallet, TrendingDown,
  MapPin, Calendar, DollarSign, Star, Plus, Share2,
  Image as ImageIcon, Plane, Hotel, Camera, Target,
  TestTube2, Bell, Trophy, Zap, ArrowRight, Check
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { detectPersona } from '@/services/aiPersonalizationApi';
import { useAuth } from '@/features/auth/context/AuthContext';

interface Dream {
  id: string;
  title: string;
  description: string;
  destination: string;
  imageUrl: string;
  preferredDates?: {
    start: string;
    end: string;
    flexible: boolean;
  };
  budget: {
    target: number;
    saved: number;
    currency: string;
    monthlyGoal: number;
  };
  preferences: {
    accommodation: string[];
    activities: string[];
    travelStyle: string;
  };
  collaborators: number;
  giftContributions: number;
  providerOffers: number;
  status: 'dreaming' | 'saving' | 'offers' | 'booked';
  createdAt: string;
}

const SmartDreamsComplete = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<'create' | 'myDreams' | 'marketplace'>('myDreams');
  const [userPersona, setUserPersona] = useState<any>(null);
  
  // Mock dreams for demonstration
  const [dreams, setDreams] = useState<Dream[]>([
    {
      id: '1',
      title: 'Romantic Maldives Honeymoon',
      description: 'Overwater villa with private pool, candlelit dinners, couples spa treatments',
      destination: 'Maldives',
      imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
      preferredDates: {
        start: '2025-12-01',
        end: '2025-12-10',
        flexible: true
      },
      budget: {
        target: 5000,
        saved: 1200,
        currency: 'USD',
        monthlyGoal: 400
      },
      preferences: {
        accommodation: ['Luxury Resort', 'Overwater Villa'],
        activities: ['Spa', 'Diving', 'Fine Dining'],
        travelStyle: 'Romantic'
      },
      collaborators: 2,
      giftContributions: 300,
      providerOffers: 8,
      status: 'offers',
      createdAt: '2025-01-15'
    },
    {
      id: '2',
      title: 'Family Adventure in Japan',
      description: 'Tokyo, Mt. Fuji, Kyoto temples, traditional ryokan experience',
      destination: 'Japan',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      preferredDates: {
        start: '2025-09-15',
        end: '2025-09-25',
        flexible: true
      },
      budget: {
        target: 8000,
        saved: 2400,
        currency: 'USD',
        monthlyGoal: 600
      },
      preferences: {
        accommodation: ['Family Hotel', 'Traditional Ryokan'],
        activities: ['Cultural Tours', 'Theme Parks', 'Food Tours'],
        travelStyle: 'Family Fun'
      },
      collaborators: 4,
      giftContributions: 500,
      providerOffers: 12,
      status: 'saving',
      createdAt: '2024-11-20'
    }
  ]);

  useEffect(() => {
    if (user?.id) {
      detectUserPersona({ user_id: user.id })
        .then(setUserPersona)
        .catch(console.error);
    }
  }, [user]);

  const savingsProgress = (dream: Dream) => {
    return Math.round((dream.budget.saved / dream.budget.target) * 100);
  };

  const getStatusColor = (status: Dream['status']) => {
    switch (status) {
      case 'dreaming': return 'bg-purple-100 text-purple-700';
      case 'saving': return 'bg-blue-100 text-blue-700';
      case 'offers': return 'bg-green-100 text-green-700';
      case 'booked': return 'bg-orange-100 text-orange-700';
    }
  };

  const getStatusLabel = (status: Dream['status']) => {
    switch (status) {
      case 'dreaming': return '💭 Dreaming';
      case 'saving': return '💰 Saving';
      case 'offers': return '🎯 Has Offers';
      case 'booked': return '✅ Booked';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg px-4 py-2">
              Dream Curation Platform
            </Badge>
            <Sparkles className="w-8 h-8 text-pink-600 animate-pulse" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Smart Dreams Marketplace
          </h1>
          
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Create your dream trip. Save with Laxmi. Plan together. Let hotels & airlines compete with exclusive offers.
          </p>

          {/* View Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={view === 'create' ? 'default' : 'outline'}
              onClick={() => setView('create')}
              size="lg"
              className="px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Dream
            </Button>
            <Button
              variant={view === 'myDreams' ? 'default' : 'outline'}
              onClick={() => setView('myDreams')}
              size="lg"
              className="px-6"
            >
              <Heart className="w-4 h-4 mr-2" />
              My Dreams ({dreams.length})
            </Button>
            <Button
              variant={view === 'marketplace' ? 'default' : 'outline'}
              onClick={() => setView('marketplace')}
              size="lg"
              className="px-6"
            >
              <Target className="w-4 h-4 mr-2" />
              Offers ({dreams.reduce((sum, d) => sum + d.providerOffers, 0)})
            </Button>
          </div>
        </div>
      </section>

      {/* My Dreams View */}
      {view === 'myDreams' && (
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dreams.map((dream) => (
                <Card key={dream.id} className="overflow-hidden hover:shadow-2xl transition-shadow">
                  {/* Dream Image */}
                  <div className="relative h-64">
                    <img
                      src={dream.imageUrl}
                      alt={dream.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className={`absolute top-4 right-4 ${getStatusColor(dream.status)}`}>
                      {getStatusLabel(dream.status)}
                    </Badge>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-bold text-white mb-1">{dream.title}</h3>
                      <p className="text-white/90 text-sm flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {dream.destination}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Savings Progress */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">Savings Progress</span>
                        <span className="text-sm font-bold text-green-600">{savingsProgress(dream)}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500" 
                          style={{width: `${savingsProgress(dream)}%`}}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>${dream.budget.saved.toLocaleString()} saved</span>
                        <span>${dream.budget.target.toLocaleString()} goal</span>
                      </div>
                    </div>

                    {/* Dream Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-lg font-bold">{dream.collaborators}</p>
                        <p className="text-xs text-gray-600">Planning</p>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <Gift className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                        <p className="text-lg font-bold">${dream.giftContributions}</p>
                        <p className="text-xs text-gray-600">Gifted</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Target className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-lg font-bold">{dream.providerOffers}</p>
                        <p className="text-xs text-gray-600">Offers</p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" size="sm">
                        <Wallet className="w-4 h-4 mr-2" />
                        Add Funds
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Invite
                      </Button>
                    </div>

                    {dream.status === 'offers' && (
                      <Button className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                        <Target className="w-4 h-4 mr-2" />
                        View {dream.providerOffers} Offers
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Create New Dream CTA */}
            <Card className="mt-8 p-8 text-center bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
              <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Create Your Next Dream</h3>
              <p className="text-gray-600 mb-6">Start planning and let providers compete for your business</p>
              <Button 
                size="lg" 
                onClick={() => setView('create')}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Dream
              </Button>
            </Card>
          </div>
        </section>
      )}

      {/* How Smart Dreams Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
            How It Revolutionizes Travel Booking
          </h2>
          <p className="text-center text-gray-600 mb-12">Disrupting traditional OTA model - Direct engagement, better deals</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: Sparkles,
                title: '1. Dream & Curate',
                desc: 'Describe your perfect trip with all preferences and budget',
                color: 'purple',
                features: ['AI helps refine', 'Visual moodboard', 'Flexible dates']
              },
              {
                icon: Wallet,
                title: '2. Save with Laxmi',
                desc: 'Fund gradually, invite collaborators, accept gifts',
                color: 'green',
                features: ['Automatic savings', 'Gift contributions', 'Rewards earned']
              },
              {
                icon: TrendingDown,
                title: '3. Providers Compete',
                desc: 'Hotels & airlines submit exclusive offers for your dream',
                color: 'orange',
                features: ['Direct deals', 'Off-season offers', 'No GDS fees']
              },
              {
                icon: Plane,
                title: '4. Book Best Deal',
                desc: 'Choose winning offer and book directly',
                color: 'blue',
                features: ['Instant confirmation', 'Best price', 'Full control']
              }
            ].map((step, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${step.color}-100 flex items-center justify-center`}>
                  <step.icon className={`w-8 h-8 text-${step.color}-600`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{step.desc}</p>
                <div className="space-y-1">
                  {step.features.map((feat, i) => (
                    <p key={i} className="text-xs text-gray-500 flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-600" />
                      {feat}
                    </p>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Providers Love It */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Win-Win for Everyone</h2>
            <p className="text-xl text-gray-600">Travelers get better deals • Providers fill capacity</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Travelers */}
            <Card className="p-8 border-2 border-purple-200">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Heart className="w-6 h-6 text-purple-600" />
                For Travelers
              </h3>
              <ul className="space-y-3">
                {[
                  'Save gradually with Laxmi wallet earning rewards',
                  'Collaborate with friends & family on planning',
                  'Receive gifts to fund your dreams',
                  'Get exclusive off-season offers from providers',
                  'Providers compete = better deals for you',
                  'Full transparency, no hidden fees'
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* For Providers */}
            <Card className="p-8 border-2 border-orange-200">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Hotel className="w-6 h-6 text-orange-600" />
                For Hotels & Airlines
              </h3>
              <ul className="space-y-3">
                {[
                  'Fill off-season capacity with motivated travelers',
                  'Direct engagement - eliminate GDS/OTA fees',
                  'Target flexible dreamers with exclusive deals',
                  'Build loyal relationships with travelers',
                  'Compete on value, not just discoverability',
                  'Access pre-qualified, ready-to-book customers'
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Integration Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Integrated Ecosystem</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Wallet, name: 'Laxmi Wallet', desc: 'Save & earn rewards', color: 'green' },
              { icon: Users, name: 'Plan Together', desc: 'Collaborative trips', color: 'blue' },
              { icon: Gift, name: 'Gifting', desc: 'Gift contributions', color: 'pink' },
              { icon: Trophy, name: 'Rewards', desc: 'NFT & cashback', color: 'yellow' },
              { icon: TrendingDown, name: 'Off-Season', desc: 'Exclusive deals', color: 'orange' },
              { icon: Hotel, name: 'Direct Hotels', desc: 'No OTA fees', color: 'purple' },
              { icon: Plane, name: 'Airlines', desc: 'Compete for you', color: 'cyan' },
              { icon: Target, name: 'Marketplace', desc: 'Dream bidding', color: 'red' }
            ].map((integration, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-${integration.color}-100 flex items-center justify-center`}>
                  <integration.icon className={`w-6 h-6 text-${integration.color}-600`} />
                </div>
                <h4 className="font-bold mb-1">{integration.name}</h4>
                <p className="text-xs text-gray-600">{integration.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="py-12 px-6 bg-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TestTube2 className="w-5 h-5 text-purple-600" />
            <Badge className="bg-purple-100 text-purple-700">Pre-Revenue Startup</Badge>
          </div>
          <h3 className="font-bold text-lg mb-2">Building in Public</h3>
          <p className="text-sm text-gray-700">
            Smart Dreams is our revolutionary concept to disrupt traditional travel booking. 
            We're integrating with real provider APIs to create a marketplace where travelers dream 
            and providers compete. All data shown uses test environments. Launching soon!
          </p>
        </div>
      </section>
    </div>
  );
};

export default SmartDreamsComplete;
