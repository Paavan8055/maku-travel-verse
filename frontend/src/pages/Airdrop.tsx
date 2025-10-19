import React, { useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterCtas from "@/components/FooterCtas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Coins, 
  Trophy, 
  Star, 
  Target,
  Calendar,
  Users,
  TrendingUp,
  Gift,
  Wallet,
  ChevronRight,
  Check,
  Play,
  Globe,
  Zap,
  Crown,
  Award,
  Sparkles
} from 'lucide-react';

export default function Airdrop() {
  const [userProgress] = useState({
    currentTier: 'Silver',
    points: 485,
    nextTierPoints: 500,
    progress: 97,
    estimatedAllocation: 1212
  });

  const airdropSchedule = [
    {
      name: 'Summer 2025 Travel Rewards',
      status: 'Active',
      allocation: '4,000,000 tokens',
      participants: '8,500+',
      endDate: 'July 31, 2025',
      eligibility: 'All tiers eligible',
      featured: true
    },
    {
      name: 'Provider Integration Bonus',
      status: 'Ongoing',
      allocation: '1,500,000 tokens',
      participants: '12,300+',
      endDate: 'December 31, 2025',
      eligibility: 'Multi-provider users',
      featured: false
    },
    {
      name: 'NFT Holder Rewards',
      status: 'Quarterly',
      allocation: '500,000 tokens',
      participants: '3,200+',
      endDate: 'Every quarter',
      eligibility: 'NFT holders only',
      featured: false
    }
  ];

  const questCategories = [
    {
      title: 'Travel Booking Quests',
      description: 'Earn points for real travel bookings',
      icon: Calendar,
      color: 'from-green-500 to-emerald-600',
      quests: [
        { name: 'Expedia Group Pioneer', points: 150, progress: 0, description: 'Complete first booking with Expedia' },
        { name: 'Multi-Provider Master', points: 200, progress: 50, description: 'Book with 3+ different providers' },
        { name: 'Luxury Explorer', points: 300, progress: 25, description: 'Complete $2000+ luxury booking' }
      ]
    },
    {
      title: 'Social & Community',
      description: 'Engage with the Maku community',
      icon: Users,
      color: 'from-blue-500 to-purple-500',
      quests: [
        { name: 'Travel Storyteller', points: 80, progress: 60, description: 'Share 5 travel experiences' },
        { name: 'Community Ambassador', points: 120, progress: 30, description: 'Refer 3 active travelers' },
        { name: 'Social Influencer', points: 200, progress: 15, description: 'Reach 1000 social interactions' }
      ]
    },
    {
      title: 'Platform Mastery',
      description: 'Master Maku Travel features',
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      quests: [
        { name: 'AI Intelligence Expert', points: 100, progress: 85, description: 'Use all AI features' },
        { name: 'Smart Dreams Collector', points: 75, progress: 70, description: 'Add 15 dream destinations' },
        { name: 'Feature Pioneer', points: 50, progress: 100, description: 'Try new platform features' }
      ]
    }
  ];

  const tierBenefits = [
    {
      tier: 'Bronze',
      icon: <Target className="w-8 h-8" />,
      points: '0-199',
      multiplier: '1.0x',
      cashback: '1%',
      benefits: ['Basic airdrop eligibility', '1% MAKU cashback', 'Standard NFT access', 'FREE membership'],
      color: 'from-amber-100 to-amber-200',
      textColor: 'text-amber-700'
    },
    {
      tier: 'Silver',
      icon: <Star className="w-8 h-8" />,
      points: '200-499',
      multiplier: '1.5x',
      cashback: '3%',
      benefits: ['Enhanced airdrop weight', '3% MAKU cashback', 'Rare NFT access', 'Priority support'],
      color: 'from-slate-100 to-slate-200',
      textColor: 'text-slate-800',
      current: true
    },
    {
      tier: 'Gold',
      icon: <Trophy className="w-8 h-8" />,
      points: '500-999', 
      multiplier: '2.0x',
      cashback: '6%',
      benefits: ['High airdrop multiplier', '6% MAKU cashback', 'Epic NFT access', 'Exclusive offers'],
      color: 'from-yellow-100 to-yellow-200',
      textColor: 'text-yellow-800'
    },
    {
      tier: 'Platinum',
      icon: <Crown className="w-8 h-8" />,
      points: '1000+',
      multiplier: '2.5x',
      cashback: '10%',
      benefits: ['Maximum airdrop allocation', '10% MAKU cashback', 'Legendary NFT access', 'VIP treatment + Free Hugging Face LLM'],
      color: 'from-purple-100 to-purple-200',
      textColor: 'text-purple-800'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-500 via-orange-500 to-green-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Maku Airdrop Program
              <span className="block text-yellow-300">(Scheduled)</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-green-100 mb-8 font-light">
              The travel loyalty revolution for explorers who architect their own futures.
            </p>
            
            <p className="text-lg text-white/90 mb-12 max-w-2xl mx-auto">
              Climb the priority list with quests—earn NFT rewards, credits, and early-access perks. 
              <span className="font-bold text-yellow-300">No token allocations now</span>, maximum rewards later.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button 
                size="lg" 
                className="bg-white text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-semibold"
              >
                VIEW MY PROGRESS
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                HOW AIRDROPS WORK
              </Button>
            </div>

            {/* Current User Progress */}
            <Card className="bg-white/10 border-white/20 max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Star className="w-8 h-8 text-yellow-300" />
                    <div className="text-left">
                      <p className="font-bold text-lg">{userProgress.currentTier} Tier</p>
                      <p className="text-green-100">{userProgress.points} total points</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-yellow-300">{userProgress.estimatedAllocation.toLocaleString()}</p>
                    <p className="text-green-100 text-sm">Est. tokens</p>
                  </div>
                </div>
                <Progress value={userProgress.progress} className="h-3 bg-white/20" />
                <p className="text-center text-green-100 mt-2">
                  {userProgress.nextTierPoints - userProgress.points} points to Gold tier
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Airdrop Schedule */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-orange-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Active & Upcoming Airdrops
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Scheduled token distributions for the Maku Travel community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {airdropSchedule.map((airdrop, index) => (
              <Card 
                key={index} 
                className={`hover:shadow-lg transition-all duration-300 ${
                  airdrop.featured 
                    ? 'ring-2 ring-orange-500 shadow-lg scale-105 border-orange-200' 
                    : 'border-gray-200'
                }`}
              >
                {airdrop.featured && (
                  <div className="bg-orange-500 text-white text-center py-2 text-sm font-semibold">
                    FEATURED EVENT
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className={
                        airdrop.status === 'Active' 
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }
                    >
                      {airdrop.status}
                    </Badge>
                    <Calendar className="w-5 h-5 text-gray-500" />
                  </div>
                  
                  <CardTitle className="text-xl text-gray-900">
                    {airdrop.name}
                  </CardTitle>
                  
                  <CardDescription>
                    {airdrop.allocation} • {airdrop.participants} participants
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">End Date</span>
                      <span className="font-medium">{airdrop.endDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Eligibility</span>
                      <span className="font-medium text-green-600">{airdrop.eligibility}</span>
                    </div>
                  </div>

                  <Button 
                    className={
                      airdrop.featured
                        ? 'w-full bg-orange-500 hover:bg-orange-600'
                        : 'w-full bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }
                  >
                    {airdrop.status === 'Active' ? 'Participate Now' : 'Learn More'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quest Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Earn points with travel quests
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Complete real travel activities to climb the airdrop tiers and unlock greater rewards
            </p>
          </div>

          <div className="space-y-8">
            {questCategories.map((category, categoryIndex) => {
              const IconComponent = category.icon;
              return (
                <Card key={categoryIndex} className="border-orange-200">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center shadow-md`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-gray-900">{category.title}</CardTitle>
                        <CardDescription className="text-gray-600">{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      {category.quests.map((quest, questIndex) => (
                        <div key={questIndex} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-gray-900">{quest.name}</h4>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                              +{quest.points}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4">{quest.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">{quest.progress}%</span>
                            </div>
                            <Progress value={quest.progress} className="h-2" />
                            <Button 
                              size="sm" 
                              className={quest.progress === 100 ? 'bg-green-600 hover:bg-green-700' : `bg-gradient-to-r ${category.color} hover:opacity-90`}
                              disabled={quest.progress === 100}
                            >
                              {quest.progress === 100 ? 'Completed' : 'Continue'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier Comparison */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-green-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Airdrop tier benefits
            </h2>
            <p className="text-lg text-gray-600">
              Advance through tiers to multiply your airdrop allocation
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {tierBenefits.map((tier, index) => (
              <Card 
                key={index}
                className={`text-center hover:shadow-lg transition-all duration-300 ${
                  tier.current 
                    ? 'ring-2 ring-orange-500 shadow-lg scale-105 border-orange-200' 
                    : 'border-gray-200 hover:scale-102'
                }`}
              >
                {tier.current && (
                  <div className="bg-orange-500 text-white text-center py-2 text-sm font-semibold">
                    YOUR CURRENT TIER
                  </div>
                )}
                
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-br ${tier.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-md`}>
                    <div className={tier.textColor}>
                      {tier.icon}
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {tier.tier}
                  </CardTitle>
                  
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-orange-600">{tier.points} points</p>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                      {tier.multiplier} airdrop multiplier
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 mb-6">
                    {tier.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className={
                      tier.current
                        ? 'w-full bg-orange-500 hover:bg-orange-600 text-white'
                        : 'w-full bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }
                    size="lg"
                  >
                    {tier.current ? 'Current Tier' : `Reach ${tier.tier}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How Airdrops Work */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How airdrop rewards work
            </h2>
            <p className="text-lg text-gray-600">
              Simple, transparent, and rewarding for every level of traveler
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Earn Points</h3>
                <p className="text-gray-600">
                  Complete travel bookings, quests, and community activities to accumulate airdrop points.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Advance Tiers</h3>
                <p className="text-gray-600">
                  Progress through Wanderer, Explorer, Adventurer, and Legend tiers for higher multipliers.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Coins className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Get Rewards</h3>
                <p className="text-gray-600">
                  Receive token allocations based on your tier, points, and platform participation.
                </p>
              </div>
            </div>

            {/* Calculation Example */}
            <Card className="shadow-2xl border-0">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
                  Example: Explorer Tier Airdrop Calculation
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Point Sources</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-700">Travel Bookings</span>
                        <span className="font-semibold text-green-600">+200 points</span>
                      </div>
                      <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-gray-700">Provider Diversity</span>
                        <span className="font-semibold text-blue-600">+150 points</span>
                      </div>
                      <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                        <span className="text-gray-700">Quest Completion</span>
                        <span className="font-semibold text-purple-600">+100 points</span>
                      </div>
                      <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                        <span className="text-gray-700">NFT Collection</span>
                        <span className="font-semibold text-orange-600">+75 points</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Calculation</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Base Points</span>
                        <span className="font-semibold">525</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Explorer Multiplier</span>
                        <span className="font-semibold text-blue-600">× 1.5</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Base Allocation</span>
                        <span className="font-semibold">787 tokens</span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-xl font-bold">
                          <span className="text-gray-900">Final Allocation</span>
                          <span className="text-green-600">1,312 tokens</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          + Bonus rewards for NFT holdings and quest streaks
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Provider Integration */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Earn across 6 global travel providers
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Unlike single-platform airdrops, earn points from every booking, every provider, every journey
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Expedia', bonus: '15%', featured: true, color: 'from-blue-500 to-purple-500' },
              { name: 'Amadeus', bonus: '10%', color: 'from-green-500 to-emerald-600' },
              { name: 'Viator', bonus: '12%', color: 'from-purple-500 to-pink-500' },
              { name: 'Duffle', bonus: '10%', color: 'from-orange-500 to-red-500' },
              { name: 'RateHawk', bonus: '10%', color: 'from-teal-500 to-cyan-500' },
              { name: 'Sabre', bonus: '10%', color: 'from-indigo-500 to-blue-500' }
            ].map((provider) => (
              <Card key={provider.name} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-orange-200">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${provider.color} rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md`}>
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{provider.name}</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 mb-2">
                    +{provider.bonus} points
                  </Badge>
                  {provider.featured && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300 text-xs block">
                      New Integration
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What airdrop members say
            </h2>
            <p className="text-lg text-gray-600">
              Real experiences from our travel community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "Started with 50 points as a Wanderer, now I'm an Adventurer with 847 points. The multi-provider quests make earning so much fun!",
                author: "Alex K.",
                tier: "Adventurer • 847 points",
                avatar: "/api/placeholder/64/64"
              },
              {
                quote: "The airdrop system is transparent and fair. I can see exactly how my travel activities translate to future token rewards.",
                author: "Maria S.",
                tier: "Explorer • 456 points", 
                avatar: "/api/placeholder/64/64"
              },
              {
                quote: "Love how I earn points whether I book through Expedia, Amadeus, or any other provider. True travel freedom with rewards.",
                author: "David R.",
                tier: "Legend • 1,203 points",
                avatar: "/api/placeholder/64/64"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-orange-200">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <img 
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-orange-600 font-medium">{testimonial.tier}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 italic leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-green-500 via-orange-500 to-green-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start climbing the airdrop tiers
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers earning points and building toward the biggest travel airdrop in history
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 px-12 py-4 text-lg font-semibold">
              VIEW MY PROGRESS
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-12 py-4 text-lg font-semibold">
              <Wallet className="w-5 h-5 mr-2" />
              CONNECT & EARN
            </Button>
          </div>
          
          <p className="text-sm text-green-200 mt-6">
            Free to join • No token purchases required • Start earning immediately
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Airdrop FAQ
            </h2>
            
            <div className="space-y-6">
              {[
                {
                  question: "When will the main airdrop happen?",
                  answer: "The main airdrop is scheduled for Summer 2025 as part of our official roadmap. We build responsibly without false promises or artificial hype."
                },
                {
                  question: "How are airdrop allocations calculated?",
                  answer: "Your allocation is based on total points earned × tier multiplier × quest completion bonuses. Explorer tier gets 1.5x, Adventurer gets 2x, Legend gets 2.5x the base allocation."
                },
                {
                  question: "Can I earn points without buying tokens?",
                  answer: "Yes! Our points-based system rewards real travel activity. No token purchases required - just book travel, complete quests, and engage with the platform."
                },
                {
                  question: "Which providers give the most airdrop points?",
                  answer: "All 6 providers offer points, with Expedia Group giving a 15% bonus for our new integration. Amadeus, Viator, Duffle, RateHawk, and Sabre each offer 10-12% bonuses."
                }
              ].map((faq, index) => (
                <Card key={index} className="border-orange-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">{faq.question}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FooterCtas />
      <Footer />
    </div>
  );
}