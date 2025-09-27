import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Eye,
  Wallet,
  Star,
  Trophy,
  Crown,
  Target,
  ChevronRight,
  Play,
  Sparkles,
  Gift,
  Users,
  TrendingUp
} from 'lucide-react';

interface BrowseFirstExperienceProps {
  onConnectWallet?: () => void;
}

const BrowseFirstExperience: React.FC<BrowseFirstExperienceProps> = ({ onConnectWallet }) => {
  const [currentView, setCurrentView] = useState<'browse' | 'demo' | 'ready'>('browse');
  const [demoProgress, setDemoProgress] = useState(0);

  const sampleNFTs = [
    {
      id: 1,
      name: 'Santorini Sunset Explorer',
      destination: 'Santorini, Greece',
      rarity: 'Epic',
      provider: 'Expedia',
      value: '$1,500 booking',
      rewards: '+$200 credits',
      image: '/api/placeholder/300/400'
    },
    {
      id: 2,
      name: 'Tokyo Cultural Master',
      destination: 'Tokyo, Japan', 
      rarity: 'Rare',
      provider: 'Amadeus',
      value: '$1,200 booking',
      rewards: '+$150 credits',
      image: '/api/placeholder/300/400'
    },
    {
      id: 3,
      name: 'Bali Paradise Collection',
      destination: 'Bali, Indonesia',
      rarity: 'Legendary',
      provider: 'Viator',
      value: '$2,100 booking', 
      rewards: '+$350 credits',
      image: '/api/placeholder/300/400'
    }
  ];

  const startDemo = () => {
    setCurrentView('demo');
    // Simulate demo progression
    const interval = setInterval(() => {
      setDemoProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCurrentView('ready');
          return 100;
        }
        return prev + 20;
      });
    }, 800);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return Crown;
      case 'epic': return Trophy;
      case 'rare': return Star;
      default: return Target;
    }
  };

  if (currentView === 'demo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
        <Card className="max-w-2xl mx-auto shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-12 h-12 text-white animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Creating Your Travel NFT Experience
            </h2>
            
            <p className="text-lg text-gray-600 mb-8">
              Simulating a $1,200 Tokyo booking to show your potential rewards...
            </p>

            <div className="space-y-4 mb-8">
              <div className="text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Processing booking...</span>
                  <span className="text-green-600">{demoProgress >= 20 ? '✓' : '⋯'}</span>
                </div>
                <Progress value={Math.min(100, Math.max(0, (demoProgress - 0) * 5))} className="h-2" />
              </div>
              
              <div className="text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Calculating NFT rewards...</span>
                  <span className="text-green-600">{demoProgress >= 40 ? '✓' : '⋯'}</span>
                </div>
                <Progress value={Math.min(100, Math.max(0, (demoProgress - 20) * 5))} className="h-2" />
              </div>
              
              <div className="text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Generating unique artwork...</span>
                  <span className="text-green-600">{demoProgress >= 60 ? '✓' : '⋯'}</span>
                </div>
                <Progress value={Math.min(100, Math.max(0, (demoProgress - 40) * 5))} className="h-2" />
              </div>
              
              <div className="text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Updating tier progress...</span>
                  <span className="text-green-600">{demoProgress >= 80 ? '✓' : '⋯'}</span>
                </div>
                <Progress value={Math.min(100, Math.max(0, (demoProgress - 60) * 5))} className="h-2" />
              </div>
              
              <div className="text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Ready to claim rewards!</span>
                  <span className="text-green-600">{demoProgress >= 100 ? '✓' : '⋯'}</span>
                </div>
                <Progress value={Math.min(100, Math.max(0, (demoProgress - 80) * 5))} className="h-2" />
              </div>
            </div>

            <p className="text-sm text-gray-500">
              This demo shows how you'd earn rewards from a real booking
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
        <Card className="max-w-3xl mx-auto shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Trophy className="w-16 h-16 text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              🎉 Demo Complete!
            </h2>
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Simulated Rewards</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+$120</div>
                  <div className="text-sm text-gray-600">Platform Credits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">+120</div>
                  <div className="text-sm text-gray-600">Tier Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">Rare</div>
                  <div className="text-sm text-gray-600">NFT Earned</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <img 
                  src="/api/placeholder/200/200"
                  alt="Tokyo Cultural Master NFT"
                  className="w-32 h-32 mx-auto rounded-lg mb-4"
                />
                <h4 className="font-bold text-gray-900">Tokyo Cultural Master NFT</h4>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 mt-2">
                  RARE COLLECTION
                </Badge>
              </div>
            </div>

            <p className="text-lg text-gray-600 mb-8">
              Ready to start earning real rewards? Connect your wallet to begin your journey.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={onConnectWallet}
                className="bg-orange-500 hover:bg-orange-600 px-12 py-4 text-lg font-semibold"
              >
                <Wallet className="w-5 h-5 mr-2" />
                CONNECT WALLET & START
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setCurrentView('browse')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-12 py-4 text-lg font-semibold"
              >
                <Eye className="w-5 h-5 mr-2" />
                BROWSE MORE
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Browse First View
  return (
    <div className="space-y-12">
      {/* Browse Collection Header */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Explore travel NFT collections
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          See what you could earn from real travel experiences. No wallet required to browse.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
            <Eye className="w-4 h-4 mr-2" />
            Browse Collection
          </Button>
          <Button onClick={startDemo} className="bg-gradient-to-r from-orange-500 to-green-500 hover:opacity-90">
            <Play className="w-4 h-4 mr-2" />
            See Demo
          </Button>
        </div>
      </div>

      {/* Sample NFT Collection */}
      <div className="grid md:grid-cols-3 gap-8">
        {sampleNFTs.map((nft) => {
          const RarityIcon = getRarityIcon(nft.rarity);
          const rarityColor = getRarityColor(nft.rarity);
          
          return (
            <Card key={nft.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-orange-200">
              <div className="relative">
                <img 
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className={`absolute top-3 right-3 w-10 h-10 bg-gradient-to-br ${rarityColor} rounded-full flex items-center justify-center shadow-lg`}>
                  <RarityIcon className="w-5 h-5 text-white" />
                </div>
                <Badge 
                  variant="secondary" 
                  className="absolute top-3 left-3 bg-black/70 text-white border-none"
                >
                  {nft.rarity.toUpperCase()}
                </Badge>
              </div>
              
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{nft.name}</h3>
                <p className="text-gray-600 mb-4">{nft.destination}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Booking Value</span>
                    <span className="font-medium text-green-600">{nft.value}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Provider</span>
                    <span className="font-medium text-blue-600">{nft.provider}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rewards Earned</span>
                    <span className="font-medium text-purple-600">{nft.rewards}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full border-orange-500 text-orange-600 hover:bg-orange-50">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-orange-500 to-green-500 text-white shadow-2xl">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to start your collection?</h3>
          <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
            Connect your wallet to start earning real travel NFTs and rewards from your next booking
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={onConnectWallet}
              className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 font-semibold"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet & Start Earning
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-3 font-semibold"
            >
              <Users className="w-5 h-5 mr-2" />
              Join Community First
            </Button>
          </div>
          
          <p className="text-sm text-orange-200 mt-4">
            Free to start • Earn from first booking • No hidden fees
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrowseFirstExperience;