import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Flame, 
  Target, 
  Coins, 
  TrendingUp
} from 'lucide-react';

interface SafeGamificationProps {
  funds: any[];
  onViewAchievements: () => void;
  onClaimReward: (achievementId: string) => void;
}

export const SafeFundGamification: React.FC<SafeGamificationProps> = ({
  funds,
  onViewAchievements,
  onClaimReward
}) => {
  try {
    // Safe calculations with fallbacks
    const totalSaved = funds?.reduce((sum, fund) => sum + (fund?.balance || 0), 0) || 0;
    const totalFunds = funds?.length || 0;
    const completedGoals = funds?.filter(fund => fund?.balance >= fund?.target_amount).length || 0;
    const achievementCount = funds?.filter(fund => (fund?.balance / fund?.target_amount) >= 0.25).length || 0;
    
    // Safe level calculation
    const level = Math.floor(totalSaved / 1000) + 1;
    const currentLevelXP = totalSaved % 1000;
    const levelProgress = (currentLevelXP / 1000) * 100;

    const getLevelBadge = (level: number) => {
      if (level >= 20) return { title: 'Travel Legend', icon: Trophy, color: 'from-yellow-400 to-orange-500' };
      if (level >= 10) return { title: 'Explorer', icon: Star, color: 'from-green-500 to-blue-500' };
      if (level >= 5) return { title: 'Adventurer', icon: Target, color: 'from-blue-500 to-purple-500' };
      return { title: 'Wanderer', icon: Flame, color: 'from-orange-500 to-red-500' };
    };

    const levelBadge = getLevelBadge(level);
    const LevelIcon = levelBadge.icon;

    return (
      <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-orange-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            Travel Fund Achievements
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* User Level Display */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${levelBadge.color} flex items-center justify-center shadow-lg`}>
                <LevelIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{levelBadge.title}</h3>
                <p className="text-sm text-gray-600">Level {level}</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-orange-500 to-green-500 text-white">
              {totalSaved} XP
            </Badge>
          </div>

          {/* Level Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Next Level Progress</span>
              <span className="font-medium">{Math.round(levelProgress)}%</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
            <p className="text-xs text-gray-600 text-center">
              ${1000 - currentLevelXP} needed for Level {level + 1}
            </p>
          </div>
          
          {/* Achievement Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
              <div className="flex items-center justify-center mb-1">
                <Coins className="h-3 w-3 text-orange-500 mr-1" />
                <span className="text-sm font-bold text-orange-600">${totalSaved.toLocaleString()}</span>
              </div>
              <p className="text-xs text-orange-700">Saved</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded border border-green-200">
              <div className="flex items-center justify-center mb-1">
                <Target className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-sm font-bold text-green-600">{totalFunds}</span>
              </div>
              <p className="text-xs text-green-700">Funds</p>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded border border-purple-200">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="h-3 w-3 text-purple-500 mr-1" />
                <span className="text-sm font-bold text-purple-600">{achievementCount}</span>
              </div>
              <p className="text-xs text-purple-700">Achievements</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-3 w-3 text-blue-500 mr-1" />
                <span className="text-sm font-bold text-blue-600">{completedGoals}</span>
              </div>
              <p className="text-xs text-blue-700">Complete</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={onViewAchievements}
              variant="outline"
              size="sm"
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              View Collection
            </Button>
            <Button 
              onClick={() => onClaimReward('sample')}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Claim Rewards
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    // Ultra-safe fallback
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-orange-500" />
          <h3 className="font-semibold mb-2">Achievement System</h3>
          <p className="text-sm text-gray-600 mb-3">Track your savings progress and earn rewards</p>
          <Button onClick={onViewAchievements} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
            View Achievements
          </Button>
        </CardContent>
      </Card>
    );
  }
};

export default SafeFundGamification;