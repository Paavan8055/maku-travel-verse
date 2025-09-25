import React, { useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterCtas from "@/components/FooterCtas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Crown,
  Sparkles,
  MapPin,
  Calendar,
  Camera,
  Gift,
  Wallet,
  ChevronRight,
  Check,
  Play,
  Award,
  Globe,
  Zap,
  Heart,
  Shield
} from 'lucide-react';

export default function NFT() {
  const [selectedTier, setSelectedTier] = useState('explorer');

  const tierComparison = [
    {
      id: 'wanderer',
      name: 'Wanderer',
      icon: <MapPin className="w-6 h-6" />,
      price: 'FREE',
      description: 'Start your journey',
      benefits: [
        { name: 'Travel NFTs', value: 'Basic collection', included: true },
        { name: 'Platform Credits', value: '5% back', included: true },
        { name: 'Airdrop Eligibility', value: 'Standard rate', included: true },
        { name: 'Provider Bonuses', value: 'Base rates', included: true },
        { name: 'Priority Support', value: 'Standard', included: false },
        { name: 'Exclusive NFTs', value: 'Rare collections', included: false },
        { name: 'VIP Access', value: 'Premium features', included: false }
      ],
      highlight: false,
      buttonText: 'Start Free',
      gradient: 'from-gray-100 to-gray-200'
    },
    {
      id: 'explorer',
      name: 'Explorer',
      icon: <Star className="w-6 h-6" />,
      price: '200+ points',
      description: 'Popular choice',
      benefits: [
        { name: 'Travel NFTs', value: 'Enhanced collection', included: true },
        { name: 'Platform Credits', value: '10% back', included: true },
        { name: 'Airdrop Eligibility', value: '1.5x multiplier', included: true },
        { name: 'Provider Bonuses', value: 'All providers', included: true },
        { name: 'Priority Support', value: '24/7 chat', included: true },
        { name: 'Exclusive NFTs', value: 'Rare access', included: false },
        { name: 'VIP Access', value: 'Premium features', included: false }
      ],
      highlight: true,
      buttonText: 'Most Popular',
      gradient: 'from-blue-100 to-cyan-200'
    },
    {
      id: 'adventurer',
      name: 'Adventurer',
      icon: <Trophy className="w-6 h-6" />,
      price: '500+ points',
      description: 'For frequent travelers',
      benefits: [
        { name: 'Travel NFTs', value: 'Premium collection', included: true },
        { name: 'Platform Credits', value: '15% back', included: true },
        { name: 'Airdrop Eligibility', value: '2x multiplier', included: true },
        { name: 'Provider Bonuses', value: 'Enhanced rates', included: true },
        { name: 'Priority Support', value: 'Phone + chat', included: true },
        { name: 'Exclusive NFTs', value: 'Epic collection', included: true },
        { name: 'VIP Access', value: 'Early features', included: false }
      ],
      highlight: false,
      buttonText: 'Level Up',
      gradient: 'from-purple-100 to-pink-200'
    },
    {
      id: 'legend',
      name: 'Legend',
      icon: <Crown className="w-6 h-6" />,
      price: '1000+ points',
      description: 'Ultimate rewards',
      benefits: [
        { name: 'Travel NFTs', value: 'Legendary collection', included: true },
        { name: 'Platform Credits', value: '25% back', included: true },
        { name: 'Airdrop Eligibility', value: '2.5x multiplier', included: true },
        { name: 'Provider Bonuses', value: 'Maximum rates', included: true },
        { name: 'Priority Support', value: 'Dedicated agent', included: true },
        { name: 'Exclusive NFTs', value: 'All collections', included: true },
        { name: 'VIP Access', value: 'Full platform', included: true }
      ],
      highlight: false,
      buttonText: 'Exclusive',
      gradient: 'from-yellow-100 to-orange-200'
    }
  ];

  const testimonials = [
    {
      quote: "I've earned over $2,400 in NFT rewards from my bookings this year. The Expedia integration alone saved me 15% on my Maldives trip!",
      author: "Sarah M.",
      tier: "Legend Member",
      avatar: "/api/placeholder/64/64"
    },
    {
      quote: "The multi-provider system is genius. I get rewards whether I book through Amadeus for business trips or Viator for weekend activities.",
      author: "Michael R.", 
      tier: "Adventurer Member",
      avatar: "/api/placeholder/64/64"
    },
    {
      quote: "Started as a Wanderer, now I'm an Explorer with 15 unique travel NFTs. Each one represents an amazing memory and earns ongoing rewards.",
      author: "Emma L.",
      tier: "Explorer Member", 
      avatar: "/api/placeholder/64/64"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section - Travala Style but TravelHub Branded */}
      <section className="relative bg-gradient-to-br from-orange-500 via-green-500 to-orange-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Travel rewards that take you
              <span className="block text-yellow-300">further</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-orange-100 mb-8 font-light">
              The travel NFT program for explorers who architect their own adventures.
            </p>
            
            <p className="text-lg text-white/90 mb-12 max-w-2xl mx-auto">
              Earn unique NFTs for every booking. Get up to <span className="font-bold text-yellow-300">25% back in rewards</span> 
              across 6 global providers. Build your digital travel legacy.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button 
                size="lg" 
                className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg font-semibold"
              >
                BROWSE COLLECTION
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                HOW IT WORKS
              </Button>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">6</div>
                <div className="text-sm text-orange-100 font-medium">Travel Providers</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">8,500+</div>
                <div className="text-sm text-orange-100 font-medium">NFT Collectors</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">Up to 25%</div>
                <div className="text-sm text-orange-100 font-medium">Rewards Back</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">4</div>
                <div className="text-sm text-orange-100 font-medium">Reward Tiers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Overview */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-green-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              NFT rewards, givebacks, bonuses & more
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Save up to 25% on every travel booking. Plus, build a valuable NFT collection that grows with your adventures.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-300 border-orange-200">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Up to 10%</h3>
                <h4 className="font-semibold text-gray-800 mb-2">NFT Rewards</h4>
                <p className="text-sm text-gray-600">
                  Earn unique travel NFTs that provide ongoing platform credits for future bookings
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 border-orange-200">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Up to 15%</h3>
                <h4 className="font-semibold text-gray-800 mb-2">Provider Bonuses</h4>
                <p className="text-sm text-gray-600">
                  Extra rewards for booking with Expedia, Amadeus, Viator and other integrated partners
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 border-orange-200">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Airdrop Multipliers</h3>
                <h4 className="font-semibold text-gray-800 mb-2">Tier Bonuses</h4>
                <p className="text-sm text-gray-600">
                  Advance through tiers to multiply your airdrop allocation and unlock exclusive benefits
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 border-orange-200">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Unique Collection</h3>
                <h4 className="font-semibold text-gray-800 mb-2">Travel Memories</h4>
                <p className="text-sm text-gray-600">
                  Each NFT represents a real journey with personalized artwork and ongoing utility
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tier Comparison - Travala Style */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Compare NFT Memberships
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A tier for every type of traveler. Choose your adventure level.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-top">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {tierComparison.map((tier) => (
                  <Card 
                    key={tier.id}
                    className={`relative hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      tier.highlight 
                        ? 'ring-2 ring-orange-500 shadow-lg scale-105' 
                        : 'hover:scale-102'
                    } ${selectedTier === tier.id ? 'ring-2 ring-green-500' : ''}`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    {tier.highlight && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-orange-500 text-white px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${tier.gradient} rounded-full flex items-center justify-center mx-auto mb-4 ${tier.highlight ? 'shadow-lg' : ''}`}>
                        <div className="text-gray-700">
                          {tier.icon}
                        </div>
                      </div>
                      
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {tier.name}
                      </CardTitle>
                      
                      <div className="text-2xl font-bold text-orange-600 mb-2">
                        {tier.price}
                      </div>
                      
                      <CardDescription className="text-gray-600">
                        {tier.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-3 mb-6">
                        {tier.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              benefit.included 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-400'
                            }`}>
                              <Check className="w-3 h-3" />
                            </div>
                            <div className="flex-1">
                              <span className={`text-sm font-medium ${
                                benefit.included ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {benefit.name}
                              </span>
                              <div className={`text-xs ${
                                benefit.included ? 'text-gray-600' : 'text-gray-400'
                              }`}>
                                {benefit.value}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button 
                        className={`w-full ${
                          tier.highlight 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                        size="lg"
                      >
                        {tier.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How You Save - Travala Style Example */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-orange-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How you save up to 25% with <span className="text-orange-600">EXPLORER NFT</span>
              </h2>
              <p className="text-lg text-gray-600">
                See real savings on a $1,000 Tokyo cultural experience
              </p>
            </div>

            <Card className="shadow-2xl border-0">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                  {/* Booking Receipt Style */}
                  <div className="p-8 bg-white">
                    <div className="border-b border-gray-200 pb-6 mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">BOOKING CONFIRMATION</h3>
                      <h4 className="text-xl text-gray-700">Tokyo Cultural Journey</h4>
                      <p className="text-gray-600">3 Night Stay + Activities</p>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Base Package</span>
                        <span className="font-semibold">$1,000.00</span>
                      </div>
                      
                      <div className="flex justify-between text-sm border-l-4 border-green-500 pl-4">
                        <span className="flex items-center text-green-700">
                          <Star className="w-4 h-4 mr-2" />
                          Explorer Member Discount
                        </span>
                        <span className="font-semibold text-green-600">-$100.00</span>
                      </div>
                      
                      <div className="flex justify-between text-sm border-l-4 border-blue-500 pl-4">
                        <span className="flex items-center text-blue-700">
                          <Globe className="w-4 h-4 mr-2" />
                          Amadeus Provider Bonus
                        </span>
                        <span className="font-semibold text-blue-600">-$100.00</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex justify-between text-xl font-bold mb-4">
                        <span>Pay Now</span>
                        <span className="text-orange-600">$800.00</span>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="flex items-center text-green-700">
                            <Camera className="w-4 h-4 mr-2" />
                            NFT Reward Earned
                          </span>
                          <span className="text-green-600">+$100.00</span>
                        </div>
                        
                        <div className="flex justify-between text-xl font-bold text-green-700 mt-2">
                          <span>Effective Cost</span>
                          <span>$700.00</span>
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-2">
                          Plus: Unique "Tokyo Cultural Master" NFT with ongoing rewards
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* NFT Preview */}
                  <div className="p-8 bg-gradient-to-br from-orange-50 to-green-50">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Your NFT Reward Package</h3>
                    
                    <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
                      <img 
                        src="/api/placeholder/300/300" 
                        alt="Tokyo Cultural Master NFT"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <h4 className="font-bold text-gray-900 mb-2">Tokyo Cultural Master</h4>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 mb-3">
                        RARE COLLECTION
                      </Badge>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform Credits</span>
                          <span className="font-semibold text-green-600">+$100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tier Progress</span>
                          <span className="font-semibold text-blue-600">+100 pts</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Collection Value</span>
                          <span className="font-semibold text-purple-600">Growing</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-sm">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">Verified authentic travel experience</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">Ongoing rewards and utility</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Award className="w-4 h-4 text-orange-600" />
                        <span className="text-gray-700">Collectible digital memory</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600">
              A world of travel NFT rewards awaits.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Step 1</h3>
                <h4 className="font-semibold text-gray-800 mb-3">Book Your Journey</h4>
                <p className="text-gray-600">
                  Book hotels, flights, activities or car rentals through any of our 6 integrated providers.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Step 2</h3>
                <h4 className="font-semibold text-gray-800 mb-3">Earn Your NFT</h4>
                <p className="text-gray-600">
                  Automatically receive a unique travel NFT representing your experience with ongoing rewards.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Step 3</h3>
                <h4 className="font-semibold text-gray-800 mb-3">Unlock Benefits</h4>
                <p className="text-gray-600">
                  Use platform credits, access exclusive deals, and advance through tiers for greater rewards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Travala Style */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What NFT members say
            </h2>
            <p className="text-lg text-gray-600">
              Hear from travelers with NFT memberships
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
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

      {/* Provider Integration Showcase */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Earn NFTs across 6 global providers
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Unlike single-platform rewards, earn unique NFTs and credits from every booking, everywhere you travel.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {[
              { name: 'Expedia', bonus: '15%', new: true, color: 'from-blue-500 to-purple-500' },
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
                    +{provider.bonus} NFT bonus
                  </Badge>
                  {provider.new && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
                      New Integration
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Each provider offers unique NFT collections and specialized rewards
            </p>
            <Button size="lg" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
              Explore Provider Collections
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 via-green-500 to-orange-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start earning NFT rewards today
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers building valuable NFT collections with every adventure
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 px-12 py-4 text-lg font-semibold">
              BROWSE COLLECTION
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-12 py-4 text-lg font-semibold">
              <Wallet className="w-5 h-5 mr-2" />
              CONNECT WALLET
            </Button>
          </div>
          
          <p className="text-sm text-orange-200 mt-6">
            Free to browse • Connect wallet when ready to earn
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              {[
                {
                  question: "How much value do I get with NFT rewards?",
                  answer: "You can earn up to 25% back on travel bookings through combined NFT rewards, platform credits, provider bonuses, and tier multipliers. Plus ongoing benefits from your NFT collection."
                },
                {
                  question: "What makes Maku NFTs unique?", 
                  answer: "Each NFT represents a real travel experience with AI-generated artwork, ongoing utility, and rewards. Unlike static avatars, our NFTs evolve and provide continuous value based on your journey."
                },
                {
                  question: "How do I start earning NFT rewards?",
                  answer: "Simply browse our collection, make your first booking through any of our 6 providers, and automatically receive your first travel NFT. No upfront costs or token purchases required."
                },
                {
                  question: "Which providers support NFT rewards?",
                  answer: "All 6 integrated providers: Expedia Group (15% bonus), Amadeus (10%), Viator (12%), Duffle (10%), RateHawk (10%), and Sabre (10%). Each offers unique NFT collections."
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