/**
 * Smart Dreams - Complete Dream Marketplace Platform
 * Revolutionary: Users curate dreams → Providers compete with offers
 * Integrated with: Travel Fund Manager (Laxmi), Plan Together, Gifting, Rewards, Off-Season
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Heart, Users, Gift, Wallet, TrendingDown,
  MapPin, Calendar, DollarSign, Star, Plus, Share2,
  Plane, Hotel, Camera, Target, TestTube2, Check,
  ArrowRight, Zap
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { detectPersona } from '@/services/aiPersonalizationApi';

interface Dream {
  id: string;
  title: string;
  description: string;
  destination: string;
  imageUrl: string;
  preferredDates: {
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
  const { toast } = useToast();
  const [view, setView] = useState<'create' | 'myDreams' | 'marketplace'>('myDreams');
  const [userPersona, setUserPersona] = useState<any>(null);
  
  // Create Dream Form State
  const [dreamForm, setDreamForm] = useState({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    flexibleDates: false,
    targetBudget: 0,
    savedAmount: 0,
    monthlyGoal: 0,
    accommodationPrefs: [] as string[],
    activityPrefs: [] as string[],
    travelStyle: ''
  });
  
  // Mock dreams for demonstration with real test data structure
  const [dreams] = useState<Dream[]>([
    {
      id: '1',
      title: 'Romantic Maldives Honeymoon',
      description: 'Overwater villa, couples spa, candlelit dinners',
      destination: 'Maldives',
      imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
      preferredDates: { start: '2025-12-01', end: '2025-12-10', flexible: true },
      budget: { target: 5000, saved: 1200, currency: 'USD', monthlyGoal: 400 },
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
      description: 'Tokyo, Mt. Fuji, Kyoto temples, ryokan stay',
      destination: 'Japan',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      preferredDates: { start: '2025-09-15', end: '2025-09-25', flexible: true },
      budget: { target: 8000, saved: 2400, currency: 'USD', monthlyGoal: 600 },
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
      detectPersona({ user_id: user.id })
        .then(setUserPersona)
        .catch(console.error);
    }
  }, [user]);

  // Handler Functions - All Fully Wired
  const handleCreateDream = () => {
    if (!dreamForm.title || !dreamForm.destination || !dreamForm.targetBudget) {
      toast({
        title: "Missing Information",
        description: "Please fill in dream title, destination, and budget",
        variant: "destructive"
      });
      return;
    }

    const dreamData = {
      ...dreamForm,
      userId: user?.id || 'guest',
      createdAt: new Date().toISOString()
    };

    sessionStorage.setItem('dreamToFund', JSON.stringify(dreamData));

    toast({
      title: "Dream Created! 🎉",
      description: "Setting up your Travel Fund Manager (Laxmi) to start saving",
    });

    navigate('/travel-fund?source=smart-dream');
  };

  const handleAddFunds = (dreamId: string) => {
    navigate(`/travel-fund?dreamId=${dreamId}`);
  };

  const handleInviteCollaborators = (dreamId: string) => {
    navigate(`/collaborative-planning?dreamId=${dreamId}`);
  };

  const handleEnableGifting = (dreamId: string) => {
    navigate(`/gift-cards?dreamId=${dreamId}`);
  };

  const handleViewDreamOffers = (dreamId: string) => {
    toast({
      title: "Provider Offers",
      description: "Viewing competing offers from hotels & airlines"
    });
    setView('marketplace');
  };

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
            Create Your Dream Trips
          </h1>
          
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Imagine, curate, and save for your perfect journey. Hotels and airlines compete to make your dreams come true with exclusive deals.
          </p>

          {/* Key Value Props */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/travel-fund')}>
              <Wallet className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Save with Travel Fund</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/collaborative-planning')}>
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Plan Together</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/gift-cards')}>
              <Gift className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Gift Dreams</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/nft')}>
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