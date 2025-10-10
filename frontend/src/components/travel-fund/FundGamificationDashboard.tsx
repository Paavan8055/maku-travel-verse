import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Crown, 
  Flame, 
  Target, 
  Coins, 
  TrendingUp,
  Zap,
  Gift,
  Users,
  Calendar
} from 'lucide-react';

interface UserGamificationStats {
  totalSaved: number;
  totalFunds: number;
  completedGoals: number;
  contributionStreak: number;
  level: number;
  xp: number;
  nextLevelXP: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

interface FundGamificationDashboardProps {
  funds: any[];
  onViewAchievements: () => void;
  onClaimReward: (achievementId: string) => void;
}

export const FundGamificationDashboard: React.FC<FundGamificationDashboardProps> = ({
  funds,
  onViewAchievements,
  onClaimReward
}) => {
  const [userStats, setUserStats] = useState<UserGamificationStats | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Calculate user stats from funds data
  useEffect(() => {
    const totalSaved = funds.reduce((sum, fund) => sum + fund.balance, 0);
    const completedGoals = funds.filter(fund => fund.balance >= fund.target_amount).length;
    const contributionStreak = 15; // Mock data - would come from API
    
    // Calculate level based on total saved (every $1000 = 1 level)
    const level = Math.floor(totalSaved / 1000) + 1;
    const currentLevelXP = totalSaved % 1000;
    const nextLevelXP = 1000;

    // Generate achievements based on user activity
    const achievements: Achievement[] = [
      {
        id: 'first_fund',
        title: 'Fund Pioneer',
        description: 'Created your first travel fund',
        icon: '🎯',
        rarity: 'common',
        xpReward: 100,
        progress: funds.length > 0 ? 1 : 0,
        maxProgress: 1,
        unlockedAt: funds.length > 0 ? new Date() : undefined
      },
      {
        id: 'first_milestone',
        title: 'Dream Starter',
        description: 'Reached 25% of any fund goal',
        icon: '✨',
        rarity: 'rare',
        xpReward: 250,
        progress: funds.filter(fund => (fund.balance / fund.target_amount) >= 0.25).length,
        maxProgress: 1,
        unlockedAt: funds.some(fund => (fund.balance / fund.target_amount) >= 0.25) ? new Date() : undefined
      },
      {
        id: 'halfway_hero',
        title: 'Halfway Hero',
        description: 'Reached 50% of any fund goal',
        icon: '🚀',
        rarity: 'epic',
        xpReward: 500,
        progress: funds.filter(fund => (fund.balance / fund.target_amount) >= 0.5).length,
        maxProgress: 1,
        unlockedAt: funds.some(fund => (fund.balance / fund.target_amount) >= 0.5) ? new Date() : undefined
      },
      {
        id: 'goal_crusher',
        title: 'Goal Crusher',
        description: 'Completed your first travel fund goal',
        icon: '🏆',
        rarity: 'legendary',
        xpReward: 1000,
        progress: completedGoals,
        maxProgress: 1,
        unlockedAt: completedGoals > 0 ? new Date() : undefined
      }
    ];

    setUserStats({
      totalSaved,
      totalFunds: funds.length,
      completedGoals,
      contributionStreak,
      level,
      xp: currentLevelXP,
      nextLevelXP,
      achievements
    });
  }, [funds]);

  if (!userStats) {
    return (
      <div className="animate-pulse">
        <Card>
          <CardContent className="p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getLevelBadge = (level: number) => {
    if (level >= 20) return { title: 'Travel Legend', icon: Crown, color: 'from-yellow-400 to-orange-500' };
    if (level >= 15) return { title: 'Journey Master', icon: Trophy, color: 'from-purple-500 to-pink-500' };
    if (level >= 10) return { title: 'Adventure Expert', icon: Star, color: 'from-blue-500 to-cyan-500' };
    if (level >= 5) return { title: 'Explorer', icon: Target, color: 'from-green-500 to-emerald-500' };
    return { title: 'Wanderer', icon: Flame, color: 'from-orange-500 to-red-500' };
  };

  const levelBadge = getLevelBadge(userStats.level);
  const LevelIcon = levelBadge.icon;
  const levelProgress = (userStats.xp / userStats.nextLevelXP) * 100;
  const unlockedAchievements = userStats.achievements.filter(a => a.unlockedAt && !a.unlockedAt);

  return (
    <div className="space-y-6">
      {/* User Level & Progress */}
      <Card className="bg-gradient-to-r from-orange-50 via-yellow-50 to-green-50 border-orange-200 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${levelBadge.color} flex items-center justify-center shadow-lg`}>
                <LevelIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                  {levelBadge.title}
                </CardTitle>
                <p className="text-sm text-gray-600 font-medium">Level {userStats.level}</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-orange-500 to-green-500 text-white border-none px-4 py-2 text-sm font-semibold shadow-lg">
              {userStats.xp + (userStats.level - 1) * 1000} Total XP
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* XP Progress to Next Level */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Next Level Progress</span>
              <span className="font-bold text-orange-600">{Math.round(levelProgress)}%</span>
            </div>
            <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${levelProgress}%` }}
              />
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse opacity-50" />
            </div>
            <p className="text-xs text-gray-600 text-center mt-1">
              ${userStats.nextLevelXP - userStats.xp} needed for Level {userStats.level + 1}
            </p>
          </div>
          
          {/* Achievement Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-orange-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Flame className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-lg font-bold text-orange-600">{userStats.contributionStreak}</span>
              </div>
              <p className="text-xs text-gray-600">Day Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Coins className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-lg font-bold text-green-600">${userStats.totalSaved.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-600">Total Saved</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Target className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-lg font-bold text-blue-600">{userStats.totalFunds}</span>
              </div>
              <p className="text-xs text-gray-600">Active Funds</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-lg font-bold text-purple-600">{userStats.completedGoals}</span>
              </div>
              <p className="text-xs text-gray-600">Goals Met</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Gift className="h-5 w-5" />
              New Achievements Unlocked!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unlockedAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg">
                      {achievement.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                          {achievement.rarity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-green-600 font-medium">
                          +{achievement.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onClaimReward(achievement.id)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Claim NFT
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Progress */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Achievement Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userStats.achievements.filter(a => !a.unlockedAt).slice(0, 3).map((achievement) => (
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
                  value={(achievement.progress / achievement.maxProgress) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-gray-600">{achievement.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundGamificationDashboard;