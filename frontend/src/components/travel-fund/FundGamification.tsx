import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Star, 
  Flame, 
  Target, 
  Users, 
  Zap, 
  Crown, 
  Gift,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  nftReward?: {
    template: string;
    rarity: string;
  };
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  level: number;
  totalXP: number;
  nextLevelXP: number;
  currentStreak: number;
  totalContributions: number;
  totalFundsCreated: number;
  totalGoalsAchieved: number;
}

interface FundGamificationProps {
  fundId: string;
  userStats: UserStats;
  achievements: Achievement[];
  onClaimReward: (achievementId: string) => void;
  onViewNFTCollection: () => void;
}

export const FundGamification: React.FC<FundGamificationProps> = ({
  fundId,
  userStats,
  achievements,
  onClaimReward,
  onViewNFTCollection
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);
  
  const currentLevelProgress = ((userStats.totalXP % userStats.nextLevelXP) / userStats.nextLevelXP) * 100;
  const unclaimedAchievements = achievements.filter(a => a.unlockedAt && !a.nftReward?.template);
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600';
      case 'rare': return 'from-blue-500 to-blue-600';
      case 'epic': return 'from-purple-500 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getLevelBadge = (level: number) => {
    if (level >= 50) return { title: 'Travel Legend', icon: Crown, color: 'from-yellow-400 to-orange-500' };
    if (level >= 30) return { title: 'Journey Master', icon: Trophy, color: 'from-purple-500 to-pink-500' };
    if (level >= 20) return { title: 'Adventure Expert', icon: Star, color: 'from-blue-500 to-cyan-500' };
    if (level >= 10) return { title: 'Explorer', icon: Target, color: 'from-green-500 to-emerald-500' };
    return { title: 'Wanderer', icon: Sparkles, color: 'from-orange-500 to-red-500' };
  };

  const levelBadge = getLevelBadge(userStats.level);
  const LevelIcon = levelBadge.icon;

  return (
    <div className="space-y-6">
      {/* User Level & XP */}
      <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${levelBadge.color} flex items-center justify-center`}>
                <LevelIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{levelBadge.title}</CardTitle>
                <p className="text-sm text-gray-600">Level {userStats.level}</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-orange-500 to-green-500 text-white border-none">
              {userStats.totalXP.toLocaleString()} XP
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* XP Progress to Next Level */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Next Level Progress</span>
              <span className="font-medium">{Math.round(currentLevelProgress)}%</span>
            </div>
            <Progress value={currentLevelProgress} className="h-3">
              <div className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-500" />
            </Progress>
            <p className="text-xs text-gray-600 text-center">
              {userStats.nextLevelXP - (userStats.totalXP % userStats.nextLevelXP)} XP until Level {userStats.level + 1}
            </p>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Flame className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-lg font-bold text-orange-600">{userStats.currentStreak}</span>
              </div>
              <p className="text-xs text-gray-600">Day Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Coins className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-lg font-bold text-green-600">{userStats.totalContributions}</span>
              </div>
              <p className="text-xs text-gray-600">Contributions</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-lg font-bold text-yellow-600">{userStats.totalGoalsAchieved}</span>
              </div>
              <p className="text-xs text-gray-600">Goals Met</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Achievements */}
      {unclaimedAchievements.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Gift className="h-5 w-5" />
              New Achievements Unlocked!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unclaimedAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} flex items-center justify-center`}>
                      <span className="text-lg">{achievement.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {achievement.rarity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-green-600 font-medium">
                          +{achievement.xpReward} XP
                        </span>
                        {achievement.nftReward && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                            NFT Reward
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => onClaimReward(achievement.id)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    Claim
                  </Button>
                </div>
              ))}
            </div>
            
            {unclaimedAchievements.length > 3 && (
              <Button variant="outline" className="w-full mt-3" onClick={onViewNFTCollection}>
                View All Achievements ({unclaimedAchievements.length})
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Achievement Progress Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Progress Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.filter(a => !a.unlockedAt && a.progress !== undefined).slice(0, 3).map((achievement) => (
              <div key={achievement.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{achievement.icon}</span>
                    <span className="font-medium text-gray-900">{achievement.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {achievement.progress}/{achievement.maxProgress}
                  </Badge>
                </div>
                <Progress 
                  value={(achievement.progress! / achievement.maxProgress!) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-gray-600">{achievement.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Celebration Animation Overlay */}
      {showCelebration && recentAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <Card className="w-96 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
              <h3 className="text-xl mb-2">{recentAchievement.title}</h3>
              <p className="text-sm opacity-90 mb-4">{recentAchievement.description}</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge className="bg-white/20 text-white">
                  +{recentAchievement.xpReward} XP
                </Badge>
                {recentAchievement.nftReward && (
                  <Badge className="bg-purple-600 text-white">
                    NFT Reward
                  </Badge>
                )}
              </div>
              <Button 
                onClick={() => setShowCelebration(false)}
                className="bg-white text-orange-600 hover:bg-gray-100"
              >
                Amazing!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FundGamification;