import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  Target, 
  Users, 
  Calendar, 
  Trophy, 
  Sparkles,
  MapPin,
  Share2,
  Eye
} from 'lucide-react';

interface FundDisplayProps {
  fund: {
    id: string;
    name: string;
    balance: number;
    target_amount: number;
    destination?: string;
    deadline?: string;
    fund_type: string;
  };
  onContribute: (fundId: string) => void;
  onShare: (fundId: string) => void;
  onViewDetails: (fundId: string) => void;
}

export const MakuEnhancedFundCard: React.FC<FundDisplayProps> = ({
  fund,
  onContribute,
  onShare, 
  onViewDetails
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const progressPercentage = (fund.balance / fund.target_amount) * 100;
  const remainingAmount = fund.target_amount - fund.balance;
  const isCompleted = progressPercentage >= 100;

  const getAchievementLevel = () => {
    if (progressPercentage >= 100) return { icon: '🏆', title: 'Goal Achieved!', color: 'from-yellow-400 to-orange-500' };
    if (progressPercentage >= 75) return { icon: '⚡', title: 'Almost There!', color: 'from-orange-500 to-red-500' };
    if (progressPercentage >= 50) return { icon: '🚀', title: 'Halfway Hero', color: 'from-green-500 to-blue-500' };
    if (progressPercentage >= 25) return { icon: '✨', title: 'Great Start!', color: 'from-blue-500 to-purple-500' };
    return { icon: '🎯', title: 'Getting Started', color: 'from-gray-400 to-gray-500' };
  };

  const achievement = getAchievementLevel();

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-500 cursor-pointer group
        ${isHovered ? 'shadow-2xl scale-[1.03] ring-2 ring-orange-500/50' : 'shadow-lg hover:shadow-xl'}
        ${isCompleted 
          ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-green-50' 
          : 'bg-gradient-to-br from-orange-50 via-white to-green-50'
        }
        border-0 rounded-2xl
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails(fund.id)}
    >
      {/* Destination Hero Section */}
      <div className="relative h-32 overflow-hidden rounded-t-2xl">
        <div className={`
          absolute inset-0 bg-gradient-to-r ${achievement.color} opacity-90
        `} />
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.3)_1px,_transparent_1px)] bg-[length:20px_20px]" />
        </div>
        
        {/* Achievement Badge */}
        <div className="absolute top-3 right-3 transform transition-transform duration-300 group-hover:scale-110">
          <Badge className={`bg-gradient-to-r ${achievement.color} text-white border-none px-3 py-1.5 text-sm font-medium shadow-lg`}>
            {achievement.icon} {achievement.title}
          </Badge>
        </div>
        
        {/* Fund Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/95 text-gray-800 text-xs font-medium backdrop-blur-sm">
            {fund.fund_type === 'group' && <Users className="h-3 w-3 mr-1" />}
            {fund.fund_type === 'personal' && <Target className="h-3 w-3 mr-1" />}
            {fund.fund_type === 'family' && <Users className="h-3 w-3 mr-1" />}
            {fund.fund_type.charAt(0).toUpperCase() + fund.fund_type.slice(1)} Fund
          </Badge>
        </div>
        
        {/* Fund Details Overlay */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-lg font-bold truncate drop-shadow-lg mb-1">
            {fund.name}
          </h3>
          {fund.destination && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 opacity-80" />
              <p className="text-sm opacity-90 drop-shadow-sm">{fund.destination}</p>
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-5 space-y-4">
        {/* Enhanced Progress Visualization */}
        <div>
          <div className="flex justify-between text-sm mb-3">
            <span className="font-semibold text-gray-700">Savings Progress</span>
            <span className="font-bold text-orange-600 text-base">{Math.round(progressPercentage)}%</span>
          </div>
          
          {/* Multi-layered Progress Bar */}
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-1000 relative"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            >
              {/* Shimmer Animation */}
              {progressPercentage < 100 && progressPercentage > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
              )}
            </div>
            
            {/* Milestone Markers */}
            {[25, 50, 75].map((milestone) => (
              <div
                key={milestone}
                className={`
                  absolute top-0 w-1 h-full transition-all duration-300
                  ${progressPercentage >= milestone 
                    ? 'bg-yellow-400 shadow-lg' 
                    : 'bg-gray-400/50'
                  }
                `}
                style={{ left: `${milestone}%` }}
                title={`${milestone}% Milestone`}
              />
            ))}
          </div>
          
          <div className="flex justify-between text-xs text-gray-600">
            <span className="font-medium">${fund.balance.toLocaleString()} saved</span>
            <span className="font-medium">${remainingAmount.toLocaleString()} remaining</span>
          </div>
        </div>
        
        {/* Deadline & Stats */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-600 font-medium">Current</p>
            <p className="text-lg font-bold text-orange-700">
              ${fund.balance.toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium">Goal</p>
            <p className="text-lg font-bold text-green-700">
              ${fund.target_amount.toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Deadline Information */}
        {fund.deadline && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-2 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>Target Date: {new Date(fund.deadline).toLocaleDateString()}</span>
          </div>
        )}
        
        {/* Enhanced Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onContribute(fund.id);
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-semibold py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <Coins className="h-4 w-4 mr-2" />
            Add Contribution
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onShare(fund.id);
              }}
              variant="outline"
              size="sm"
              className="border-orange-500 text-orange-600 hover:bg-orange-50 transition-all duration-200"
            >
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(fund.id);
              }}
              variant="outline" 
              size="sm"
              className="border-green-500 text-green-600 hover:bg-green-50 transition-all duration-200"
            >
              <Eye className="h-3 w-3 mr-1" />
              Details
            </Button>
          </div>
        </div>
        
        {/* NFT Reward Preview (Phase 3 Feature) */}
        {progressPercentage >= 25 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 animate-fade-in">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-700">NFT Reward Available!</p>
                <p className="text-xs text-purple-600">
                  Claim your "{achievement.title}" milestone NFT
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Hover Glow Effect */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-green-500/10 pointer-events-none rounded-2xl" />
      )}
    </Card>
  );
};

export default MakuEnhancedFundCard;