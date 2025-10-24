/**
 * Smart Dreams - Curated Dream Library
 * Browse expert-curated travel packages
 * Integrated with Travel Fund Manager, Plan Together, Gifting
 */

import Navbar from '@/components/Navbar';
import DreamLibraryBrowser from '@/components/DreamLibraryBrowser';
import { Sparkles, Hotel, Plane, Target, Wallet, Users, Gift, Check, TestTube2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const SmartDreamsComplete = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-12 px-6 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
            <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
              Dream Curation Platform
            </Badge>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Curated Dream Travel Packages
          </h1>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Expert-curated journeys by world's most traveled people. Browse, select, save with Travel Fund, and let hotels compete with exclusive offers.
          </p>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Wallet, text: 'Travel Fund', path: '/travel-fund' },
              { icon: Users, text: 'Plan Together', path: '/collaborative-planning' },
              { icon: Gift, text: 'Gift Cards', path: '/gift-cards' },
              { icon: Target, text: 'Rewards', path: '/nft' }
            ].map((item, idx) => (
              <Card 
                key={idx} 
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white/10 backdrop-blur border-white/20 hover:bg-white/20"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">{item.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dream Library */}
      <section className="py-12 px-6">
        <DreamLibraryBrowser />
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
            How Smart Dreams Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', icon: Sparkles, title: 'Browse & Select', desc: 'Choose from expert-curated dream packages' },
              { step: '2', icon: Wallet, title: 'Setup Travel Fund', desc: 'Create savings plan, earn rewards' },
              { step: '3', icon: Target, title: 'Providers Compete', desc: 'Hotels & airlines bid with exclusive offers' },
              { step: '4', icon: Plane, title: 'Book Best Deal', desc: 'Choose winning offer, book directly' }
            ].map((item, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.step}. {item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why It's Revolutionary */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Win-Win for Everyone</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-4">For Travelers</h3>
              <ul className="space-y-3">
                {[
                  'Expert-curated packages with hidden gems',
                  'Save gradually with Travel Fund earning rewards',
                  'Plan collaboratively with friends',
                  'Providers compete = better deals',
                  'No surprise fees, full transparency'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-4">For Hotels & Airlines</h3>
              <ul className="space-y-3">
                {[
                  'Fill off-season capacity directly',
                  'Eliminate GDS/OTA commission fees',
                  'Target motivated, qualified travelers',
                  'Build loyal customer relationships',
                  'Compete on value, not just price'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="py-12 px-6 bg-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-purple-100 text-purple-700 mb-4">
            <TestTube2 className="w-4 h-4 mr-2" />
            Pre-Revenue Startup
          </Badge>
          <h3 className="font-bold text-lg mb-2">Curated by Travel Experts</h3>
          <p className="text-sm text-gray-700">
            Packages curated based on insights from Drew Binsky (visited all 197 countries), Harry Mitsidis (visited every country twice), 
            and travel data from TripAdvisor, Lonely Planet. All pricing from real provider test APIs. Hidden gems verified by local experts.
          </p>
        </div>
      </section>
    </div>
  );
};

export default SmartDreamsComplete;
