/**
 * Complete Smart Dreams Platform - Dream Marketplace
 * Revolutionary: Users curate dreams → Providers compete with offers  
 * Integrates with: Travel Fund Manager (Laxmi), Plan Together, Gifting, Rewards
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Heart, Users, Gift, Wallet, TrendingDown,
  MapPin, Plus, Target, TestTube2, Check, Hotel, Plane,
  Star, DollarSign, Share2, Calendar
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SmartDreamsComplete = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<'myDreams'>('myDreams');

  const handleCreateDream = () => {
    toast({
      title: "Create Dream",
      description: "Let's set up your Travel Fund to start saving",
    });
    navigate('/travel-fund?source=smart-dream');
  };

  const handleAddFunds = () => {
    navigate('/travel-fund');
  };

  const handleInvite = () => {
    navigate('/collaborative-planning');
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
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Smart Dreams Marketplace
          </h1>
          
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Create your dream trip. Save with Travel Fund. Let hotels & airlines compete with exclusive offers.
          </p>

          <Button
            onClick={handleCreateDream}
            size="lg"
            className="px-8 bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your Dream Trip
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
            How It Revolutionizes Travel
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: Sparkles,
                title: '1. Dream It',
                desc: 'Create your perfect trip',
                features: ['AI helps refine', 'Visual planning', 'Flexible dates']
              },
              {
                icon: Wallet,
                title: '2. Save It',
                desc: 'Use Travel Fund Manager',
                features: ['Gradual savings', 'Gift contributions', 'Earn rewards']
              },
              {
                icon: TrendingDown,
                title: '3. Get Offers',
                desc: 'Providers compete',
                features: ['Direct deals', 'Off-season offers', 'No OTA fees']
              },
              {
                icon: Plane,
                title: '4. Book It',
                desc: 'Choose best deal',
                features: ['Instant booking', 'Best price', 'Full control']
              }
            ].map((step, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-xl transition-all">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-purple-600" />
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

      {/* Integrations */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Integrated Ecosystem</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Wallet, name: 'Travel Fund', desc: 'Save & earn', onClick: () => navigate('/travel-fund') },
              { icon: Users, name: 'Plan Together', desc: 'Collaborate', onClick: () => navigate('/collaborative-planning') },
              { icon: Gift, name: 'Gifting', desc: 'Contributions', onClick: () => navigate('/gift-cards') },
              { icon: Star, name: 'Rewards', desc: 'NFT & cashback', onClick: () => navigate('/nft') }
            ].map((item, idx) => (
              <Card 
                key={idx} 
                className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                onClick={item.onClick}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold mb-1">{item.name}</h4>
                <p className="text-xs text-gray-600">{item.desc}</p>
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
            Create dreams, save with Travel Fund Manager (Laxmi), and let providers compete.
            Test environment - launching soon!
          </p>
        </div>
      </section>
    </div>
  );
};

export default SmartDreamsComplete;
