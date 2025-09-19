import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Target, 
  MapPin, 
  Calendar,
  TrendingUp,
  Users,
  Flame,
  Star,
  Globe,
  Award
} from 'lucide-react';
import { UserGameStats } from '@/types/gamification-types';
import { cn } from '@/lib/utils';

interface GameStatsCardProps {
  stats: UserGameStats;
  levelProgress: { current: number; next: number; progress: number };
  compact?: boolean;
}

export const GameStatsCard: React.FC<GameStatsCardProps> = ({
  stats,
  levelProgress,
  compact = false,
}) => {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (streak >= 14) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (streak >= 7) return 'text-green-600 bg-green-50 border-green-200';
    if (streak >= 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 10) return { icon: '👑', text: 'Elite', color: 'bg-gradient-to-r from-yellow-400 to-orange-500' };
    if (rank <= 100) return { icon: '🏆', text: 'Expert', color: 'bg-gradient-to-r from-blue-400 to-purple-500' };
    if (rank <= 1000) return { icon: '⭐', text: 'Rising', color: 'bg-gradient-to-r from-green-400 to-blue-500' };
    return { icon: '🎯', text: 'Explorer', color: 'bg-gradient-to-r from-gray-400 to-gray-500' };
  };

  const rankBadge = getRankBadge(stats.exploration_rank);

  if (compact) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold',
                rankBadge.color
              )}>
                {stats.level}
              </div>
              <div>
                <div className="font-semibold">Level {stats.level}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.total_points.toLocaleString()} points
                </div>
              </div>
            </div>
            
            <Badge className={cn('border', getStreakColor(stats.current_streak))}>
              <Flame className="h-3 w-3 mr-1" />
              {stats.current_streak}
            </Badge>
          </div>

          <Progress value={levelProgress.progress} className="h-2 mb-2" />
          <div className="text-xs text-muted-foreground text-center">
            {Math.round(levelProgress.progress)}% to Level {stats.level + 1}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level and Progress Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full text-white text-lg font-bold',
                rankBadge.color
              )}>
                {stats.level}
              </div>
              <div>
                <div className="text-xl font-bold">Level {stats.level}</div>
                <div className="text-sm text-muted-foreground">
                  {rankBadge.text} Explorer
                </div>
              </div>
            </div>
            
            <Badge variant="outline" className="bg-background/50">
              <Trophy className="h-3 w-3 mr-1" />
              #{stats.exploration_rank.toLocaleString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Points Display */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {stats.total_points.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>

          {/* Level Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Level Progress</span>
              <span>{Math.round(levelProgress.progress)}%</span>
            </div>
            <Progress value={levelProgress.progress} className="h-3" />
            <div className="text-xs text-muted-foreground mt-1 text-center">
              {(levelProgress.next - stats.total_points).toLocaleString()} points to Level {stats.level + 1}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Dreams Collected */}
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{stats.destinations_collected}</div>
            <div className="text-xs text-muted-foreground">Dreams</div>
            <Progress 
              value={Math.min((stats.destinations_collected / 100) * 100, 100)} 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>

        {/* Continents */}
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="h-6 w-6 mx-auto mb-2 text-accent" />
            <div className="text-2xl font-bold">{stats.continents_unlocked}</div>
            <div className="text-xs text-muted-foreground">Continents</div>
            <Progress 
              value={(stats.continents_unlocked / 7) * 100} 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{stats.achievements_unlocked}</div>
            <div className="text-xs text-muted-foreground">Achievements</div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{stats.current_streak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
            {stats.current_streak > 0 && (
              <Badge 
                className={cn('mt-1 text-xs', getStreakColor(stats.current_streak))}
              >
                🔥 On Fire!
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Category Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.category_stats).map(([category, categoryStats]) => (
              <div key={category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize font-medium">
                    {category} ({categoryStats.count})
                  </span>
                  <span className="text-muted-foreground">
                    {categoryStats.completion_percentage}% complete
                  </span>
                </div>
                <Progress 
                  value={categoryStats.completion_percentage} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  Avg rarity: {categoryStats.average_rarity}/100
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Continental Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Continental Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(stats.continent_progress).map(([continent, continentStats]) => (
              <div key={continent} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{continent}</span>
                  <Badge variant="outline" className="text-xs">
                    {continentStats.destinations_count} places
                  </Badge>
                </div>
                <Progress 
                  value={continentStats.completion_percentage} 
                  className="h-2 mb-1"
                />
                <div className="text-xs text-muted-foreground">
                  {continentStats.completion_percentage}% explored
                  {continentStats.rare_destinations_count > 0 && (
                    <span className="ml-2">
                      ✨ {continentStats.rare_destinations_count} rare
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social & Rarity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Rarity Score</span>
              </div>
              <div className="text-xl font-bold text-purple-600">
                {stats.rarity_score}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Based on rare destinations collected
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Social Score</span>
              </div>
              <div className="text-xl font-bold text-blue-600">
                {stats.social_score}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Friends and social interactions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Footer */}
      <Card className="border-muted bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-sm font-medium">Longest Streak</div>
              <div className="text-lg font-bold text-orange-500">
                {stats.longest_streak} days
              </div>
            </div>
            
            <div>
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-sm font-medium">Last Activity</div>
              <div className="text-sm text-muted-foreground">
                {new Date(stats.last_activity).toLocaleDateString()}
              </div>
            </div>
            
            <div>
              <Trophy className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-sm font-medium">Global Rank</div>
              <div className="text-lg font-bold text-primary">
                #{stats.exploration_rank.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};