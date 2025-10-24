import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Gift, 
  MapPin, 
  Calendar,
  Zap,
  Crown,
  Award,
  Sparkles,
  Coins,
  Target,
  TrendingUp
} from 'lucide-react';

interface NFTReward {
  id: string;
  name: string;
  type: 'booking' | 'experience' | 'milestone' | 'social';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    booking_value?: number;
    provider_count?: number;
    social_actions?: number;
    destination_count?: number;
  };
  rewards: {
    platform_credits: number;
    priority_access: boolean;
    exclusive_content: boolean;
    discount_percentage: number;
  };
  progress: number;
  image: string;
  unlocked: boolean;
}

interface TravelRewardsNFTProps {
  variant?: 'full' | 'compact';
}

const TravelRewardsNFT: React.FC<TravelRewardsNFTProps> = ({ variant = 'full' }) => {
  const [nftRewards] = useState<NFTReward[]>([
    {
      id: 'expedia_master',
      name: 'Expedia Group Master Explorer',
      type: 'booking',
      rarity: 'epic',
      requirements: {
        booking_value: 2000,
        provider_count: 1
      },
      rewards: {
        platform_credits: 300,
        priority_access: true,
        exclusive_content: true,
        discount_percentage: 15
      },
      progress: 45,
      image: '/api/placeholder/300/400',
      unlocked: false
    },
    {
      id: 'multi_provider_champion',
      name: 'Multi-Provider Champion',
      type: 'experience',
      rarity: 'rare',
      requirements: {
        provider_count: 4,
        booking_value: 1000
      },
      rewards: {
        platform_credits: 200,
        priority_access: true,
        exclusive_content: false,
        discount_percentage: 10
      },
      progress: 75,
      image: '/api/placeholder/300/400',
      unlocked: false
    },
    {
      id: 'dream_collector',
      name: 'Smart Dreams Collector',
      type: 'milestone',
      rarity: 'legendary',
      requirements: {
        destination_count: 25,
        social_actions: 10
      },
      rewards: {
        platform_credits: 500,
        priority_access: true,
        exclusive_content: true,
        discount_percentage: 20
      },
      progress: 92,
      image: '/api/placeholder/300/400',
      unlocked: false
    },
    {
      id: 'social_influencer',
      name: 'Travel Social Influencer',
      type: 'social',
      rarity: 'rare',
      requirements: {
        social_actions: 50,
        destination_count: 15
      },
      rewards: {
        platform_credits: 250,
        priority_access: false,
        exclusive_content: true,
        discount_percentage: 12
      },
      progress: 88,
      image: '/api/placeholder/300/400',
      unlocked: false
    }
  ]);

  const getRarityConfig = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return {
          color: 'from-yellow-400 to-orange-500',
          icon: Crown,
          glow: 'shadow-yellow-200',
          border: 'border-yellow-300'
        };
      case 'epic':
        return {
          color: 'from-purple-400 to-pink-500',
          icon: Trophy,
          glow: 'shadow-purple-200',
          border: 'border-purple-300'
        };
      case 'rare':
        return {
          color: 'from-blue-400 to-cyan-500',
          icon: Star,
          glow: 'shadow-blue-200',
          border: 'border-blue-300'
        };
      default:
        return {
          color: 'from-gray-400 to-gray-500',
          icon: Award,
          glow: 'shadow-gray-200',
          border: 'border-gray-300'
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return MapPin;
      case 'experience': return Sparkles;
      case 'milestone': return Target;
      case 'social': return Star;
      default: return Gift;
    }
  };

  if (variant === 'compact') {
    return (
      <Card className="w-full bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 border-2 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>Travel Rewards NFT</span>
          </CardTitle>
          <CardDescription>Earn unique NFTs for your travel achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {nftRewards.slice(0, 4).map((reward) => {
              const config = getRarityConfig(reward.rarity);
              const IconComponent = config.icon;
              return (
                <div key={reward.id} className="text-center p-3 border border-gray-200 rounded-lg hover:bg-white/60">
                  <div className={`w-8 h-8 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-900 truncate">{reward.name}</p>
                  <Progress value={reward.progress} className="h-1 mt-1" />
                  <p className="text-xs text-gray-600 mt-1">{reward.progress}% Complete</p>
                </div>
              );
            })}
          </div>
          <Button size="sm" className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            View Full Collection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{nftRewards.filter(r => r.unlocked).length}</div>
              <div className="text-sm text-gray-600">Unlocked NFTs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{nftRewards.reduce((acc, r) => acc + r.rewards.platform_credits, 0)}</div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{Math.round(nftRewards.reduce((acc, r) => acc + r.progress, 0) / nftRewards.length)}%</div>
              <div className="text-sm text-gray-600">Avg Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{nftRewards.filter(r => r.rarity === 'legendary' || r.rarity === 'epic').length}</div>
              <div className="text-sm text-gray-600">Rare NFTs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NFT Rewards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {nftRewards.map((reward) => {
          const config = getRarityConfig(reward.rarity);
          const RarityIcon = config.icon;
          const TypeIcon = getTypeIcon(reward.type);
          
          return (
            <Card 
              key={reward.id} 
              className={`hover:shadow-xl transition-all duration-300 ${config.glow} hover:${config.border} ${reward.unlocked ? 'bg-gradient-to-br from-white via-green-50/30 to-blue-50/30' : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'}`}
            >
              <div className="relative">
                <img 
                  src={reward.image} 
                  alt={reward.name}
                  className={`w-full h-48 object-cover rounded-t-lg ${reward.unlocked ? '' : 'grayscale opacity-60'}`}
                />
                <div className={`absolute top-3 right-3 w-10 h-10 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center shadow-lg`}>
                  <RarityIcon className="w-5 h-5 text-white" />
                </div>
                <Badge 
                  variant="secondary" 
                  className={`absolute top-3 left-3 ${reward.unlocked ? 'bg-green-100 text-green-800 border-green-200' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  {reward.rarity.toUpperCase()}
                </Badge>
                {reward.unlocked && (
                  <div className="absolute inset-0 bg-green-500/10 rounded-t-lg flex items-center justify-center">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Unlocked!
                    </div>
                  </div>
                )}
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <TypeIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600 capitalize">{reward.type}</span>
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900 mb-3">{reward.name}</h3>
                
                {/* Requirements */}
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Requirements:</h4>
                  {reward.requirements.booking_value && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Bookings</span>
                      <span className="font-medium">${reward.requirements.booking_value}</span>
                    </div>
                  )}
                  {reward.requirements.provider_count && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Providers Used</span>
                      <span className="font-medium">{reward.requirements.provider_count}</span>
                    </div>
                  )}
                  {reward.requirements.destination_count && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Destinations</span>
                      <span className="font-medium">{reward.requirements.destination_count}</span>
                    </div>
                  )}
                  {reward.requirements.social_actions && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Social Actions</span>
                      <span className="font-medium">{reward.requirements.social_actions}</span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{reward.progress}%</span>
                  </div>
                  <Progress value={reward.progress} className="h-2" />
                </div>

                {/* Rewards */}
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Rewards:</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Platform Credits</span>
                    <span className="font-medium text-green-600">+{reward.rewards.platform_credits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-blue-600">{reward.rewards.discount_percentage}%</span>
                  </div>
                  {reward.rewards.priority_access && (
                    <div className="flex items-center space-x-1 text-sm text-purple-600">
                      <Zap className="w-3 h-3" />
                      <span>Priority Access</span>
                    </div>
                  )}
                </div>

                <Button 
                  size="sm" 
                  className={`w-full ${reward.unlocked ? 'bg-green-600 hover:bg-green-700' : `bg-gradient-to-r ${config.color} hover:opacity-90`}`}
                  disabled={reward.unlocked}
                >
                  {reward.unlocked ? 'Claimed' : reward.progress === 100 ? 'Claim NFT' : 'Continue Progress'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TravelRewardsNFT;