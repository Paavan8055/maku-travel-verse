import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Target, 
  Calendar, 
  TrendingUp, 
  Coins, 
  Share2, 
  Eye,
  MapPin,
  Sparkles,
  Trophy,
  Zap
} from 'lucide-react';

interface TravelFund {
  id: string;
  name: string;
  destination: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string;
  contributors: Array<{
    id: string;
    name: string;
    avatar?: string;
    contribution: number;
  }>;
  description?: string;
  fundType: 'personal' | 'group' | 'family';
  heroImage?: string;
}

interface EnhancedFundCardProps {
  fund: TravelFund;
  onContribute: (fundId: string) => void;
  onShare: (fundId: string) => void;
  onView: (fundId: string) => void;
}

export const EnhancedFundCard: React.FC<EnhancedFundCardProps> = ({
  fund,
  onContribute,
  onShare,
  onView
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const progressPercentage = (fund.currentAmount / fund.targetAmount) * 100;
  const daysRemaining = Math.ceil((new Date(fund.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const remainingAmount = fund.targetAmount - fund.currentAmount;
  
  // Calculate achievement status
  const getAchievementBadge = () => {
    if (progressPercentage >= 100) return { icon: Trophy, text: 'Goal Achieved!', color: 'bg-gradient-to-r from-yellow-400 to-orange-500' };
    if (progressPercentage >= 75) return { icon: Zap, text: 'Almost There!', color: 'bg-gradient-to-r from-orange-500 to-red-500' };
    if (progressPercentage >= 50) return { icon: TrendingUp, text: 'Halfway Hero', color: 'bg-gradient-to-r from-green-500 to-blue-500' };
    if (progressPercentage >= 25) return { icon: Sparkles, text: 'Great Start!', color: 'bg-gradient-to-r from-blue-500 to-purple-500' };
    return { icon: Target, text: 'Dream Started', color: 'bg-gradient-to-r from-gray-500 to-gray-600' };
  };

  const achievement = getAchievementBadge();
  const AchievementIcon = achievement.icon;

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer group ${
        isHovered ? 'ring-2 ring-orange-500/50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView(fund.id)}
    >
      {/* Hero Image Background with Overlay */}
      <div className="relative h-48 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{
            backgroundImage: fund.heroImage 
              ? `url(${fund.heroImage})`
              : `linear-gradient(135deg, #f97316 0%, #22c55e 100%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Achievement Badge */}
        <div className="absolute top-4 right-4">
          <Badge className={`${achievement.color} text-white border-none px-3 py-1 flex items-center gap-1`}>
            <AchievementIcon className="h-3 w-3" />
            {achievement.text}
          </Badge>
        </div>
        
        {/* Fund Type Badge */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/90 text-gray-800">
            {fund.fundType === 'group' && <Users className="h-3 w-3 mr-1" />}
            {fund.fundType === 'family' && <Users className="h-3 w-3 mr-1" />}
            {fund.fundType === 'personal' && <Target className="h-3 w-3 mr-1" />}
            {fund.fundType.charAt(0).toUpperCase() + fund.fundType.slice(1)} Fund
          </Badge>
        </div>
        
        {/* Destination & Fund Name */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 text-white mb-2">
            <MapPin className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-medium">{fund.destination}</span>
          </div>
          <h3 className="text-xl font-bold text-white truncate">
            {fund.name}
          </h3>
        </div>
      </div>
      
      <CardContent className="p-6">
        {/* Circular Progress Visualization */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Circular Progress Ring */}
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - progressPercentage / 100)}`}
                  className="text-orange-500 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            </div>
            
            {/* Progress Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Coins className="h-4 w-4 text-green-500" />
                <span>${fund.currentAmount.toLocaleString()} raised</span>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                ${remainingAmount.toLocaleString()} to go
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span>{daysRemaining > 0 ? `${daysRemaining} days left` : 'Goal deadline passed'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Linear Progress Bar with Gradient */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress to Goal</span>
            <span>${fund.targetAmount.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-1000 relative"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            >
              {/* Shimmer effect for active progress */}
              {progressPercentage < 100 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              )}
            </div>
          </div>
        </div>
        
        {/* Contributors Section */}
        {fund.contributors.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Contributors</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-600">
                {fund.contributors.length} {fund.contributors.length === 1 ? 'person' : 'people'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              {fund.contributors.slice(0, 6).map((contributor, index) => (
                <div key={contributor.id} className="relative">
                  <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                    <AvatarImage src={contributor.avatar} />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-orange-500 to-green-500 text-white">
                      {contributor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white" />
                  )}
                </div>
              ))}
              
              {fund.contributors.length > 6 && (
                <div className="flex items-center justify-center h-8 w-8 bg-white rounded-full border-2 border-white text-xs font-medium text-gray-600">
                  +{fund.contributors.length - 6}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onContribute(fund.id);
            }}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Coins className="h-4 w-4 mr-2" />
            Contribute
          </Button>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onShare(fund.id);
            }}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onView(fund.id);
            }}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        
        {/* NFT Reward Preview (if eligible) */}
        {progressPercentage >= 25 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-700">NFT Reward Available!</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Mint your "{achievement.text}" NFT to commemorate this milestone
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedFundCard;