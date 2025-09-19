import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Users, 
  Target, 
  TrendingUp,
  Award,
  Star,
  Flame,
  Crown
} from 'lucide-react';

import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/features/auth/context/AuthContext';
import { GameStatsCard } from './GameStatsCard';
import { AchievementGrid, AchievementCard } from './AchievementCard';
import { LeaderboardCard, CompactLeaderboard } from './LeaderboardCard';
import { SocialActivityFeed, CompactSocialFeed } from './SocialActivityFeed';
import { ChallengeCard, CompactChallengeCard } from './ChallengeCard';

export const SocialGamificationHub: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('overview');
  
  const {
    userStats,
    achievements,
    leaderboards,
    socialActivity,
    challenges,
    loading,
    error,
    levelProgress,
    unlockedAchievements,
    availableAchievements,
    recentAchievements,
    activeChallenges,
    availableChallenges,
    joinChallenge,
    checkAchievements,
  } = useGamification();

  if (!user) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Join the Community!</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to unlock achievements, compete on leaderboards, and connect with fellow travelers.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In to Play
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive mb-4">Error loading gamification data: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">Level {userStats.level}</div>
              <div className="text-xs opacity-80">{userStats.total_points.toLocaleString()} points</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">{userStats.destinations_collected}</div>
              <div className="text-xs opacity-80">Dream Destinations</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <Award className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">{userStats.achievements_unlocked}</div>
              <div className="text-xs opacity-80">Achievements</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">{userStats.current_streak}</div>
              <div className="text-xs opacity-80">Day Streak</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Gamification Content */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="social">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Stats */}
            <div className="lg:col-span-2">
              {userStats && (
                <GameStatsCard 
                  stats={userStats} 
                  levelProgress={levelProgress}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Recent Achievements */}
              {recentAchievements.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentAchievements.slice(0, 3).map((achievement) => (
                        <div key={achievement.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                          <span className="text-lg">{achievement.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{achievement.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {achievement.points_value} points
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Leaderboard */}
              {leaderboards.length > 0 && (
                <CompactLeaderboard 
                  entries={leaderboards[0].entries.slice(0, 3)}
                  title="Global Ranking"
                />
              )}

              {/* Active Challenges */}
              {activeChallenges.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Active Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activeChallenges.slice(0, 2).map((challenge) => (
                        <CompactChallengeCard 
                          key={challenge.id}
                          challenge={challenge}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Your Achievements</h2>
              <p className="text-muted-foreground">
                {unlockedAchievements.length} unlocked • {availableAchievements.length} available
              </p>
            </div>
            
            <Badge variant="outline" className="bg-primary/10">
              <Trophy className="h-3 w-3 mr-1" />
              {userStats?.achievements_unlocked || 0} Achievements
            </Badge>
          </div>

          {/* Achievement Categories */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="explorer">Explorer</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <AchievementGrid achievements={achievements} />
            </TabsContent>
            
            <TabsContent value="unlocked">
              <AchievementGrid achievements={unlockedAchievements} />
            </TabsContent>
            
            <TabsContent value="available">
              <AchievementGrid achievements={availableAchievements} />
            </TabsContent>
            
            <TabsContent value="explorer">
              <AchievementGrid 
                achievements={achievements.filter(a => a.category === 'explorer')} 
              />
            </TabsContent>
            
            <TabsContent value="social">
              <AchievementGrid 
                achievements={achievements.filter(a => a.category === 'social')} 
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Leaderboards Tab */}
        <TabsContent value="leaderboards" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Leaderboards</h2>
              <p className="text-muted-foreground">
                Compete with travelers worldwide
              </p>
            </div>
            
            {userStats && (
              <Badge variant="outline" className="bg-primary/10">
                <Crown className="h-3 w-3 mr-1" />
                Rank #{userStats.exploration_rank.toLocaleString()}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {leaderboards.map((leaderboard) => (
              <LeaderboardCard
                key={leaderboard.id}
                leaderboard={leaderboard}
                maxEntries={10}
              />
            ))}
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Travel Challenges</h2>
              <p className="text-muted-foreground">
                Complete challenges to earn points and unlock rewards
              </p>
            </div>
            
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <Target className="h-3 w-3 mr-1" />
              {activeChallenges.length} Active
            </Badge>
          </div>

          {/* Active Challenges */}
          {activeChallenges.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Your Active Challenges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Challenges */}
          {availableChallenges.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Available Challenges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onJoin={joinChallenge}
                  />
                ))}
              </div>
            </div>
          )}

          {challenges.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Challenges Available</h3>
                <p className="text-muted-foreground">
                  Check back later for exciting travel challenges!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Social Activity Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Social Activity</h2>
              <p className="text-muted-foreground">
                See what your travel buddies are up to
              </p>
            </div>
            
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Find Friends
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SocialActivityFeed activities={socialActivity} />
            </div>
            
            <div className="space-y-4">
              <CompactSocialFeed activities={socialActivity} maxItems={5} />
              
              {leaderboards.length > 0 && (
                <CompactLeaderboard 
                  entries={leaderboards[0].entries}
                  title="Top This Week"
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};