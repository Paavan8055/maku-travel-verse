/**
 * Reimagined Smart Dreams - Dream Curation & Marketplace Platform
 * Revolutionary approach: Users curate dreams → Providers compete with offers
 * Integrated with: Travel Fund Manager (Laxmi), Plan Together, Gifting, Rewards, Off-Season Engine
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Heart, Users, Gift, Wallet, TrendingDown, 
  MapPin, Calendar, DollarSign, Star, Plus, Share2,
  Image as ImageIcon, Plane, Hotel, Camera, Target, Check, TestTube2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Dream {
  id: string;
  title: string;
  description: string;
  destination: string;
  preferredDates?: {
    start: string;
    end: string;
    flexible: boolean;
  };
  budget: {
    target: number;
    saved: number;
    currency: string;
  };
  preferences: {
    accommodation: string[];
    activities: string[];
    travelStyle: string;
  };
  collaborators?: string[];
  providers?: {
    offers: number;
    bestDeal?: any;
  };
  status: 'dreaming' | 'saving' | 'offers' | 'booked';
  createdAt: string;
  images: string[];
}

const SmartDreamsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<'create' | 'myDreams' | 'marketplace'>('create');
  const [dreams, setDreams] = useState<Dream[]>([]);
  
  // Form state
  const [dreamForm, setDreamForm] = useState({
    title: '',\n    description: '',\n    destination: '',\n    startDate: '',\n    flexibleDates: false,\n    targetBudget: 0,\n    savedAmount: 0,\n    monthlyGoal: 0,\n    accommodationPrefs: [] as string[],\n    activityPrefs: [] as string[],\n    travelStyle: ''\n  });\n\n  const handleCreateDream = () => {\n    if (!dreamForm.title || !dreamForm.destination || !dreamForm.targetBudget) {\n      toast({\n        title: \"Missing Information\",\n        description: \"Please fill in dream title, destination, and budget\",\n        variant: \"destructive\"\n      });\n      return;\n    }\n\n    const dreamData = {\n      ...dreamForm,\n      userId: user?.id || 'guest',\n      createdAt: new Date().toISOString()\n    };\n\n    sessionStorage.setItem('dreamToFund', JSON.stringify(dreamData));\n\n    toast({\n      title: \"Dream Created! \ud83c\udf89\",\n      description: \"Setting up your Travel Fund Manager to start saving\"\n    });\n\n    navigate('/travel-fund?source=smart-dream');\n  };

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
            Create Your Dream Trips
          </h1>
          
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Imagine, curate, and save for your perfect journey. Hotels and airlines compete to make your dreams come true with exclusive deals.
          </p>

          {/* Key Value Props */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <Wallet className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Save with Laxmi</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Plan Together</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <Gift className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Gift Dreams</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <TrendingDown className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Best Deals</p>
            </Card>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={view === 'create' ? 'default' : 'outline'}
              onClick={() => setView('create')}
              className="px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Dream
            </Button>
            <Button
              variant={view === 'myDreams' ? 'default' : 'outline'}
              onClick={() => setView('myDreams')}
              className="px-6"
            >
              <Heart className="w-4 h-4 mr-2" />
              My Dreams ({dreams.length})
            </Button>
            <Button
              variant={view === 'marketplace' ? 'default' : 'outline'}
              onClick={() => setView('marketplace')}
              className="px-6"
            >
              <Target className="w-4 h-4 mr-2" />
              Marketplace
            </Button>
          </div>
        </div>
      </section>

      {/* Create Dream View */}
      {view === 'create' && (
        <section className="py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <Card className="p-8">
              <h2 className="text-3xl font-bold mb-6 text-center">Design Your Dream Journey</h2>

              {/* Step 1: Dream Basics */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Step 1: Give Your Dream a Name
                </h3>
                <Input 
                  placeholder="e.g., Romantic Maldives Escape, Family Adventure in Japan..."
                  className="text-lg p-6 mb-4"
                  value={dreamForm.title}
                  onChange={(e) => setDreamForm({...dreamForm, title: e.target.value})}
                />
                <Textarea 
                  placeholder="Describe your perfect trip... What experiences do you dream of?"
                  className="min-h-[120px] p-4"
                  value={dreamForm.description}
                  onChange={(e) => setDreamForm({...dreamForm, description: e.target.value})}
                />
              </div>

              {/* Step 2: Destination & Dates */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Dream Destination
                  </h3>
                  <Input 
                    placeholder="Where do you dream of going?"
                    className="p-4"
                    value={dreamForm.destination}
                    onChange={(e) => setDreamForm({...dreamForm, destination: e.target.value})}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    When? (Flexible = Better Deals)
                  </h3>
                  <div className="space-y-2">
                    <Input 
                      type="date" 
                      className="p-4"
                      value={dreamForm.startDate}
                      onChange={(e) => setDreamForm({...dreamForm, startDate: e.target.value})}
                    />
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        checked={dreamForm.flexibleDates}
                        onChange={(e) => setDreamForm({...dreamForm, flexibleDates: e.target.checked})}
                      />
                      <span className="text-sm">I'm flexible with dates for better deals</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Step 3: Budget & Savings */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Step 3: Budget & Travel Fund Manager Integration
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  \ud83d\udca1 We'll set up your Travel Fund Manager (saving wallet) to help you reach your goal
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Dream Budget</label>
                    <Input 
                      type="number" 
                      placeholder="$3,000"
                      className="p-4"
                      value={dreamForm.targetBudget || ''}
                      onChange={(e) => setDreamForm({...dreamForm, targetBudget: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Already Saved (Travel Fund)</label>
                    <Input 
                      type="number" 
                      placeholder="$500"
                      className="p-4 bg-green-50"
                      value={dreamForm.savedAmount || ''}
                      onChange={(e) => setDreamForm({...dreamForm, savedAmount: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Monthly Goal</label>
                    <Input 
                      type="number" 
                      placeholder="$300"
                      className="p-4"
                      value={dreamForm.monthlyGoal || ''}
                      onChange={(e) => setDreamForm({...dreamForm, monthlyGoal: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Estimated Savings Progress</span>
                    <span className="text-sm font-bold text-green-600">
                      {dreamForm.savedAmount && dreamForm.targetBudget ? Math.round((dreamForm.savedAmount / dreamForm.targetBudget) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500" 
                      style={{width: `${dreamForm.savedAmount && dreamForm.targetBudget ? Math.round((dreamForm.savedAmount / dreamForm.targetBudget) * 100) : 0}%`}}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    💡 Tip: Providers offer better deals when you reach 50% savings!
                  </p>
                </div>
              </div>

              {/* Step 4: Preferences */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Step 4: Your Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Accommodation Style</label>
                    <div className="space-y-2">
                      {['Luxury Resort', 'Boutique Hotel', 'Beach Villa', 'Budget Friendly'].map(opt => (
                        <label key={opt} className="flex items-center gap-2">
                          <input type="checkbox" />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">Must-Have Experiences</label>
                    <div className="space-y-2">
                      {['Water Sports', 'Cultural Tours', 'Fine Dining', 'Spa & Wellness'].map(opt => (
                        <label key={opt} className="flex items-center gap-2">
                          <input type="checkbox" />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">Travel Style</label>
                    <div className="space-y-2">
                      {['Romantic', 'Family Fun', 'Adventure', 'Relaxation'].map(opt => (
                        <label key={opt} className="flex items-center gap-2">
                          <input type="radio" name="style" />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Collaboration & Gifting */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Step 5: Make it Social (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
                    <Users className="w-8 h-8 text-blue-600 mb-2" />
                    <h4 className="font-semibold mb-2">Plan Together</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Invite friends/family to collaborate, pool budgets, and vote on choices
                    </p>
                    <Button variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Collaborators
                    </Button>
                  </Card>
                  <Card className="p-6 border-2 border-pink-200 hover:border-pink-400 transition-colors cursor-pointer">
                    <Gift className="w-8 h-8 text-pink-600 mb-2" />
                    <h4 className="font-semibold mb-2">Make it Giftable</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Friends & family can contribute to your dream as gifts
                    </p>
                    <Button variant="outline" className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Enable Gifting
                    </Button>
                  </Card>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-6 border-t">
                <Button size="lg" className="px-12 py-6 text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create My Dream
                </Button>
                <p className="text-sm text-gray-600 mt-4">
                  💡 Once created, hotels & airlines will compete with exclusive offers to fulfill your dream!
                </p>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
            How Smart Dreams Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: Sparkles,
                title: '1. Dream It',
                desc: 'Create your perfect trip with all your preferences',
                color: 'purple'
              },
              {
                icon: Wallet,
                title: '2. Save It',
                desc: 'Fund gradually with Laxmi wallet, earn rewards',
                color: 'green'
              },
              {
                icon: TrendingDown,
                title: '3. Get Offers',
                desc: 'Hotels & airlines compete with exclusive deals',
                color: 'orange'
              },
              {
                icon: Plane,
                title: '4. Book It',
                desc: 'Choose the best offer and make your dream real',
                color: 'blue'
              }
            ].map((step, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${step.color}-100 flex items-center justify-center`}>
                  <step.icon className={`w-8 h-8 text-${step.color}-600`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Providers Love It */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">Why Hotels & Airlines Love Smart Dreams</h2>
          <p className="text-center text-gray-600 mb-12">Win-win for travelers and providers</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <Hotel className="w-8 h-8 text-orange-600 mb-3" />
              <h3 className="font-bold mb-2">Fill Off-Season Rooms</h3>
              <p className="text-sm text-gray-600">
                Target travelers with flexible dates. Offer deals during low-season periods to boost occupancy.
              </p>
            </Card>
            <Card className="p-6">
              <Target className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold mb-2">Direct Engagement</h3>
              <p className="text-sm text-gray-600">
                No GDS fees, no OTA commissions. Connect directly with motivated travelers.
              </p>
            </Card>
            <Card className="p-6">
              <TrendingDown className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-bold mb-2">Compete on Value</h3>
              <p className="text-sm text-gray-600">
                Offer packages that match dreams. Better deals = more bookings.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SmartDreamsPage;
