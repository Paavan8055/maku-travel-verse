import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface SafeFundCardProps {
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

export const SafeEnhancedFundCard: React.FC<SafeFundCardProps> = ({
  fund,
  onContribute,
  onShare, 
  onViewDetails
}) => {
  try {
    const progressPercentage = fund.target_amount > 0 ? (fund.balance / fund.target_amount) * 100 : 0;
    const remainingAmount = Math.max(0, fund.target_amount - fund.balance);
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
          relative overflow-hidden transition-all duration-300 cursor-pointer group hover:shadow-xl
          ${isCompleted 
            ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-green-50 border-yellow-200' 
            : 'bg-gradient-to-br from-orange-50 via-white to-green-50 border-orange-200'
          }
          rounded-xl shadow-lg
        `}
        onClick={() => onViewDetails(fund.id)}
      >
        {/* Hero Section */}
        <div className="relative h-24 overflow-hidden rounded-t-xl">
          <div className={`absolute inset-0 bg-gradient-to-r ${achievement.color} opacity-90`} />
          
          {/* Achievement Badge */}
          <div className="absolute top-2 right-2">
            <Badge className={`bg-gradient-to-r ${achievement.color} text-white border-none px-2 py-1 text-xs`}>
              {achievement.icon} {achievement.title}
            </Badge>
          </div>
          
          {/* Fund Type Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-800 text-xs">
              {fund.fund_type === 'group' && <Users className="h-3 w-3 mr-1" />}
              {fund.fund_type === 'personal' && <Target className="h-3 w-3 mr-1" />}
              {fund.fund_type.charAt(0).toUpperCase() + fund.fund_type.slice(1)}
            </Badge>
          </div>
          
          {/* Fund Details */}
          <div className="absolute bottom-2 left-2 right-2 text-white">
            <h3 className="text-sm font-bold truncate drop-shadow-md">
              {fund.name || 'Travel Fund'}
            </h3>
            {fund.destination && (
              <div className="flex items-center gap-1">
                <MapPin className="h-2 w-2 opacity-80" />
                <p className="text-xs opacity-90">{fund.destination}</p>
              </div>
            )}
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          {/* Progress Section */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Progress</span>
              <span className="font-bold text-orange-600">{Math.round(progressPercentage)}%</span>
            </div>
            
            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
              
              {/* Milestone Markers */}
              {[25, 50, 75].map((milestone) => (
                <div
                  key={milestone}
                  className={`absolute top-0 w-0.5 h-full ${progressPercentage >= milestone ? 'bg-yellow-400' : 'bg-gray-300'}`}
                  style={{ left: `${milestone}%` }}
                />
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>${(fund.balance || 0).toLocaleString()} saved</span>
              <span>${remainingAmount.toLocaleString()} remaining</span>
            </div>
          </div>
          
          {/* Amount Display */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-600">Current</p>
              <p className="text-lg font-bold text-orange-700">
                ${(fund.balance || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600">Goal</p>
              <p className="text-lg font-bold text-green-700">
                ${(fund.target_amount || 0).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Deadline */}
          {fund.deadline && (
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <Calendar className="h-3 w-3" />
              <span>Target: {new Date(fund.deadline).toLocaleDateString()}</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onContribute(fund.id);
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Coins className="h-3 w-3 mr-2" />
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
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
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
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>
            </div>
          </div>
          
          {/* NFT Reward Hint */}
          {progressPercentage >= 25 && (
            <div className="mt-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded border border-purple-200">
              <div className="flex items-center gap-2">
                <Trophy className="h-3 w-3 text-purple-600" />
                <p className="text-xs font-medium text-purple-700">Milestone NFT Available!</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    // Fallback to basic card if enhanced version fails
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">{fund.name || 'Travel Fund'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Balance:</span>
              <span className="font-bold">${(fund.balance || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Goal:</span>
              <span className="font-bold">${(fund.target_amount || 0).toLocaleString()}</span>
            </div>
            <Progress value={fund.target_amount > 0 ? (fund.balance / fund.target_amount) * 100 : 0} />
            <Button onClick={() => onContribute(fund.id)} className="w-full">
              Contribute
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default SafeEnhancedFundCard;