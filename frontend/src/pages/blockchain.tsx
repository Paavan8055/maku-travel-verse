import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { WalletConnect } from '@/components/blockchain/WalletConnect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Award, TrendingUp, Shield, Zap, Gift } from 'lucide-react';

export default function BlockchainPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            MAKU Blockchain Rewards
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect your wallet to access MAKU token rewards, NFT memberships, and exclusive cashback benefits.
          </p>
          <Badge className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            🎭 Mock Testing Mode - No Real Blockchain Needed
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Wallet Connect - Left Column */}
          <div className="lg:col-span-1 order-1">
            <WalletConnect />
          </div>

          {/* Features - Right Columns */}
          <div className="lg:col-span-2 space-y-6 order-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-orange-500" />
                  How MAKU Rewards Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-900">Earn Cashback</h3>
                    </div>
                    <p className="text-sm text-orange-700">
                      Get 1-10% cashback in MAKU tokens on every travel booking based on your tier.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">NFT Memberships</h3>
                    </div>
                    <p className="text-sm text-green-700">
                      Own NFTs to unlock higher cashback rates and exclusive travel perks.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-purple-900">Secure & Transparent</h3>
                    </div>
                    <p className="text-sm text-purple-700">
                      All transactions recorded on Polygon blockchain for transparency and security.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Instant Claims</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      Claim your pending cashback anytime with just one click.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tier Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-6 h-6 text-orange-500" />
                  NFT Membership Tiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { name: 'Bronze', rate: '1%', price: 'FREE', color: 'orange' },
                    { name: 'Silver', rate: '3%', price: '$99', color: 'gray' },
                    { name: 'Gold', rate: '6%', price: '$299', color: 'yellow' },
                    { name: 'Platinum', rate: '10%', price: '$999', color: 'purple' }
                  ].map((tier) => (
                    <div 
                      key={tier.name}
                      className={`p-4 rounded-lg border-2 ${
                        tier.color === 'orange' ? 'border-orange-200 bg-orange-50' :
                        tier.color === 'gray' ? 'border-gray-300 bg-white' :
                        tier.color === 'yellow' ? 'border-yellow-300 bg-yellow-50' :
                        'border-purple-300 bg-purple-50'
                      }`}
                    >
                      <div className="text-center">
                        <Award className={`w-8 h-8 mx-auto mb-2 ${
                          tier.color === 'orange' ? 'text-orange-600' :
                          tier.color === 'gray' ? 'text-gray-500' :
                          tier.color === 'yellow' ? 'text-yellow-600' :
                          'text-purple-600'
                        }`} />
                        <h3 className="font-bold text-gray-900">{tier.name}</h3>
                        <p className="text-2xl font-bold text-orange-600 my-2">
                          {tier.rate}
                        </p>
                        <p className="text-sm text-gray-600">Cashback Rate</p>
                        <Badge className="mt-2" variant="outline">
                          {tier.price}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  💡 Earn higher tiers through bookings or purchase them directly
                </p>
              </CardContent>
            </Card>

            {/* VIP Perks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Platinum Tier VIP Perks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    <span>10% maximum cashback on all bookings</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    <span>Access to invitation-only exclusive stays</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    <span>Free Hugging Face LLM AI travel assistant</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
